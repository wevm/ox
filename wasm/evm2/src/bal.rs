//! EIP-7928 block access list serialization.
//!
//! One wire shape serves both directions: the canonical [`BlockAccessList`]
//! (`Vec<AccountChanges>`), which evm2 converts to and from its own `Bal`. So
//! evm2 owns validation and the fold, and this module owns only the bytes.

use alloc::vec::Vec;
use alloy_eip7928::{
    AccountChanges, BalanceChange, BlockAccessIndex, BlockAccessList, CodeChange, NonceChange,
    SlotChanges, StorageChange,
};
use evm2::{constants::MAX_CODE_SIZE_AMSTERDAM as MAX_CODE, evm::Bal};

use crate::abi::{self, Reader, Writer};

/// Largest code a single change may carry.
///
/// The same ceiling the account-code landing buffer uses, so a list built from an
/// execution under the highest configured limit round-trips rather than being
/// refused on the way back in.

/// Reads a block access list, validating it through evm2.
///
/// Malformed bytecode (an EIP-7702 designator of the wrong length or version) is
/// rejected here rather than surfacing as a bad read mid-execution.
pub fn read(reader: &mut Reader<'_>) -> Result<Bal, abi::Error> {
    let count = reader.u32()? as usize;
    let mut accounts = Vec::with_capacity(count.min(1024));

    for _ in 0..count {
        let address = reader.address()?;
        let mut changes = AccountChanges::new(address);

        for _ in 0..reader.u32()? {
            let slot = reader.word()?;
            let mut slot_changes = Vec::new();
            for _ in 0..reader.u32()? {
                let block_access_index = index(reader)?;
                let new_value = reader.word()?;
                slot_changes.push(StorageChange { block_access_index, new_value });
            }
            changes.storage_changes.push(SlotChanges::new(slot, slot_changes));
        }
        for _ in 0..reader.u32()? {
            changes.storage_reads.push(reader.word()?);
        }
        for _ in 0..reader.u32()? {
            let block_access_index = index(reader)?;
            let post_balance = reader.word()?;
            changes.balance_changes.push(BalanceChange { block_access_index, post_balance });
        }
        for _ in 0..reader.u32()? {
            let block_access_index = index(reader)?;
            let new_nonce = reader.u64()?;
            changes.nonce_changes.push(NonceChange { block_access_index, new_nonce });
        }
        for _ in 0..reader.u32()? {
            let block_access_index = index(reader)?;
            let new_code = reader.bytes(MAX_CODE)?.to_vec().into();
            changes.code_changes.push(CodeChange { block_access_index, new_code });
        }

        accounts.push(changes);
    }

    Bal::try_from(accounts).map_err(|_| abi::Error::Bytecode)
}

/// Writes a block access list.
pub fn write(writer: &mut Writer, bal: Bal) {
    let accounts = BlockAccessList::from(bal);
    writer.u32(accounts.len() as u32);

    for account in &accounts {
        writer.address(account.address);

        writer.u32(account.storage_changes.len() as u32);
        for slot in &account.storage_changes {
            writer.word(slot.slot);
            writer.u32(slot.changes.len() as u32);
            for change in &slot.changes {
                writer.u64(change.block_access_index.0);
                writer.word(change.new_value);
            }
        }
        writer.u32(account.storage_reads.len() as u32);
        for slot in &account.storage_reads {
            writer.word(*slot);
        }
        writer.u32(account.balance_changes.len() as u32);
        for change in &account.balance_changes {
            writer.u64(change.block_access_index.0);
            writer.word(change.post_balance);
        }
        writer.u32(account.nonce_changes.len() as u32);
        for change in &account.nonce_changes {
            writer.u64(change.block_access_index.0);
            writer.u64(change.new_nonce);
        }
        writer.u32(account.code_changes.len() as u32);
        for change in &account.code_changes {
            writer.u64(change.block_access_index.0);
            writer.bytes(&change.new_code);
        }
    }
}

