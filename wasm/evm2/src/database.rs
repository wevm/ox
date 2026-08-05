//! Synchronous host bridge for evm2's [`Database`] trait.
//!
//! The adapter supplies external values and nothing else: caching, journaling,
//! and rollback stay evm2's. A read the host cannot serve is a database error,
//! and evm2 decides what that does to transaction state.

use alloc::vec::Vec;
use alloy_primitives::{Address, B256};
use core::fmt;
use evm2::{
    bytecode::Bytecode,
    constants::MAX_CODE_SIZE_AMSTERDAM,
    evm::{AccountInfo, Database},
    interpreter::Word,
};

/// Encoded [`AccountInfo`] size: `balance` (32 BE), `nonce` (8 LE),
/// `code_hash` (32), `has_code` (1).
const ACCOUNT_SIZE: usize = 73;

/// Host read succeeded and wrote its output.
const FOUND: u32 = 0;
/// Account does not exist. Only [`Database::get_account`] may report this.
const MISSING: u32 = 1;
/// Code did not fit the landing buffer. The host wrote the length it needs.
const TOO_LARGE: u32 = 3;

/// The host does not have the value yet and will supply it out of band.
///
/// An asynchronous source cannot answer inside a synchronous import, so it
/// reports this instead. The read fails, evm2 unwinds the attempt without
/// accepting any state, and the host retries once it has fetched the value.
const PENDING: u32 = 4;

/// Absolute ceiling on code the adapter will accept from the host.
///
/// The landing buffer starts at the largest size any fork lets a contract deploy
/// and grows on demand, because `get_code_by_hash` returns code that already
/// exists in state rather than code being deployed now.
///
/// This ceiling is a deliberate adapter bound, not an attempt to mirror a
/// consensus rule. evm2 itself accepts bytecode of any length, but the length
/// driving the allocation is reported by the host, so an unbounded buffer would
/// let a wrong or hostile length exhaust linear memory. 16 MiB is 256 times the
/// largest code any spec permits to deploy, and depositing that much would cost
/// over three billion gas, so no real chain can hold an account this exceeds.
const CODE_CEILING: usize = 16 * 1024 * 1024;

/// Host read failed. Any status other than [`FOUND`] or [`MISSING`] is a failure.
#[cfg(not(target_arch = "wasm32"))]
const FAILED: u32 = 2;

#[cfg(target_arch = "wasm32")]
#[link(wasm_import_module = "ox_evm2")]
unsafe extern "C" {
    /// Writes `balance` (32 BE), `nonce` (8 LE), `code_hash` (32), and a
    /// `has_code` flag (1) to `out`.
    ///
    /// A source that already holds the account's code sets the flag and writes
    /// the code to `code`, reporting its length in `code_length`. That is what
    /// evm2's own `AccountInfo.code` is for, and it saves the separate
    /// `get_code_by_hash` round trip a source keyed by address cannot answer.
    #[link_name = "get_account"]
    fn host_get_account(
        address: *const u8,
        out: *mut u8,
        code: *mut u8,
        code_capacity: u32,
        code_length: *mut u32,
    ) -> u32;

    /// Writes up to `capacity` code bytes to `out` and their count to `length`.
    #[link_name = "get_code_by_hash"]
    fn host_get_code_by_hash(
        code_hash: *const u8,
        out: *mut u8,
        capacity: u32,
        length: *mut u32,
    ) -> u32;

    /// Writes the slot value as 32 big-endian bytes to `out`.
    #[link_name = "get_storage"]
    fn host_get_storage(address: *const u8, key: *const u8, out: *mut u8) -> u32;

    /// Writes the 32-byte block hash to `out`.
    #[link_name = "get_block_hash"]
    fn host_get_block_hash(number: *const u8, out: *mut u8) -> u32;
}

/// Host builds have no imports, so every read reports failure. Database
/// behavior is covered against the compiled artifact, not here.
#[cfg(not(target_arch = "wasm32"))]
mod host {
    use super::FAILED;

