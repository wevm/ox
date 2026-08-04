//! Response statuses and lossless failure encoding.
//!
//! Database failures, invalid transactions, and adapter-boundary failures stay
//! distinct: reverts and exceptional halts are not failures at all, they are
//! fields on a successful `TxResult`.

use crate::abi::Writer;
use alloc::string::ToString;
use alloy_primitives::U256;
use evm2::registry::HandlerError;

/// Response statuses.
pub mod status {
    /// The operation succeeded.
    pub const OK: u16 = 0;
    /// The request could not be decoded, or named an unknown operation.
    pub const ABI: u16 = 1;
    /// The operation needs an engine that has not been created.
    pub const ENGINE_MISSING: u16 = 2;
    /// The engine is already executing. A host callback may not reenter it.
    pub const ENGINE_BUSY: u16 = 3;
    /// evm2 rejected or aborted the transaction. The payload encodes which.
    pub const HANDLER: u16 = 4;
    /// A host database read failed. The payload carries the host's message.
    pub const DATABASE: u16 = 5;
    /// An executed transaction still holds the engine. Resolve it first.
    pub const ENGINE_BORROWED: u16 = 6;
    /// A resolution named no outstanding executed transaction.
    pub const NOT_EXECUTED: u16 = 7;
}

/// Discriminants for [`HandlerError`] variants.
///
/// The match producing these is exhaustive, so an evm2 revision that adds a
/// variant fails to compile here rather than silently collapsing into a
/// neighbour.
pub mod handler {
    /// [`HandlerError::Fatal`]. One word: the raw error code.
    pub const FATAL: u16 = 1;
    /// [`HandlerError::External`].
    pub const EXTERNAL: u16 = 2;
    /// [`HandlerError::UnsupportedTransactionType`]. One word: the type byte.
    pub const UNSUPPORTED_TRANSACTION_TYPE: u16 = 3;
    /// [`HandlerError::WrongTransactionType`]. One word: the expected type byte.
    pub const WRONG_TRANSACTION_TYPE: u16 = 4;
    /// [`HandlerError::InvalidNonce`]. Words: expected, got.
    pub const INVALID_NONCE: u16 = 5;
    /// [`HandlerError::InvalidChainId`]. Words: expected, got.
    pub const INVALID_CHAIN_ID: u16 = 6;
    /// [`HandlerError::MissingChainId`].
    pub const MISSING_CHAIN_ID: u16 = 7;
    /// [`HandlerError::IntrinsicGasTooLow`]. Words: required, got.
    pub const INTRINSIC_GAS_TOO_LOW: u16 = 8;
    /// [`HandlerError::InsufficientFunds`].
    pub const INSUFFICIENT_FUNDS: u16 = 9;
    /// [`HandlerError::RejectCallerWithCode`].
    pub const REJECT_CALLER_WITH_CODE: u16 = 10;
    /// [`HandlerError::NonceOverflow`].
    pub const NONCE_OVERFLOW: u16 = 11;
    /// [`HandlerError::GasLimitMoreThanBlock`]. Words: gas limit, block gas limit.
    pub const GAS_LIMIT_MORE_THAN_BLOCK: u16 = 12;
    /// [`HandlerError::TxGasLimitGreaterThanCap`]. Words: gas limit, cap.
    pub const TX_GAS_LIMIT_GREATER_THAN_CAP: u16 = 13;
    /// [`HandlerError::CreateInitCodeSizeLimit`]. Words: limit, got.
    pub const CREATE_INIT_CODE_SIZE_LIMIT: u16 = 14;
    /// [`HandlerError::OutOfFunds`].
    pub const OUT_OF_FUNDS: u16 = 15;
    /// [`HandlerError::SignerRecoveryFailed`].
    pub const SIGNER_RECOVERY_FAILED: u16 = 16;
    /// [`HandlerError::FeeCapLessThanBaseFee`]. Words: max fee per gas, base fee.
    pub const FEE_CAP_LESS_THAN_BASE_FEE: u16 = 17;
    /// [`HandlerError::EmptyAuthorizationList`].
    pub const EMPTY_AUTHORIZATION_LIST: u16 = 18;
    /// [`HandlerError::BlobFeeCapLessThanBlobBaseFee`]. Words: max fee per blob gas, blob base fee.
    pub const BLOB_FEE_CAP_LESS_THAN_BLOB_BASE_FEE: u16 = 19;
    /// [`HandlerError::EmptyBlobs`].
    pub const EMPTY_BLOBS: u16 = 20;
    /// [`HandlerError::TooManyBlobs`]. Words: have, max.
    pub const TOO_MANY_BLOBS: u16 = 21;
    /// [`HandlerError::BlobVersionNotSupported`].
    pub const BLOB_VERSION_NOT_SUPPORTED: u16 = 22;
    /// [`HandlerError::PriorityFeeGreaterThanMaxFee`].
    pub const PRIORITY_FEE_GREATER_THAN_MAX_FEE: u16 = 23;
    /// [`HandlerError::UnsupportedCaller`]. One word: the caller address.
    pub const UNSUPPORTED_CALLER: u16 = 24;
}

