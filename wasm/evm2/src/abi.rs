//! Versioned binary ABI shared by the adapter and its TypeScript codec.
//!
//! ABI v1 is Ox's compatibility boundary: evm2's Rust types, lifetimes, and
//! generics never cross it. Integers are fixed-width little-endian, 256-bit
//! values are exactly 32 big-endian bytes, addresses 20 bytes, and hashes 32.

use alloc::vec::Vec;
use alloy_primitives::{Address, B256, U256};
use core::fmt;

/// Magic bytes prefixing every request and response header.
pub const MAGIC: u32 = u32::from_le_bytes(*b"EVM2");

/// ABI version.
pub const VERSION: u16 = 1;

/// Request and response header size, in bytes.
///
/// Layout: `magic u32 | version u16 | op-or-status u16 | flags u32 | length u32`.
pub const HEADER_SIZE: usize = 16;

/// Largest request the adapter will accept, in bytes.
///
/// Bounds the arena before any allocation so an absurd length is rejected rather
/// than attempted. Consensus sets no usable ceiling here: the block gas limit is
/// caller-supplied, and before Osaka's per-transaction cap a high limit makes
/// very large calldata valid at four gas per zero byte. This is therefore an
/// adapter bound, chosen to exceed any transaction a real chain would carry
/// while still protecting linear memory.
pub const MAX_REQUEST: usize = 64 * 1024 * 1024;

/// ABI operations.
pub mod op {
    /// Creates or replaces the engine.
    pub const CREATE: u16 = 1;
    /// Drops the engine and releases its allocations.
    pub const DESTROY: u16 = 2;
    /// Replaces the block environment and selected specification.
    pub const SET_BLOCK: u16 = 3;
    /// Executes a transaction for its result and discards its state changes.
    pub const CALL_TX: u16 = 4;
    /// Reads an account through the accepted overlay and the database.
    pub const READ_ACCOUNT: u16 = 5;
    /// Executes a transaction and leaves its state changes pending.
    pub const TRANSACT: u16 = 6;
    /// Accepts the pending transaction into the engine's overlay.
    pub const COMMIT: u16 = 7;
    /// Drops the pending transaction and keeps its result.
    pub const DISCARD: u16 = 8;
    /// Moves the pending transaction out as owned state.
    pub const DETACH: u16 = 9;
    /// Streams the pending changes to the host, then accepts the transaction.
    pub const COMMIT_WITH: u16 = 10;
    /// Streams the pending changes to the host, then drops the transaction.
    pub const DISCARD_WITH: u16 = 11;
    /// Installs or removes the execution inspector.
    pub const SET_INSPECTOR: u16 = 12;
    /// Attaches a block access list and sets the database-fallback switch.
    pub const SET_BAL: u16 = 13;
    /// Enables or discards the block access list builder.
    pub const SET_BAL_BUILDER: u16 = 14;
    /// Drains the built block access list.
    pub const TAKE_BAL: u16 = 15;
    /// Sets the block access index reads and writes are keyed at.
    pub const SET_BAL_INDEX: u16 = 16;
    /// Streams the pending changes into the block accumulator, then commits.
    pub const COMMIT_TO: u16 = 17;
    /// Starts a block accumulator, returning the token identifying it.
    pub const START_BLOCK_STATE: u16 = 18;
    /// Drains the block state a token identifies.
    pub const TAKE_BLOCK_STATE: u16 = 19;
    /// Prewarms the precompile addresses.
    pub const WARM_PRECOMPILES: u16 = 20;
    /// Applies caller-supplied changes to the accepted state overlay.
    pub const COMMIT_SOURCE: u16 = 21;
    /// Executes a system call and parks its handle.
    pub const SYSTEM_CALL: u16 = 22;
}

/// Builds a response header with an empty payload.
///
/// This exists so a status the adapter cannot allocate for, such as refusing a
/// reentrant call, still answers with a well-formed response.
pub const fn header(status: u16) -> [u8; HEADER_SIZE] {
    let magic = MAGIC.to_le_bytes();
    let version = VERSION.to_le_bytes();
    let status = status.to_le_bytes();
    [
        magic[0], magic[1], magic[2], magic[3], version[0], version[1], status[0], status[1], 0, 0,
        0, 0, 0, 0, 0, 0,
    ]
}

/// Header parsed from a request.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Header {
    /// Requested operation, one of [`op`].
    pub op: u16,
    /// Reserved for future use. Must be zero.
    pub flags: u32,
    /// Payload length following the header.
    pub length: u32,
}