    pub unsafe fn get_account(
        _address: *const u8,
        _out: *mut u8,
        _code: *mut u8,
        _code_capacity: u32,
        _code_length: *mut u32,
    ) -> u32 {
        FAILED
    }

    pub unsafe fn get_block_hash(_number: *const u8, _out: *mut u8) -> u32 {
        FAILED
    }

    pub unsafe fn get_code_by_hash(
        _code_hash: *const u8,
        _out: *mut u8,
        _capacity: u32,
        _length: *mut u32,
    ) -> u32 {
        FAILED
    }

    pub unsafe fn get_storage(_address: *const u8, _key: *const u8, _out: *mut u8) -> u32 {
        FAILED
    }
}

#[cfg(not(target_arch = "wasm32"))]
use host::{
    get_account as host_get_account, get_block_hash as host_get_block_hash,
    get_code_by_hash as host_get_code_by_hash, get_storage as host_get_storage,
};

/// Database whose reads are served by host imports.
#[derive(Debug)]
pub struct HostDb {
    /// Reused zeroed landing buffer for code, so a host that under-writes it
    /// cannot expose stale or uninitialized bytes.
    code: Vec<u8>,
}

impl Default for HostDb {
    fn default() -> Self {
        Self { code: alloc::vec![0; MAX_CODE_SIZE_AMSTERDAM] }
    }
}

impl HostDb {
    /// One `get_account` import call against the current landing buffer.
    fn read_account(
        &mut self,
        address: &Address,
        out: &mut [u8; ACCOUNT_SIZE],
        code_length: &mut u32,
    ) -> u32 {
        let capacity = self.code.len();
        unsafe {
            host_get_account(
                address.as_ptr(),
                out.as_mut_ptr(),
                self.code.as_mut_ptr(),
                capacity as u32,
                code_length as *mut u32,
            )
        }
    }

    /// One `get_code_by_hash` import call against the current landing buffer.
    fn read_code(&mut self, code_hash: &B256, length: &mut u32) -> u32 {
        let capacity = self.code.len();
        unsafe {
            host_get_code_by_hash(
                code_hash.as_ptr(),
                self.code.as_mut_ptr(),
                capacity as u32,
                length as *mut u32,
            )
        }
    }

    /// Grows the landing buffer to `needed`, refusing beyond [`CODE_CEILING`].
    fn grow_code(&mut self, needed: usize) -> Result<(), HostError> {
        if needed > CODE_CEILING {
            return Err(HostError::CodeTooLarge { length: needed, max: CODE_CEILING });
        }
        self.code.resize(needed, 0);
        Ok(())
    }

    /// Reads `length` bytes out of the landing buffer as classified bytecode.
    fn take_code(&mut self, length: usize) -> Result<Bytecode, HostError> {
        if length > self.code.len() {
            return Err(HostError::CodeTooLarge { length, max: self.code.len() });
        }
        // `new_raw_checked` classifies an EIP-7702 delegation designator; forcing
        // legacy would make Prague execute the `0xef` prefix as invalid code.
        Bytecode::new_raw_checked(Vec::from(&self.code[..length]).into())
            .map_err(|_| HostError::Bytecode(B256::ZERO))
    }
}

impl Database for HostDb {
    type Error = HostError;

