//! Ox's WebAssembly ABI and host bridge over [`evm2`].
//!
//! This crate owns the boundary and nothing behind it: a versioned binary ABI,
//! a host adapter for evm2's `Database` trait, lossless failure encoding, and
//! the runtime glue `no_std` needs. EVM execution, gas accounting, transaction
//! validation, journaling, precompiles, and fork behavior are evm2's.
//!
//! One engine lives per WebAssembly instance, matching evm2's owned `Evm`.

// The shipped artifact is `no_std`. Host builds keep `std` so `cargo test` can
// cover the ABI and failure encodings without a WebAssembly runtime.
#![cfg_attr(target_arch = "wasm32", no_std)]

extern crate alloc;

mod abi;
mod database;
mod error;
mod features;
mod state;

use crate::{
    abi::{Reader, Writer, op},
    database::{HostDb, HostError},
    error::status,
};
use alloc::vec::Vec;
use alloy_consensus::{EthereumTxEnvelope, TxEip4844, transaction::Recovered};
use alloy_eips::eip2718::Decodable2718;
use core::{
    cell::UnsafeCell,
    sync::atomic::{AtomicBool, Ordering},
};
use alloy_primitives::Address;
use evm2::{
    AnyError, BaseEvmTypes, Evm, ExecutionConfig, Precompiles, SpecId, TxResult, Version,
    registry::HandlerError,
    env::BlockEnvExt,
    ethereum::{TxEnvelope, ethereum_tx_registry},
    evm::{Db, ExecutedTx},
    version::GasId,
};

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOCATOR: dlmalloc::GlobalDlmalloc = dlmalloc::GlobalDlmalloc;

/// `panic = "abort"` still needs a handler in a `no_std` cdylib. A panic is an
/// adapter bug, so it traps and the binding reports it as a trap.
#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

/// Adapter state for this WebAssembly instance.
struct Adapter {
    request: Vec<u8>,
    response: Vec<u8>,
}

impl Adapter {
    const fn new() -> Self {
        Self { request: Vec::new(), response: Vec::new() }
    }
}

/// The engine, held apart from [`Adapter`] so an outstanding [`ExecutedTx`] can
/// borrow it without aliasing the adapter borrow every export takes.
struct EngineSlot(UnsafeCell<Option<Evm<'static, BaseEvmTypes>>>);

// Single-threaded, and `RUNNING` serializes every access.
unsafe impl Sync for EngineSlot {}

static ENGINE: EngineSlot = EngineSlot(UnsafeCell::new(None));

/// An executed transaction awaiting resolution.
///
/// This holds the engine's exclusive borrow between two host calls, which is
/// what `ExecutedTx` does in Rust within one scope. While it is `Some`, every
/// operation reaching the engine directly is refused with
/// [`status::ENGINE_BORROWED`], so only one path to the engine exists at a time.
struct ExecutedSlot(UnsafeCell<Option<ExecutedTx<'static, 'static, BaseEvmTypes>>>);

unsafe impl Sync for ExecutedSlot {}

static EXECUTED: ExecutedSlot = ExecutedSlot(UnsafeCell::new(None));

/// Borrows the engine, or reports why it is unavailable.
///
/// SAFETY: callers hold the [`RUNNING`] claim, and the borrow is refused while
/// [`EXECUTED`] is `Some`, so this never aliases the handle's own borrow.
fn engine() -> Result<&'static mut Evm<'static, BaseEvmTypes>, u16> {
    if executed().is_some() {
        return Err(status::ENGINE_BORROWED);
    }
    unsafe { (*ENGINE.0.get()).as_mut() }.ok_or(status::ENGINE_MISSING)
}

/// Replaces the engine, refusing while an executed transaction borrows it.
fn set_engine(value: Option<Evm<'static, BaseEvmTypes>>) -> Result<(), u16> {
    if executed().is_some() {
        return Err(status::ENGINE_BORROWED);
    }
    unsafe { *ENGINE.0.get() = value };
    Ok(())
}

fn executed() -> &'static mut Option<ExecutedTx<'static, 'static, BaseEvmTypes>> {
    unsafe { &mut *EXECUTED.0.get() }
}

struct Slot(UnsafeCell<Adapter>);

// WebAssembly instances are single-threaded, and `RUNNING` is what keeps the
// exclusive borrow below from overlapping with a reentrant call.
unsafe impl Sync for Slot {}

static ADAPTER: Slot = Slot(UnsafeCell::new(Adapter::new()));

