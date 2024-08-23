import { expect, test } from 'vitest'
import * as exports from './Errors.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidAddressError",
      "InvalidAddressInputError",
      "InvalidAddressChecksumError",
      "BaseError",
      "BlobSizeTooLargeError",
      "EmptyBlobError",
      "EmptyBlobVersionedHashesError",
      "InvalidVersionedHashSizeError",
      "InvalidVersionedHashVersionError",
      "NegativeOffsetError",
      "PositionOutOfBoundsError",
      "RecursiveReadLimitExceededError",
      "IntegerOutOfRangeError",
      "InvalidBytesBooleanError",
      "InvalidBytesTypeError",
      "InvalidHexBooleanError",
      "InvalidHexLengthError",
      "InvalidHexTypeError",
      "InvalidHexValueError",
      "InvalidTypeError",
      "SizeExceedsPaddingSizeError",
      "SizeOverflowError",
      "SliceOffsetOutOfBoundsError",
      "InvalidSerializedSignatureSizeError",
      "InvalidSignatureRError",
      "InvalidSignatureSError",
      "InvalidSignatureVError",
      "InvalidSignatureYParityError",
      "MissingSignaturePropertiesError",
      "SiweInvalidMessageFieldError",
      "CannotInferTransactionTypeError",
      "FeeCapTooHighError",
      "GasPriceTooHighError",
      "InvalidChainIdError",
      "InvalidSerializedTransactionError",
      "TipAboveFeeCapError",
      "TransactionTypeNotImplementedError",
      "InvalidPrimaryTypeError",
    ]
  `)
})
