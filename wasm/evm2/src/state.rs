//! State-change serialization.
//!
//! evm2 keeps `PendingState`'s fields crate-private and streams them through
//! [`StateChangeSource::visit`], so this encodes the visited stream rather than
//! reading the structure. For `PendingState` that order is deterministic, unlike
//! the trait's general contract.

use alloc::vec::Vec;
use alloy_primitives::Address;
use evm2::evm::{
    AccountChangeRef, AccountInfoRef, PendingState, StateChangeSink, StateChangeSource,
    StorageChange,
};
use evm2::interpreter::Word;

use crate::abi::Writer;

/// Record tags in a serialized change stream.
pub mod record {
    /// End of the stream.
    pub const END: u8 = 0;
    /// Bytecode keyed by its hash.
    pub const BYTECODE: u8 = 1;
    /// An account whose value changed.
    pub const ACCOUNT: u8 = 2;
    /// A storage wipe, emitted before the account's slot changes.
    pub const STORAGE_WIPE: u8 = 3;
    /// A storage slot whose value changed.
    pub const STORAGE: u8 = 4;
    /// An account the transaction loaded but left unchanged.
    pub const ACCOUNT_READ: u8 = 5;
    /// A storage slot the transaction loaded but left unchanged.
    pub const STORAGE_READ: u8 = 6;
}

/// Writes a visited change stream into an ABI response.
struct Sink<'a>(&'a mut Writer);

impl Sink<'_> {
    /// Writes an optional account as a presence flag and, when present, its
    /// fields. Code is written separately under [`record::BYTECODE`], so only the
    /// hash appears here.
    fn account_info(&mut self, info: Option<AccountInfoRef<'_>>) {
        match info {
            Some(info) => {
                self.0.bool(true);
                self.0.word(info.balance);
                self.0.u64(info.nonce);
                self.0.hash(info.code_hash);
            }
            None => self.0.bool(false),
        }
    }
}

impl StateChangeSink for Sink<'_> {
    // Writing into a growable buffer cannot fail, which keeps this sink off the
    // path where evm2 discards a transaction because its sink errored.
    type Error = core::convert::Infallible;

    fn bytecode(
        &mut self,
        code_hash: alloy_primitives::B256,
        code: &evm2::bytecode::Bytecode,
    ) -> Result<(), Self::Error> {
        self.0.u8(record::BYTECODE);
        self.0.hash(code_hash);
        self.0.bytes(code.original_bytes().as_ref());
        Ok(())
    }

    fn account(&mut self, change: AccountChangeRef<'_>) -> Result<(), Self::Error> {
        self.0.u8(record::ACCOUNT);
        self.0.address(change.address);
        self.account_info(change.original);
        self.account_info(change.current);
        self.0.bool(change.created);
        self.0.bool(change.selfdestructed);
        Ok(())
    }

    fn storage_wipe(&mut self, address: Address) -> Result<(), Self::Error> {
        self.0.u8(record::STORAGE_WIPE);
        self.0.address(address);
        Ok(())
    }

    fn storage(&mut self, change: StorageChange) -> Result<(), Self::Error> {
        self.0.u8(record::STORAGE);
        self.0.address(change.address);
        self.0.word(change.key);
        self.0.word(change.original);
        self.0.word(change.current);
        Ok(())
    }

    fn account_read(
        &mut self,
        address: Address,
        info: Option<AccountInfoRef<'_>>,
    ) -> Result<(), Self::Error> {
        self.0.u8(record::ACCOUNT_READ);
        self.0.address(address);
        self.account_info(info);
        Ok(())
    }

    fn storage_read(
        &mut self,
        address: Address,
        key: Word,
        value: Word,
    ) -> Result<(), Self::Error> {
        self.0.u8(record::STORAGE_READ);
        self.0.address(address);
        self.0.word(key);
        self.0.word(value);
        Ok(())
    }
}

/// Writes a detached pending state as a change stream.
pub fn write_pending(writer: &mut Writer, pending: &PendingState) {
    let Ok(()) = pending.visit(&mut Sink(writer));
    writer.u8(record::END);
}

/// Host sink return value meaning the host accepted the record.
#[cfg(not(target_arch = "wasm32"))]
const ACCEPTED: u32 = 0;