/// Set while an export holds the exclusive adapter borrow.
///
/// A host database callback runs with that borrow live, so a callback that
/// reenters an export must be refused rather than allowed to alias it. The flag
/// lives outside [`Adapter`] so the check happens before the borrow exists.
static RUNNING: AtomicBool = AtomicBool::new(false);

/// Claims the adapter, or returns `None` when an export is already running.
///
/// A panic traps rather than unwinding, so a trap leaves the flag set and the
/// instance unusable. That is the intended outcome: a panic here is an adapter
/// bug, and the binding discards the instance.
fn claim() -> Option<&'static mut Adapter> {
    if RUNNING.compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
        return None;
    }
    // SAFETY: `RUNNING` was false and is now true, so no other borrow is live,
    // and WebAssembly gives us no other thread that could take one.
    Some(unsafe { &mut *ADAPTER.0.get() })
}

/// Releases the adapter claimed by [`claim`].
fn release() {
    RUNNING.store(false, Ordering::Release);
}

/// Returns the ABI version this module implements.
#[unsafe(no_mangle)]
pub extern "C" fn ox_abi_version() -> u32 {
    u32::from(abi::VERSION)
}

/// Response handed to a reentrant caller, which cannot be given the adapter's
/// own response buffer.
static BUSY: [u8; abi::HEADER_SIZE] = abi::header(status::ENGINE_BUSY);

/// Reserves `length` request bytes and returns their address.
///
/// Returns `0` when the length is over [`abi::MAX_REQUEST`] or a host callback
/// reentered the adapter. The address is only valid until the next call, since
/// growing the buffer can move it.
#[unsafe(no_mangle)]
pub extern "C" fn ox_alloc(length: u32) -> u32 {
    let length = length as usize;
    if length > abi::MAX_REQUEST {
        return 0;
    }
    let Some(adapter) = claim() else { return 0 };
    adapter.request.clear();
    adapter.request.resize(length, 0);
    let pointer = adapter.request.as_ptr() as u32;
    release();
    pointer
}

/// Releases the request and response buffers.
///
/// The engine and its accepted state are untouched; use [`op::DESTROY`] for
/// that.
#[unsafe(no_mangle)]
pub extern "C" fn ox_reset() {
    let Some(adapter) = claim() else { return };
    adapter.request = Vec::new();
    adapter.response = Vec::new();
    release();
}

/// Executes the request occupying the first `length` reserved bytes.
///
/// Returns the address of a response whose header carries its status and length.
/// A host callback that reenters this export is answered with [`BUSY`] rather
/// than being allowed to alias the adapter.
#[unsafe(no_mangle)]
pub extern "C" fn ox_call(length: u32) -> u32 {
    let Some(adapter) = claim() else { return BUSY.as_ptr() as u32 };
    let response = dispatch(adapter, length as usize);
    adapter.response = response;
    let pointer = adapter.response.as_ptr() as u32;
    release();
    pointer
}

fn dispatch(adapter: &mut Adapter, length: usize) -> Vec<u8> {
    if length > adapter.request.len() {
        return abi_failure(abi::Error::Length {
            declared: length as u32,
            actual: adapter.request.len(),
        });
    }

    // The engine lives in its own slot, so this payload borrow stays live across
    // the engine mutation below.
    let (header, payload) = match abi::request(&adapter.request[..length]) {
        Ok(parsed) => parsed,
        Err(error) => return abi_failure(error),
    };
    let mut reader = Reader::new(payload);

    match header.op {
        op::CREATE => match read_config(&mut reader) {
            Ok((spec_id, block, version)) => {
                let engine = Evm::new_with_execution_config(
                    ExecutionConfig::for_spec_and_version(spec_id, version),
                    spec_id,
                    block,
                    ethereum_tx_registry(spec_id),
                    Db::new(HostDb::default()),
                    Precompiles::base(spec_id),
                );
                match set_engine(Some(engine)) {
                    Ok(()) => Writer::new().finish(status::OK),
                    Err(status) => Writer::new().finish(status),
                }
            }
            Err(error) => abi_failure(error),
        },
        op::DESTROY => match reader.finish() {
            Ok(()) => match set_engine(None) {
                Ok(()) => Writer::new().finish(status::OK),
                Err(status) => Writer::new().finish(status),
            },
            Err(error) => abi_failure(error),
        },
        op::SET_BLOCK => {
            let engine = match engine() {
                Ok(engine) => engine,
                Err(status) => return Writer::new().finish(status),
            };
            match read_config(&mut reader) {
                Ok((spec_id, block, version)) => {
                    engine.set_block_and_execution_config(
                        block,
                        ExecutionConfig::for_spec_and_version(spec_id, version),
                        spec_id,
                        ethereum_tx_registry(spec_id),
                        Precompiles::base(spec_id),
                    );
                    Writer::new().finish(status::OK)
                }
                Err(error) => abi_failure(error),
            }
        }
        op::CALL_TX => {
            let engine = match engine() {
                Ok(engine) => engine,
                Err(status) => return Writer::new().finish(status),
            };
            match read_tx(&mut reader) {
                Ok(tx) => call_tx(engine, &tx),
                Err(error) => abi_failure(error),
            }
        }
        op::READ_ACCOUNT => {
            let engine = match engine() {
                Ok(engine) => engine,
                Err(status) => return Writer::new().finish(status),
            };
            match read_address(&mut reader) {
                Ok(address) => read_account(engine, &address),
                Err(error) => abi_failure(error),
            }
        }
        op::TRANSACT => match read_tx(&mut reader) {
            Ok(tx) => transact(&tx),
            Err(error) => abi_failure(error),
        },
        op::COMMIT
        | op::DISCARD
        | op::DETACH
        | op::COMMIT_WITH
        | op::DISCARD_WITH => match reader.finish() {
            Ok(()) => resolve(header.op),
            Err(error) => abi_failure(error),
        },
        unknown => abi_failure(abi::Error::UnknownOp(unknown)),
    }
}

