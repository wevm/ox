//! State-change serialization.
//!
//! evm2 keeps `PendingState`'s fields crate-private and streams them through
//! [`StateChangeSource::visit`], so this encodes the visited stream rather than
//! reading the structure. For `PendingState` that order is deterministic, unlike
//! the trait's general contract.

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
