//! State-change serialization.
//!
//! evm2 keeps `PendingState`'s fields crate-private and streams them through
//! [`StateChangeSource::visit`], so this encodes the visited stream rather than
//! reading the structure. For `PendingState` that order is deterministic, unlike
//! the trait's general contract.

use alloc::{collections::BTreeMap, vec::Vec};
use alloy_primitives::{Address, B256};
use evm2::evm::{
    AccountChangeRef, AccountInfo, AccountInfoRef, PendingState, StateChangeSink,
    StateChangeSource, StorageChange,
};
use evm2::bytecode::Bytecode;
use evm2::interpreter::Word;

use crate::abi::{self, Reader, Writer};

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

/// Rebuilds a [`PendingState`] from a serialized change stream.
///
/// The reverse of the stream [`write_pending`] produces, so state a caller
/// detached and edited can be applied back. Each record is read in the shape the
/// sink wrote it; a tag's fields are consumed whether or not they are used.
pub fn read_pending(reader: &mut Reader<'_>) -> Result<PendingState, abi::Error> {
    let mut pending = PendingState::default();
    // Accounts are buffered because bytecode can arrive after the account whose
    // hash names it, and an account applied without its code would leave a hash
    // pointing at bytes the target EVM never saw.
    let mut accounts: Vec<(Address, Option<AccountInfo>, Option<AccountInfo>)> = Vec::new();
    let mut code: BTreeMap<B256, Bytecode> = BTreeMap::new();

    loop {
        match reader.u8()? {
            record::END => break,
            record::ACCOUNT => {
                let address = reader.address()?;
                let original = read_info(reader)?;
                let current = read_info(reader)?;
                // The created and selfdestructed flags are read and dropped:
                // `insert_account` takes neither, and re-inserting state must not
                // carry a lifecycle marker from the transaction that produced it.
                let _created = reader.bool()?;
                let _selfdestructed = reader.bool()?;
                accounts.push((address, original, current));
            }
            record::ACCOUNT_READ => {
                let address = reader.address()?;
                // A read carries one value, so it goes back as unchanged.
                let info = read_info(reader)?;
                accounts.push((address, info.clone(), info));
            }
            record::STORAGE => {
                let address = reader.address()?;
                let key = reader.word()?;
                let original = reader.word()?;
                let current = reader.word()?;
                pending.insert_storage(address, key, original, current);
            }
            record::STORAGE_READ => {
                let address = reader.address()?;
                let key = reader.word()?;
                let value = reader.word()?;
                pending.insert_storage(address, key, value, value);
            }
            // A wipe is the storage half of a selfdestruct, which is dropped for
            // the same reason the marker is.
            record::STORAGE_WIPE => {
                let _address = reader.address()?;
            }
            record::BYTECODE => {
                let code_hash = reader.hash()?;
                let bytes = reader.bytes(abi::MAX_REQUEST)?;
                let decoded = Bytecode::new_raw_checked(bytes.to_vec().into())
                    .map_err(|_| abi::Error::Bytecode)?;
                code.insert(code_hash, decoded);
            }
            unknown => return Err(abi::Error::UnknownRecord(unknown)),
        }
    }
    reader.finish()?;

    for (address, original, current) in accounts {
        let current = current.map(|mut info| {
            if let Some(bytecode) = code.get(&info.code_hash) {
                info = info.with_code(bytecode.clone());
            }
            info
        });
        pending.insert_account(address, original, current);
    }

    Ok(pending)
}