/// Reads the specification, block environment, and chain id shared by
/// [`op::CREATE`] and [`op::SET_BLOCK`].
fn read_config(
    reader: &mut Reader<'_>,
) -> Result<(SpecId, BlockEnvExt, Version), abi::Error> {
    let raw = reader.u32()?;
    let spec_id = SpecId::try_from_u32(raw).ok_or(abi::Error::UnknownSpecId(raw))?;
    let chain_id = reader.u64()?;
    // Field order follows evm2's `BlockEnvExt` declaration order.
    let block = BlockEnvExt {
        number: reader.word()?,
        beneficiary: reader.address()?,
        timestamp: reader.word()?,
        gas_limit: reader.word()?,
        basefee: reader.word()?,
        difficulty: reader.word()?,
        prevrandao: reader.word()?,
        blob_basefee: reader.word()?,
        slot_num: reader.word()?,
        ext: (),
        _non_exhaustive: (),
    };
    // Overrides apply on top of the specification's own version, so evm2 stays
    // the source of every default rather than this adapter restating its tables.
    let mut version = Version { chain_id, ..Version::new(spec_id) };
    read_overrides(reader, &mut version)?;
    reader.finish()?;
    Ok((spec_id, block, version))
}

/// Scalar version fields, in the order the ABI carries their presence bits.
mod field {
    /// Transaction gas limit cap.
    pub const TX_GAS_LIMIT_CAP: u32 = 1 << 0;
    /// Hard memory limit, in bytes.
    pub const MEMORY_LIMIT: u32 = 1 << 1;
    /// Largest deployable bytecode.
    pub const MAX_CODE_SIZE: u32 = 1 << 2;
    /// Largest creation initcode.
    pub const MAX_INITCODE_SIZE: u32 = 1 << 3;
    /// Blobs allowed in one transaction.
    pub const MAX_BLOBS_PER_TX: u32 = 1 << 4;
    /// Blob base fee update fraction.
    pub const BLOB_BASE_FEE_UPDATE_FRACTION: u32 = 1 << 5;
    /// Every bit this ABI defines.
    pub const KNOWN: u32 = TX_GAS_LIMIT_CAP
        | MEMORY_LIMIT
        | MAX_CODE_SIZE
        | MAX_INITCODE_SIZE
        | MAX_BLOBS_PER_TX
        | BLOB_BASE_FEE_UPDATE_FRACTION;
}

