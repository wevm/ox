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

use crate::{
    abi::{Reader, Writer, op},
    database::HostDb,
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
    BaseEvmTypes, Evm, ExecutionConfig, Precompiles, SpecId, TxResult, Version,
    registry::HandlerError,
    env::BlockEnvExt,
    ethereum::{TxEnvelope, ethereum_tx_registry},
    evm::Db,
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
    engine: Option<Evm<'static, BaseEvmTypes>>,
    request: Vec<u8>,
    response: Vec<u8>,
}

impl Adapter {
    const fn new() -> Self {
        Self { engine: None, request: Vec::new(), response: Vec::new() }
    }
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

    // The request and engine are disjoint fields, so the payload borrow can stay
    // live across the engine mutation below.
    let (header, payload) = match abi::request(&adapter.request[..length]) {
        Ok(parsed) => parsed,
        Err(error) => return abi_failure(error),
    };
    let mut reader = Reader::new(payload);

    match header.op {
        op::CREATE => match read_config(&mut reader) {
            Ok((spec_id, block, version)) => {
                adapter.engine = Some(Evm::new_with_execution_config(
                    ExecutionConfig::for_spec_and_version(spec_id, version),
                    spec_id,
                    block,
                    ethereum_tx_registry(spec_id),
                    Db::new(HostDb::default()),
                    Precompiles::base(spec_id),
                ));
                Writer::new().finish(status::OK)
            }
            Err(error) => abi_failure(error),
        },
        op::DESTROY => match reader.finish() {
            Ok(()) => {
                adapter.engine = None;
                Writer::new().finish(status::OK)
            }
            Err(error) => abi_failure(error),
        },
        op::SET_BLOCK => {
            let Some(engine) = adapter.engine.as_mut() else {
                return Writer::new().finish(status::ENGINE_MISSING);
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
            let Some(engine) = adapter.engine.as_mut() else {
                return Writer::new().finish(status::ENGINE_MISSING);
            };
            match read_tx(&mut reader) {
                Ok(tx) => call_tx(engine, &tx),
                Err(error) => abi_failure(error),
            }
        }
        op::READ_ACCOUNT => {
            let Some(engine) = adapter.engine.as_mut() else {
                return Writer::new().finish(status::ENGINE_MISSING);
            };
            match read_address(&mut reader) {
                Ok(address) => read_account(engine, &address),
                Err(error) => abi_failure(error),
            }
        }
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
    reader.finish()?;
    Ok((spec_id, block, Version { chain_id, ..Version::new(spec_id) }))
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