/// Reads a block access index.
fn index(reader: &mut Reader<'_>) -> Result<BlockAccessIndex, abi::Error> {
    Ok(BlockAccessIndex(reader.u64()?))
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::{Address, U256};

    /// Builds a list exercising every field, so a round trip covers the shape.
    fn sample() -> Vec<u8> {
        let mut writer = Writer::new();
        writer.u32(1);
        writer.address(Address::repeat_byte(0xab));
        // One slot with two writes.
        writer.u32(1);
        writer.word(U256::from(7));
        writer.u32(2);
        writer.u64(1);
        writer.word(U256::from(11));
        writer.u64(2);
        writer.word(U256::from(12));
        // One read.
        writer.u32(1);
        writer.word(U256::from(9));
        // Balance, nonce, code.
        writer.u32(1);
        writer.u64(1);
        writer.word(U256::from(500));
        writer.u32(1);
        writer.u64(1);
        writer.u64(3);
        writer.u32(1);
        writer.u64(1);
        writer.bytes(&[0x60, 0x00]);
        writer.finish(0)
    }

    /// Strips the response header the writer reserves.
    fn payload(bytes: &[u8]) -> &[u8] {
        &bytes[crate::abi::HEADER_SIZE..]
    }

    #[test]
    fn round_trips_every_field() {
        let encoded = sample();
        let bal = read(&mut Reader::new(payload(&encoded))).unwrap();

        let mut writer = Writer::new();
        write(&mut writer, bal);
        let again = writer.finish(0);

        // Byte-identical, so neither direction drops or reorders a field.
        assert_eq!(payload(&encoded), payload(&again));
    }

    /// Writes one account carrying only the two storage reads given.
    fn account(writer: &mut Writer, address: Address, reads: &[u64]) {
        writer.address(address);
        writer.u32(0);
        writer.u32(reads.len() as u32);
        for read in reads {
            writer.word(U256::from(*read));
        }
        writer.u32(0);
        writer.u32(0);
        writer.u32(0);
    }

    #[test]
    fn writes_canonical_order_whatever_the_input_order() {
        let mut writer = Writer::new();
        writer.u32(2);
        // Descending by address, and the slots descending within an account, so
        // both orderings have to be corrected on the way out.
        account(&mut writer, Address::repeat_byte(0xcc), &[9, 2]);
        account(&mut writer, Address::repeat_byte(0x11), &[5, 1]);
        let encoded = writer.finish(0);

        let bal = read(&mut Reader::new(payload(&encoded))).unwrap();
        let mut writer = Writer::new();
        write(&mut writer, bal);
        let out = writer.finish(0);

        let mut expected = Writer::new();
        expected.u32(2);
        account(&mut expected, Address::repeat_byte(0x11), &[1, 5]);
        account(&mut expected, Address::repeat_byte(0xcc), &[2, 9]);
        let expected = expected.finish(0);

        // EIP-7928 requires deterministic ordering, and evm2's canonical
        // conversion applies it, so the wire is sorted regardless of input.
        assert_eq!(payload(&out), payload(&expected));
    }

    #[test]
    fn reads_an_empty_list() {
        let mut writer = Writer::new();
        writer.u32(0);
        let encoded = writer.finish(0);

        let bal = read(&mut Reader::new(payload(&encoded))).unwrap();
        assert!(bal.accounts.is_empty());
    }

    #[test]
    fn rejects_malformed_delegation_code() {
        let mut writer = Writer::new();
        writer.u32(1);
        writer.address(Address::ZERO);
        writer.u32(0);
        writer.u32(0);
        writer.u32(0);
        writer.u32(0);
        writer.u32(1);
        writer.u64(1);
        // The EIP-7702 magic prefix with nothing after it, which evm2 refuses.
        writer.bytes(&[0xef, 0x01]);
        let encoded = writer.finish(0);

        assert!(matches!(
            read(&mut Reader::new(payload(&encoded))),
            Err(abi::Error::Bytecode)
        ));
    }

    #[test]
    fn refuses_code_above_the_cap() {
        let mut writer = Writer::new();
        writer.u32(1);
        writer.address(Address::ZERO);
        writer.u32(0);
        writer.u32(0);
        writer.u32(0);
        writer.u32(0);
        writer.u32(1);
        writer.u64(1);
        writer.bytes(&vec![0; MAX_CODE + 1]);
        let encoded = writer.finish(0);

        assert!(matches!(
            read(&mut Reader::new(payload(&encoded))),
            Err(abi::Error::TooLarge { .. })
        ));
    }
}