/// Applies the caller's version overrides.
///
/// Each group is partial: a field, feature, or gas parameter the caller did not
/// mention keeps the value the specification gave it.
fn read_overrides(reader: &mut Reader<'_>, version: &mut Version) -> Result<(), abi::Error> {
    let present = reader.u32()?;
    if present & !field::KNOWN != 0 {
        return Err(abi::Error::UnknownField(present & !field::KNOWN));
    }
    if present & field::TX_GAS_LIMIT_CAP != 0 {
        version.tx_gas_limit_cap = reader.u64()?;
    }
    if present & field::MEMORY_LIMIT != 0 {
        version.memory_limit = reader.u64()?;
    }
    if present & field::MAX_CODE_SIZE != 0 {
        version.max_code_size = reader.u64()? as usize;
    }
    if present & field::MAX_INITCODE_SIZE != 0 {
        version.max_initcode_size = reader.u64()? as usize;
    }
    if present & field::MAX_BLOBS_PER_TX != 0 {
        version.max_blobs_per_tx = reader.u64()? as usize;
    }
    if present & field::BLOB_BASE_FEE_UPDATE_FRACTION != 0 {
        version.blob_base_fee_update_fraction = reader.u64()?;
    }

    // Features arrive as (index, on) pairs against evm2's declaration order, so
    // an unnamed flag is rejected rather than silently ignored.
    for _ in 0..reader.u32()? {
        let index = reader.u32()?;
        let on = reader.u32()? != 0;
        let flag = features::from_index(index).ok_or(abi::Error::UnknownFeature(index))?;
        version.features.set(flag, on);
    }

    // Gas parameters are keyed by evm2's own `GasId` discriminant.
    for _ in 0..reader.u32()? {
        let index = reader.u32()?;
        let cost = reader.u32()?;
        let id = GasId::from_usize(index as usize).ok_or(abi::Error::UnknownGasId(index))?;
        version.gas_params.set(id, cost);
    }
    Ok(())
}

/// Reads a recovered transaction as a signer plus its EIP-2718 envelope.
///
/// evm2's `TxEnvelope` is signature-stripped and takes its signer from
/// `Recovered`, so the decoded signature is dropped rather than re-derived.
fn read_tx(reader: &mut Reader<'_>) -> Result<Recovered<TxEnvelope>, abi::Error> {
    let signer = reader.address()?;
    let bytes = reader.bytes(abi::MAX_REQUEST)?;
    reader.finish()?;
    // The cursor is kept so trailing bytes are rejected rather than ignored,
    // matching how every other field in this ABI is decoded.
    let mut cursor = &bytes[..];
    let envelope = EthereumTxEnvelope::<TxEip4844>::decode_2718(&mut cursor)
        .map_err(|_| abi::Error::Envelope)?;
    if !cursor.is_empty() {
        return Err(abi::Error::Envelope);
    }
    Ok(Recovered::new_unchecked(TxEnvelope::from(envelope), signer))
}

fn call_tx(engine: &mut Evm<'static, BaseEvmTypes>, tx: &Recovered<TxEnvelope>) -> Vec<u8> {
    match engine.call_tx(tx) {
        Ok(result) => {
            let mut writer = Writer::new();
            write_result(&mut writer, &result);
            writer.finish(status::OK)
        }
        Err(failure) => {
            // A host read failure is recorded on the database rather than in the
            // handler error, so it is recovered from there and reported apart
            // from transaction rejections.
            let host = engine
                .database_as_mut::<Db<HostDb>>()
                .and_then(|db| db.take_result().err());
            let mut writer = Writer::new();
            match host {
                Some(error) if is_pending(&error) => writer.finish(status::PENDING),
                Some(error) => {
                    writer.str(&alloc::format!("{error}"));
                    writer.finish(status::DATABASE)
                }
                None => {
                    error::write_handler(&mut writer, &failure);
                    writer.finish(status::HANDLER)
                }
            }
        }
    }
}

/// Executes a transaction and parks its handle for a later resolution.
///
/// The result is returned now so a caller reads it without another call, which
/// is what `ExecutedTx::result` does without consuming the handle.
fn transact(tx: &Recovered<TxEnvelope>) -> Vec<u8> {
    let engine = match engine() {
        Ok(engine) => engine,
        Err(status) => return Writer::new().finish(status),
    };
    // Storing the handle takes the engine's borrow for as long as it is
    // outstanding, so this arm returns rather than falling through to a path
    // that would need the engine again.
    let failure = match engine.transact(tx) {
        Ok(handle) => {
            let mut writer = Writer::new();
            write_result(&mut writer, handle.result());
            *executed() = Some(handle);
            return writer.finish(status::OK);
        }
        Err(failure) => failure,
    };
    // Nothing was stored, so the engine is free to report why it refused.
    let host = engine_failure();
    let mut writer = Writer::new();
    match host {
        Some(error) if is_pending(&error) => writer.finish(status::PENDING),
        Some(error) => {
            writer.str(&alloc::format!("{error}"));
            writer.finish(status::DATABASE)
        }
        None => {
            error::write_handler(&mut writer, &failure);
            writer.finish(status::HANDLER)
        }
    }
}

/// Takes a host read failure recorded on the database, if one is pending.
///
/// Host failures are recorded there rather than in the handler error, so they are
/// recovered separately from transaction rejections.
fn engine_failure() -> Option<AnyError> {
    let engine = engine().ok()?;
    engine.database_as_mut::<Db<HostDb>>().and_then(|db| db.take_result().err())
}