    fn get_account(&mut self, address: &Address) -> Result<Option<AccountInfo>, Self::Error> {
        let mut out = [0u8; ACCOUNT_SIZE];
        let mut code_length = 0u32;
        let mut status = self.read_account(address, &mut out, &mut code_length);

        if status == TOO_LARGE {
            self.grow_code(code_length as usize)?;
            status = self.read_account(address, &mut out, &mut code_length);
        }
        match status {
            FOUND => {}
            MISSING => return Ok(None),
            PENDING => return Err(HostError::Pending),
            _ => return Err(HostError::Account(*address)),
        }

        // evm2 accepts code alongside the account. When a source supplies it,
        // `CacheDB` files it under its hash and `get_code_by_hash` never runs.
        // A malformed-code failure is remapped to the account's own hash, the
        // same way `get_code_by_hash` names the hash it was asked for.
        let code = match out[72] {
            0 => None,
            _ => Some(self.take_code(code_length as usize).map_err(|error| match error {
                HostError::Bytecode(_) => HostError::Bytecode(B256::from_slice(&out[40..72])),
                other => other,
            })?),
        };

        Ok(Some(AccountInfo {
            balance: Word::from_be_slice(&out[0..32]),
            nonce: u64::from_le_bytes(out[32..40].try_into().unwrap()),
            code_hash: B256::from_slice(&out[40..72]),
            code,
            _non_exhaustive: (),
        }))
    }

    fn get_code_by_hash(&mut self, code_hash: &B256) -> Result<Bytecode, Self::Error> {
        let mut length = 0u32;
        let mut status = self.read_code(code_hash, &mut length);

        // The host reports what it needs when the buffer is short, so one grow
        // and one retry always suffices.
        if status == TOO_LARGE {
            self.grow_code(length as usize)?;
            status = self.read_code(code_hash, &mut length);
        }
        if status == PENDING {
            return Err(HostError::Pending);
        }
        if status != FOUND {
            return Err(HostError::Code(*code_hash));
        }
        self.take_code(length as usize)
            .map_err(|error| match error {
                HostError::Bytecode(_) => HostError::Bytecode(*code_hash),
                other => other,
            })
    }

    fn get_storage(&mut self, address: &Address, key: &Word) -> Result<Word, Self::Error> {
        let mut out = [0u8; 32];
        let status = unsafe {
            host_get_storage(address.as_ptr(), key.to_be_bytes::<32>().as_ptr(), out.as_mut_ptr())
        };
        if status == PENDING {
            return Err(HostError::Pending);
        }
        if status != FOUND {
            return Err(HostError::Storage { address: *address, key: *key });
        }
        Ok(Word::from_be_bytes(out))
    }

    fn get_block_hash(&mut self, number: &Word) -> Result<B256, Self::Error> {
        let mut out = [0u8; 32];
        let status =
            unsafe { host_get_block_hash(number.to_be_bytes::<32>().as_ptr(), out.as_mut_ptr()) };
        if status == PENDING {
            return Err(HostError::Pending);
        }
        if status != FOUND {
            return Err(HostError::BlockHash(*number));
        }
        Ok(B256::from_slice(&out))
    }
}

/// A host read the adapter could not complete.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HostError {
    /// `get_account` failed.
    Account(Address),
    /// A read the host has not fetched yet. The attempt is abandoned, not failed.
    Pending,
    /// `get_block_hash` failed.
    BlockHash(Word),
    /// The host returned code that is not valid evm2 bytecode.
    Bytecode(B256),
    /// `get_code_by_hash` failed.
    Code(B256),
    /// The host reported more code than the landing buffer holds.
    CodeTooLarge {
        /// Length the host reported.
        length: usize,
        /// Buffer capacity.
        max: usize,
    },
    /// `get_storage` failed.
    Storage {
        /// Account whose slot was read.
        address: Address,
        /// Slot key.
        key: Word,
    },
}

impl fmt::Display for HostError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Account(address) => write!(f, "host could not read account {address}"),
            Self::Pending => write!(f, "host has not fetched a value this read needs"),
            Self::BlockHash(number) => write!(f, "host could not read block hash {number}"),
            Self::Bytecode(code_hash) => {
                write!(f, "host returned malformed bytecode for {code_hash}")
            }
            Self::Code(code_hash) => write!(f, "host could not read code {code_hash}"),
            Self::CodeTooLarge { length, max } => {
                write!(f, "host reported {length} code bytes, over the {max} byte maximum")
            }
            Self::Storage { address, key } => {
                write!(f, "host could not read storage {address} slot {key}")
            }
        }
    }
}

impl core::error::Error for HostError {}