#[cfg(target_arch = "wasm32")]
#[link(wasm_import_module = "ox_evm2")]
unsafe extern "C" {
    /// Hands one serialized change record to the host.
    ///
    /// Returns zero when the host accepted it. Anything else is a sink failure,
    /// which evm2 turns into a discard rather than a commit.
    #[link_name = "sink_record"]
    fn host_sink_record(pointer: *const u8, length: u32) -> u32;
}

#[cfg(not(target_arch = "wasm32"))]
unsafe fn host_sink_record(_pointer: *const u8, _length: u32) -> u32 {
    // Host builds have no imports, so a streamed resolution always fails here.
    ACCEPTED + 1
}

/// A host state-change sink failed.
#[derive(Debug)]
pub struct SinkFailed;

/// Streams each record to the host as it is produced.
///
/// One record per call rather than a buffered batch: evm2 discards the
/// transaction when a sink errors, so the host's verdict has to arrive before the
/// commit decision, not after it.
pub struct HostSink {
    record: Vec<u8>,
}

impl HostSink {
    pub const fn new() -> Self {
        Self { record: Vec::new() }
    }

    fn send(&mut self) -> Result<(), SinkFailed> {
        let status = unsafe { host_sink_record(self.record.as_ptr(), self.record.len() as u32) };
        self.record.clear();
        if status == 0 { Ok(()) } else { Err(SinkFailed) }
    }

    fn u8(&mut self, value: u8) {
        self.record.push(value);
    }

    fn bool(&mut self, value: bool) {
        self.u8(u8::from(value));
    }

    fn u64(&mut self, value: u64) {
        self.record.extend_from_slice(&value.to_le_bytes());
    }

    fn word(&mut self, value: Word) {
        self.record.extend_from_slice(&value.to_be_bytes::<32>());
    }

    fn address(&mut self, value: Address) {
        self.record.extend_from_slice(value.as_slice());
    }

    fn hash(&mut self, value: alloy_primitives::B256) {
        self.record.extend_from_slice(value.as_slice());
    }

    fn bytes(&mut self, value: &[u8]) {
        self.record.extend_from_slice(&(value.len() as u32).to_le_bytes());
        self.record.extend_from_slice(value);
    }

    fn account_info(&mut self, info: Option<AccountInfoRef<'_>>) {
        match info {
            Some(info) => {
                self.bool(true);
                self.word(info.balance);
                self.u64(info.nonce);
                self.hash(info.code_hash);
            }
            None => self.bool(false),
        }
    }
}

impl StateChangeSink for HostSink {
    type Error = SinkFailed;

    fn bytecode(
        &mut self,
        code_hash: alloy_primitives::B256,
        code: &evm2::bytecode::Bytecode,
    ) -> Result<(), Self::Error> {
        self.u8(record::BYTECODE);
        self.hash(code_hash);
        self.bytes(code.original_bytes().as_ref());
        self.send()
    }

    fn account(&mut self, change: AccountChangeRef<'_>) -> Result<(), Self::Error> {
        self.u8(record::ACCOUNT);
        self.address(change.address);
        self.account_info(change.original);
        self.account_info(change.current);
        self.bool(change.created);
        self.bool(change.selfdestructed);
        self.send()
    }

    fn storage_wipe(&mut self, address: Address) -> Result<(), Self::Error> {
        self.u8(record::STORAGE_WIPE);
        self.address(address);
        self.send()
    }

    fn storage(&mut self, change: StorageChange) -> Result<(), Self::Error> {
        self.u8(record::STORAGE);
        self.address(change.address);
        self.word(change.key);
        self.word(change.original);
        self.word(change.current);
        self.send()
    }

    fn account_read(
        &mut self,
        address: Address,
        info: Option<AccountInfoRef<'_>>,
    ) -> Result<(), Self::Error> {
        self.u8(record::ACCOUNT_READ);
        self.address(address);
        self.account_info(info);
        self.send()
    }

    fn storage_read(
        &mut self,
        address: Address,
        key: Word,
        value: Word,
    ) -> Result<(), Self::Error> {
        self.u8(record::STORAGE_READ);
        self.address(address);
        self.word(key);
        self.word(value);
        self.send()
    }
}