/// Whether a recorded host failure is a read the host has not fetched.
///
/// Not a failure: the attempt was abandoned before any state was accepted, and
/// the host repeats the operation once the value is available.
fn is_pending(error: &AnyError) -> bool {
    matches!(error.downcast_ref::<HostError>(), Some(HostError::Pending))
}

/// Resolves the outstanding handle, releasing the engine borrow.
///
/// Taking the handle out first is what makes the engine reachable again, so a
/// resolution is single-use: a second one finds nothing outstanding.
fn resolve(op: u16) -> Vec<u8> {
    let Some(handle) = executed().take() else {
        return Writer::new().finish(status::NOT_EXECUTED);
    };
    let mut writer = Writer::new();
    match op {
        // The result was already returned when the transaction executed, so both
        // of these resolve for their state effect and drop the repeat copy.
        op::COMMIT => {
            let _ = handle.commit();
        }
        op::DISCARD => {
            let _ = handle.discard();
        }
        // A sink that refuses a record makes evm2 drop the handle, which
        // discards. The status says so rather than reporting a false commit.
        op::COMMIT_WITH => {
            let mut sink = state::HostSink::new();
            if handle.commit_with(&mut sink).is_err() {
                return Writer::new().finish(status::SINK);
            }
        }
        op::DISCARD_WITH => {
            let mut sink = state::HostSink::new();
            if handle.discard_with(&mut sink).is_err() {
                return Writer::new().finish(status::SINK);
            }
        }
        // Detaching is the only resolution whose payload differs: the state
        // leaves the engine with the caller rather than being applied or dropped.
        _ => state::write_pending(&mut writer, &handle.detach().pending_state),
    }
    writer.finish(status::OK)
}

/// Reads a bare address operand.
fn read_address(reader: &mut Reader<'_>) -> Result<Address, abi::Error> {
    let address = reader.address()?;
    reader.finish()?;
    Ok(address)
}

/// Reads an account through the EVM, so accepted state is included.
fn read_account(engine: &mut Evm<'static, BaseEvmTypes>, address: &Address) -> Vec<u8> {
    match engine.read_account_info(address) {
        Ok(account) => {
            let mut writer = Writer::new();
            match account {
                Some(info) => {
                    writer.bool(true);
                    writer.word(info.balance);
                    writer.u64(info.nonce);
                    writer.hash(info.code_hash);
                    // Code is included when the overlay already holds it, so a
                    // caller does not need a second read to see it.
                    writer.bytes(
                        info.code.as_ref().map(|code| code.original_bytes()).unwrap_or_default().as_ref(),
                    );
                }
                None => writer.bool(false),
            }
            writer.finish(status::OK)
        }
        Err(code) => {
            let host = engine
                .database_as_mut::<Db<HostDb>>()
                .and_then(|db| db.take_result().err());
            let mut writer = Writer::new();
            match host {
                Some(error) if is_pending(&error) => writer.finish(status::PENDING),
                Some(error) => {
                    writer.str(&alloc::format!("{error}"));
                    writer.finish(status::DATABASE)
                }
                None => {
                    error::write_handler(&mut writer, &HandlerError::Fatal(code));
                    writer.finish(status::HANDLER)
                }
            }
        }
    }
}

/// Writes a [`TxResult`], preserving evm2's fields.
///
/// `ext` carries no data for the base EVM types, so it has nothing to encode.
fn write_result(writer: &mut Writer, result: &TxResult) {
    writer.bool(result.status);
    writer.u8(result.stop as u8);
    writer.u64(result.total_gas_spent);
    writer.u64(result.state_gas_spent);
    writer.u64(result.refunded);
    writer.u64(result.floor_gas);
    match result.created_address {
        Some(address) => {
            writer.bool(true);
            writer.address(address);
        }
        None => writer.bool(false),
    }
    match result.error_code {
        Some(code) => {
            writer.bool(true);
            writer.u64(code.get() as u64);
        }
        None => writer.bool(false),
    }
    writer.bytes(&result.output);
    writer.u32(result.logs.len() as u32);
    for log in &result.logs {
        writer.address(log.address);
        writer.u32(log.topics().len() as u32);
        for topic in log.topics() {
            writer.hash(*topic);
        }
        writer.bytes(&log.data.data);
    }
}

fn abi_failure(error: abi::Error) -> Vec<u8> {
    let mut writer = Writer::new();
    writer.str(&alloc::format!("{error}"));
    writer.finish(status::ABI)
}