/// Parses and validates a request header, returning it with its payload.
pub fn request(bytes: &[u8]) -> Result<(Header, &[u8]), Error> {
    if bytes.len() < HEADER_SIZE {
        return Err(Error::Truncated);
    }
    let magic = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    if magic != MAGIC {
        return Err(Error::Magic(magic));
    }
    let version = u16::from_le_bytes(bytes[4..6].try_into().unwrap());
    if version != VERSION {
        return Err(Error::Version(version));
    }
    let header = Header {
        op: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
        flags: u32::from_le_bytes(bytes[8..12].try_into().unwrap()),
        length: u32::from_le_bytes(bytes[12..16].try_into().unwrap()),
    };
    if header.flags != 0 {
        return Err(Error::Flags(header.flags));
    }
    let payload = bytes.get(HEADER_SIZE..).ok_or(Error::Truncated)?;
    if payload.len() != header.length as usize {
        return Err(Error::Length { declared: header.length, actual: payload.len() });
    }
    Ok((header, payload))
}

/// Bounds-checked cursor over a request payload.
#[derive(Debug)]
pub struct Reader<'a> {
    bytes: &'a [u8],
}

impl<'a> Reader<'a> {
    /// Creates a reader over `bytes`.
    pub const fn new(bytes: &'a [u8]) -> Self {
        Self { bytes }
    }

    fn take(&mut self, length: usize) -> Result<&'a [u8], Error> {
        if self.bytes.len() < length {
            return Err(Error::Truncated);
        }
        let (head, tail) = self.bytes.split_at(length);
        self.bytes = tail;
        Ok(head)
    }

    /// Reads a single byte.
    pub fn u8(&mut self) -> Result<u8, Error> {
        Ok(self.take(1)?[0])
    }

    /// Reads a byte as a boolean, where any non-zero value is true.
    pub fn bool(&mut self) -> Result<bool, Error> {
        Ok(self.u8()? != 0)
    }

    /// Reads a 32-byte hash.
    pub fn hash(&mut self) -> Result<B256, Error> {
        Ok(B256::from_slice(self.take(32)?))
    }

    /// Reads a little-endian `u32`.
    pub fn u32(&mut self) -> Result<u32, Error> {
        Ok(u32::from_le_bytes(self.take(4)?.try_into().unwrap()))
    }

    /// Reads a little-endian `u64`.
    pub fn u64(&mut self) -> Result<u64, Error> {
        Ok(u64::from_le_bytes(self.take(8)?.try_into().unwrap()))
    }

    /// Reads a 32-byte big-endian 256-bit word.
    pub fn word(&mut self) -> Result<U256, Error> {
        Ok(U256::from_be_bytes::<32>(self.take(32)?.try_into().unwrap()))
    }

    /// Reads a 20-byte address.
    pub fn address(&mut self) -> Result<Address, Error> {
        Ok(Address::from_slice(self.take(20)?))
    }

    /// Reads a `u32`-length-prefixed byte sequence, rejecting lengths above `max`.
    pub fn bytes(&mut self, max: usize) -> Result<&'a [u8], Error> {
        let length = self.u32()? as usize;
        if length > max {
            return Err(Error::TooLarge { length, max });
        }
        self.take(length)
    }

    /// Asserts the payload was consumed exactly.
    ///
    /// Trailing bytes mean the caller encoded a different shape than the
    /// operation declares, so they are rejected rather than ignored.
    pub fn finish(&self) -> Result<(), Error> {
        if self.bytes.is_empty() { Ok(()) } else { Err(Error::Trailing(self.bytes.len())) }
    }
}

/// Response builder. Reserves the header up front and backfills it on finish.
#[derive(Debug)]
pub struct Writer {
    bytes: Vec<u8>,
}

impl Writer {
    /// Creates a writer with the header space reserved.
    pub fn new() -> Self {
        Self { bytes: alloc::vec![0; HEADER_SIZE] }
    }

    /// Appends a `u8`.
    pub fn u8(&mut self, value: u8) {
        self.bytes.push(value);
    }

    /// Appends a boolean as a `u8`.
    pub fn bool(&mut self, value: bool) {
        self.u8(u8::from(value));
    }