/// Reads an account's fields, or nothing when the flag says it is absent.
fn read_info(reader: &mut Reader<'_>) -> Result<Option<AccountInfo>, abi::Error> {
    if !reader.bool()? {
        return Ok(None);
    }
    let balance = reader.word()?;
    let nonce = reader.u64()?;
    let code_hash = reader.hash()?;
    Ok(Some(AccountInfo { balance, nonce, code_hash, code: None, _non_exhaustive: () }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::abi::HEADER_SIZE;
    use alloy_primitives::U256;

    /// Strips the response header the writer reserves.
    fn payload(bytes: &[u8]) -> &[u8] {
        &bytes[HEADER_SIZE..]
    }

    /// A stream carrying every record the sink can emit.
    fn stream() -> Vec<u8> {
        let mut writer = Writer::new();
        let code = Bytecode::new_raw_checked(alloy_primitives::Bytes::from_static(&[0x60, 0x00]))
            .unwrap();
        let code_hash = code.hash_slow();
        writer.u8(record::BYTECODE);
        writer.hash(code_hash);
        writer.bytes(code.original_bytes().as_ref());

        writer.u8(record::ACCOUNT);
        writer.address(Address::repeat_byte(0x11));
        writer.bool(true);
        writer.word(U256::from(1));
        writer.u64(2);
        writer.hash(code_hash);
        writer.bool(true);
        writer.word(U256::from(3));
        writer.u64(4);
        writer.hash(code_hash);
        writer.bool(true);
        writer.bool(true);

        writer.u8(record::ACCOUNT_READ);
        writer.address(Address::repeat_byte(0x22));
        writer.bool(false);

        writer.u8(record::STORAGE);
        writer.address(Address::repeat_byte(0x11));
        writer.word(U256::from(7));
        writer.word(U256::from(8));
        writer.word(U256::from(9));

        writer.u8(record::STORAGE_READ);
        writer.address(Address::repeat_byte(0x22));
        writer.word(U256::from(10));
        writer.word(U256::from(11));

        writer.u8(record::STORAGE_WIPE);
        writer.address(Address::repeat_byte(0x33));

        writer.u8(record::END);
        writer.finish(0)
    }

    #[test]
    fn reads_every_record_the_sink_writes() {
        // Consuming the stream exactly is the property: a record read in the wrong
        // shape leaves the cursor mid-record and the next tag is garbage.
        let encoded = stream();
        let pending = read_pending(&mut Reader::new(payload(&encoded))).unwrap();

        let account = pending.account_info(&Address::repeat_byte(0x11)).expect("account");
        assert_eq!((account.balance, account.nonce), (U256::from(3), 4));
        assert_eq!(pending.account_info(&Address::repeat_byte(0x22)), None);
    }

    #[test]
    fn attaches_bytecode_to_the_account_naming_it() {
        // Without this an account applied to another EVM carries a hash for bytes
        // that EVM never saw, and its code reads as empty.
        let encoded = stream();
        let pending = read_pending(&mut Reader::new(payload(&encoded))).unwrap();

        let account = pending.account_info(&Address::repeat_byte(0x11)).expect("account");
        let code = account.code.as_ref().expect("code travelled with the account");
        assert_eq!(code.original_bytes().as_ref(), &[0x60, 0x00]);
    }

    #[test]
    fn re_inserted_state_carries_no_selfdestruct_marker() {
        let encoded = stream();
        let pending = read_pending(&mut Reader::new(payload(&encoded))).unwrap();

        // The stream said the account was created and selfdestructed. Visiting the
        // rebuilt state must not repeat either, or committing it would wipe
        // storage the caller meant to keep.
        let mut writer = Writer::new();
        write_pending(&mut writer, &pending);
        let out = writer.finish(0);
        let body = payload(&out);

        let mut wipes = 0;
        let mut flags = 0;
        let mut reader = Reader::new(body);
        while let Ok(tag) = reader.u8() {
            match tag {
                record::END => break,
                record::STORAGE_WIPE => {
                    wipes += 1;
                    let _ = reader.address();
                }
                record::ACCOUNT => {
                    let _ = reader.address();
                    let _ = read_info(&mut reader);
                    let _ = read_info(&mut reader);
                    if reader.bool().unwrap() {
                        flags += 1;
                    }
                    if reader.bool().unwrap() {
                        flags += 1;
                    }
                }
                record::ACCOUNT_READ => {
                    let _ = reader.address();
                    let _ = read_info(&mut reader);
                }
                record::STORAGE => {
                    let _ = reader.address();
                    for _ in 0..3 {
                        let _ = reader.word();
                    }
                }
                record::STORAGE_READ => {
                    let _ = reader.address();
                    for _ in 0..2 {
                        let _ = reader.word();
                    }
                }
                _ => break,
            }
        }
        assert_eq!((wipes, flags), (0, 0));
    }
}