/// Writes a handler failure as `kind u16 | word count u8 | words | message`.
///
/// Every numeric field is a 32-byte big-endian word so one shape covers `u8`
/// through `U256`; addresses take their right-aligned word form.
pub fn write_handler(writer: &mut Writer, error: &HandlerError) {
    let (kind, words): (u16, &[U256]) = match error {
        HandlerError::Fatal(code) => (handler::FATAL, &[U256::from(code.get())]),
        HandlerError::External(_) => (handler::EXTERNAL, &[]),
        HandlerError::UnsupportedTransactionType(ty) => {
            (handler::UNSUPPORTED_TRANSACTION_TYPE, &[U256::from(*ty)])
        }
        HandlerError::WrongTransactionType { expected } => {
            (handler::WRONG_TRANSACTION_TYPE, &[U256::from(*expected)])
        }
        HandlerError::InvalidNonce { expected, got } => {
            (handler::INVALID_NONCE, &[U256::from(*expected), U256::from(*got)])
        }
        HandlerError::InvalidChainId { expected, got } => {
            (handler::INVALID_CHAIN_ID, &[U256::from(*expected), U256::from(*got)])
        }
        HandlerError::MissingChainId => (handler::MISSING_CHAIN_ID, &[]),
        HandlerError::IntrinsicGasTooLow { required, got } => {
            (handler::INTRINSIC_GAS_TOO_LOW, &[U256::from(*required), U256::from(*got)])
        }
        HandlerError::InsufficientFunds => (handler::INSUFFICIENT_FUNDS, &[]),
        HandlerError::RejectCallerWithCode => (handler::REJECT_CALLER_WITH_CODE, &[]),
        HandlerError::NonceOverflow => (handler::NONCE_OVERFLOW, &[]),
        HandlerError::GasLimitMoreThanBlock { gas_limit, block_gas_limit } => {
            (handler::GAS_LIMIT_MORE_THAN_BLOCK, &[U256::from(*gas_limit), *block_gas_limit])
        }
        HandlerError::TxGasLimitGreaterThanCap { gas_limit, cap } => {
            (handler::TX_GAS_LIMIT_GREATER_THAN_CAP, &[U256::from(*gas_limit), U256::from(*cap)])
        }
        HandlerError::CreateInitCodeSizeLimit { limit, got } => {
            (handler::CREATE_INIT_CODE_SIZE_LIMIT, &[U256::from(*limit), U256::from(*got)])
        }
        HandlerError::OutOfFunds => (handler::OUT_OF_FUNDS, &[]),
        HandlerError::SignerRecoveryFailed => (handler::SIGNER_RECOVERY_FAILED, &[]),
        HandlerError::FeeCapLessThanBaseFee { max_fee_per_gas, base_fee } => {
            (handler::FEE_CAP_LESS_THAN_BASE_FEE, &[*max_fee_per_gas, *base_fee])
        }
        HandlerError::EmptyAuthorizationList => (handler::EMPTY_AUTHORIZATION_LIST, &[]),
        HandlerError::BlobFeeCapLessThanBlobBaseFee { max_fee_per_blob_gas, blob_base_fee } => {
            (handler::BLOB_FEE_CAP_LESS_THAN_BLOB_BASE_FEE, &[
                *max_fee_per_blob_gas,
                *blob_base_fee,
            ])
        }
        HandlerError::EmptyBlobs => (handler::EMPTY_BLOBS, &[]),
        HandlerError::TooManyBlobs { have, max } => {
            (handler::TOO_MANY_BLOBS, &[U256::from(*have), U256::from(*max)])
        }
        HandlerError::BlobVersionNotSupported => (handler::BLOB_VERSION_NOT_SUPPORTED, &[]),
        HandlerError::PriorityFeeGreaterThanMaxFee => {
            (handler::PRIORITY_FEE_GREATER_THAN_MAX_FEE, &[])
        }
        HandlerError::UnsupportedCaller(address) => {
            (handler::UNSUPPORTED_CALLER, &[address.into_word().into()])
        }
    };

    writer.u16(kind);
    writer.u8(words.len() as u8);
    for word in words {
        writer.word(*word);
    }
    writer.str(&error.to_string());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::abi::{HEADER_SIZE, Reader};
    use alloc::{vec, vec::Vec};
    use alloy_primitives::Address;
    use evm2::ErrorCode;

    /// Every variant paired with the discriminant and words it must encode.
    ///
    /// The encoder's match is exhaustive, so this list going stale is the only
    /// way a variant can lose coverage.
    fn cases() -> Vec<(HandlerError, u16, Vec<U256>)> {
        let code = ErrorCode::new_custom(7).unwrap();
        vec![
            (HandlerError::Fatal(code), handler::FATAL, vec![U256::from(code.get())]),
            (HandlerError::external(HostFailure), handler::EXTERNAL, vec![]),
            (
                HandlerError::UnsupportedTransactionType(5),
                handler::UNSUPPORTED_TRANSACTION_TYPE,
                vec![U256::from(5)],
            ),
            (
                HandlerError::WrongTransactionType { expected: 2 },
                handler::WRONG_TRANSACTION_TYPE,
                vec![U256::from(2)],
            ),
            (
                HandlerError::InvalidNonce { expected: 3, got: 4 },
                handler::INVALID_NONCE,
                vec![U256::from(3), U256::from(4)],
            ),
            (
                HandlerError::InvalidChainId { expected: 1, got: 10 },
                handler::INVALID_CHAIN_ID,
                vec![U256::from(1), U256::from(10)],
            ),
            (HandlerError::MissingChainId, handler::MISSING_CHAIN_ID, vec![]),
            (
                HandlerError::IntrinsicGasTooLow { required: 21_000, got: 100 },
                handler::INTRINSIC_GAS_TOO_LOW,
                vec![U256::from(21_000), U256::from(100)],
            ),
            (HandlerError::InsufficientFunds, handler::INSUFFICIENT_FUNDS, vec![]),
            (HandlerError::RejectCallerWithCode, handler::REJECT_CALLER_WITH_CODE, vec![]),
            (HandlerError::NonceOverflow, handler::NONCE_OVERFLOW, vec![]),
            (
                HandlerError::GasLimitMoreThanBlock {
                    gas_limit: 30_000_000,
                    block_gas_limit: U256::from(1_000),
                },
                handler::GAS_LIMIT_MORE_THAN_BLOCK,
                vec![U256::from(30_000_000), U256::from(1_000)],
            ),
            (
                HandlerError::TxGasLimitGreaterThanCap { gas_limit: 40, cap: 30 },
                handler::TX_GAS_LIMIT_GREATER_THAN_CAP,
                vec![U256::from(40), U256::from(30)],
            ),
            (
                HandlerError::CreateInitCodeSizeLimit { limit: 49_152, got: 49_153 },
                handler::CREATE_INIT_CODE_SIZE_LIMIT,
                vec![U256::from(49_152), U256::from(49_153)],
            ),
            (HandlerError::OutOfFunds, handler::OUT_OF_FUNDS, vec![]),
            (HandlerError::SignerRecoveryFailed, handler::SIGNER_RECOVERY_FAILED, vec![]),
            (
                HandlerError::FeeCapLessThanBaseFee {
                    max_fee_per_gas: U256::from(1),
                    base_fee: U256::from(2),
                },
                handler::FEE_CAP_LESS_THAN_BASE_FEE,
                vec![U256::from(1), U256::from(2)],
            ),
            (HandlerError::EmptyAuthorizationList, handler::EMPTY_AUTHORIZATION_LIST, vec![]),
            (
                HandlerError::BlobFeeCapLessThanBlobBaseFee {
                    max_fee_per_blob_gas: U256::from(3),
                    blob_base_fee: U256::from(4),
                },
                handler::BLOB_FEE_CAP_LESS_THAN_BLOB_BASE_FEE,
                vec![U256::from(3), U256::from(4)],
            ),
            (HandlerError::EmptyBlobs, handler::EMPTY_BLOBS, vec![]),
            (
                HandlerError::TooManyBlobs { have: 7, max: 6 },
                handler::TOO_MANY_BLOBS,
                vec![U256::from(7), U256::from(6)],
            ),
            (HandlerError::BlobVersionNotSupported, handler::BLOB_VERSION_NOT_SUPPORTED, vec![]),
            (
                HandlerError::PriorityFeeGreaterThanMaxFee,
                handler::PRIORITY_FEE_GREATER_THAN_MAX_FEE,
                vec![],
            ),
            (
                HandlerError::UnsupportedCaller(Address::with_last_byte(0x42)),
                handler::UNSUPPORTED_CALLER,
                vec![Address::with_last_byte(0x42).into_word().into()],
            ),
        ]
    }

    #[derive(Debug)]
    struct HostFailure;

    impl core::fmt::Display for HostFailure {
        fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
            f.write_str("host failure")
        }
    }

    impl core::error::Error for HostFailure {}

    #[test]
    fn write_handler_encodes_every_variant() {
        for (error, kind, words) in cases() {
            let mut writer = Writer::new();
            write_handler(&mut writer, &error);
            let response = writer.finish(status::HANDLER);

            let payload = &response[HEADER_SIZE..];
            assert_eq!(
                u16::from_le_bytes(payload[0..2].try_into().unwrap()),
                kind,
                "kind for {error:?}",
            );
            assert_eq!(payload[2], words.len() as u8, "word count for {error:?}");

            let mut reader = Reader::new(&payload[3..]);
            for expected in &words {
                assert_eq!(reader.word(), Ok(*expected), "word for {error:?}");
            }
            let message = reader.bytes(4096).expect("message");
            assert_eq!(
                core::str::from_utf8(message).unwrap(),
                alloc::format!("{error}"),
                "message for {error:?}",
            );
            assert_eq!(reader.finish(), Ok(()), "trailing bytes for {error:?}");
        }
    }

    #[test]
    fn handler_kinds_are_distinct_and_contiguous() {
        let mut kinds: Vec<u16> = cases().iter().map(|(_, kind, _)| *kind).collect();
        kinds.sort_unstable();
        assert_eq!(kinds, (1..=kinds.len() as u16).collect::<Vec<_>>());
    }
}