    /// Appends a little-endian `u16`.
    pub fn u16(&mut self, value: u16) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }

    /// Appends a little-endian `u32`.
    pub fn u32(&mut self, value: u32) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }

    /// Appends a little-endian `u64`.
    pub fn u64(&mut self, value: u64) {
        self.bytes.extend_from_slice(&value.to_le_bytes());
    }

    /// Appends a 32-byte big-endian 256-bit word.
    pub fn word(&mut self, value: U256) {
        self.bytes.extend_from_slice(&value.to_be_bytes::<32>());
    }

    /// Appends a 20-byte address.
    pub fn address(&mut self, value: Address) {
        self.bytes.extend_from_slice(value.as_slice());
    }

    /// Appends a 32-byte hash.
    pub fn hash(&mut self, value: B256) {
        self.bytes.extend_from_slice(value.as_slice());
    }

    /// Appends a `u32`-length-prefixed byte sequence.
    pub fn bytes(&mut self, value: &[u8]) {
        self.u32(value.len() as u32);
        self.bytes.extend_from_slice(value);
    }

    /// Appends a `u32`-length-prefixed UTF-8 string.
    pub fn str(&mut self, value: &str) {
        self.bytes(value.as_bytes());
    }

    /// Writes the header for `status` and returns the finished response.
    pub fn finish(mut self, status: u16) -> Vec<u8> {
        let length = (self.bytes.len() - HEADER_SIZE) as u32;
        self.bytes[0..4].copy_from_slice(&MAGIC.to_le_bytes());
        self.bytes[4..6].copy_from_slice(&VERSION.to_le_bytes());
        self.bytes[6..8].copy_from_slice(&status.to_le_bytes());
        self.bytes[8..12].copy_from_slice(&0u32.to_le_bytes());
        self.bytes[12..16].copy_from_slice(&length.to_le_bytes());
        self.bytes
    }
}

/// Reason a request could not be decoded.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Error {
    /// Header magic did not match [`MAGIC`].
    Magic(u32),
    /// Header version is not [`VERSION`].
    Version(u16),
    /// Reserved header flags were set.
    Flags(u32),
    /// Declared payload length disagrees with the request.
    Length {
        /// Length declared by the header.
        declared: u32,
        /// Length actually supplied.
        actual: usize,
    },
    /// Payload ended before the operation's fields did.
    Truncated,
    /// Payload had bytes left over after the operation's fields.
    Trailing(usize),
    /// A length-prefixed sequence exceeded its bound.
    TooLarge {
        /// Declared length.
        length: usize,
        /// Maximum accepted length.
        max: usize,
    },
    /// Operation is not part of this ABI version.
    UnknownOp(u16),
    /// Specification ID is not an evm2 `SpecId` discriminant.
    UnknownSpecId(u32),
    /// A version field this ABI does not define.
    UnknownField(u32),
    /// A version field wider than this target can hold.
    FieldTooLarge {
        /// Field the caller set.
        field: &'static str,
        /// Value it carried.
        value: u64,
    },
    /// A feature index outside evm2's declared flags.
    UnknownFeature(u32),
    /// A gas parameter index outside evm2's `GasId`.
    UnknownGasId(u32),
    /// Transaction envelope failed EIP-2718 decoding.
    /// A change stream carried a record tag this ABI version does not define.
    UnknownRecord(u8),
    /// A block access list carried bytecode evm2 refuses to decode.
    Bytecode,
    Envelope,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Magic(magic) => write!(f, "expected magic {MAGIC:#010x}, got {magic:#010x}"),
            Self::Version(version) => {
                write!(f, "expected ABI version {VERSION}, got {version}")
            }
            Self::Flags(flags) => write!(f, "reserved header flags must be zero, got {flags:#x}"),
            Self::Length { declared, actual } => {
                write!(f, "header declared {declared} payload bytes, got {actual}")
            }
            Self::Truncated => f.write_str("request payload ended early"),
            Self::Trailing(count) => write!(f, "request payload had {count} trailing bytes"),
            Self::TooLarge { length, max } => {
                write!(f, "length {length} exceeds the {max} byte maximum")
            }
            Self::UnknownOp(op) => write!(f, "unknown operation {op}"),
            Self::UnknownSpecId(spec_id) => write!(f, "unknown spec id {spec_id}"),
            Self::UnknownField(bits) => write!(f, "unknown version field bits {bits:#x}"),
            Self::FieldTooLarge { field, value } => {
                write!(f, "{field} value {value} exceeds this target's usize")
            }
            Self::UnknownFeature(index) => write!(f, "unknown feature index {index}"),
            Self::UnknownGasId(index) => write!(f, "unknown gas parameter index {index}"),
            Self::UnknownRecord(tag) => write!(f, "unknown change record {tag}"),
            Self::Bytecode => f.write_str("block access list carries undecodable bytecode"),
            Self::Envelope => f.write_str("transaction envelope is not valid EIP-2718"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request_bytes(op: u16, payload: &[u8]) -> Vec<u8> {
        let mut bytes = Vec::from(header(op));
        bytes[6..8].copy_from_slice(&op.to_le_bytes());
        bytes[12..16].copy_from_slice(&(payload.len() as u32).to_le_bytes());
        bytes.extend_from_slice(payload);
        bytes
    }

    #[test]
    fn request_rejects_a_short_buffer() {
        assert_eq!(request(&[0; HEADER_SIZE - 1]), Err(Error::Truncated));
    }

    #[test]
    fn request_rejects_foreign_magic() {
        let mut bytes = request_bytes(op::CREATE, &[]);
        bytes[0] = 0;
        assert_eq!(request(&bytes), Err(Error::Magic(MAGIC & 0xffff_ff00)));
    }

    #[test]
    fn request_rejects_another_version() {
        let mut bytes = request_bytes(op::CREATE, &[]);
        bytes[4..6].copy_from_slice(&2u16.to_le_bytes());
        assert_eq!(request(&bytes), Err(Error::Version(2)));
    }

    #[test]
    fn request_rejects_reserved_flags() {
        let mut bytes = request_bytes(op::CREATE, &[]);
        bytes[8] = 1;
        assert_eq!(request(&bytes), Err(Error::Flags(1)));
    }

    #[test]
    fn request_rejects_a_mismatched_length() {
        let mut bytes = request_bytes(op::CREATE, &[1, 2, 3]);
        bytes[12..16].copy_from_slice(&4u32.to_le_bytes());
        assert_eq!(request(&bytes), Err(Error::Length { declared: 4, actual: 3 }));
    }

    #[test]
    fn reader_reads_every_field_width() {
        let mut payload = Vec::new();
        payload.extend_from_slice(&7u32.to_le_bytes());
        payload.extend_from_slice(&9u64.to_le_bytes());
        payload.extend_from_slice(&U256::from(11).to_be_bytes::<32>());
        payload.extend_from_slice(Address::with_last_byte(13).as_slice());
        payload.extend_from_slice(&2u32.to_le_bytes());
        payload.extend_from_slice(&[0xaa, 0xbb]);

        let mut reader = Reader::new(&payload);
        assert_eq!(reader.u32(), Ok(7));
        assert_eq!(reader.u64(), Ok(9));
        assert_eq!(reader.word(), Ok(U256::from(11)));
        assert_eq!(reader.address(), Ok(Address::with_last_byte(13)));
        assert_eq!(reader.bytes(8), Ok(&[0xaa, 0xbb][..]));
        assert_eq!(reader.finish(), Ok(()));
    }

    #[test]
    fn reader_rejects_trailing_bytes() {
        let mut reader = Reader::new(&[0; 5]);
        assert_eq!(reader.u32(), Ok(0));
        assert_eq!(reader.finish(), Err(Error::Trailing(1)));
    }

    #[test]
    fn reader_rejects_a_truncated_field() {
        let mut reader = Reader::new(&[0; 3]);
        assert_eq!(reader.u32(), Err(Error::Truncated));
    }

    #[test]
    fn reader_rejects_a_sequence_over_its_bound() {
        let mut payload = Vec::from(9u32.to_le_bytes());
        payload.extend_from_slice(&[0; 9]);
        let mut reader = Reader::new(&payload);
        assert_eq!(reader.bytes(8), Err(Error::TooLarge { length: 9, max: 8 }));
    }

    #[test]
    fn reader_rejects_a_length_that_overflows_the_payload() {
        let payload = Vec::from(u32::MAX.to_le_bytes());
        let mut reader = Reader::new(&payload);
        assert_eq!(
            reader.bytes(usize::MAX),
            Err(Error::Truncated),
            "a declared length beyond the payload must not be read",
        );
    }

    #[test]
    fn writer_backfills_its_header() {
        let mut writer = Writer::new();
        writer.u64(42);
        let response = writer.finish(3);
        assert_eq!(&response[0..4], &MAGIC.to_le_bytes());
        assert_eq!(&response[4..6], &VERSION.to_le_bytes());
        assert_eq!(&response[6..8], &3u16.to_le_bytes());
        assert_eq!(&response[12..16], &8u32.to_le_bytes());
        assert_eq!(&response[HEADER_SIZE..], &42u64.to_le_bytes());
    }

    #[test]
    fn header_matches_an_empty_writer() {
        assert_eq!(header(5).as_slice(), Writer::new().finish(5).as_slice());
    }
}
