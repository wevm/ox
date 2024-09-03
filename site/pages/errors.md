---
showOutline: 1
---

# Errors [Glossary of Errors in Ox]




## `AbiDecodingDataSizeTooSmallError`

TODO



## `AbiDecodingZeroDataError`

TODO



## `AbiEncodingArrayLengthMismatchError`

The length of the array value does not match the length specified in the corresponding ABI parameter.

### Example
```ts twoslash
// @noErrors
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['uint256[3]'], [[69n, 420n]])
//                             ↑ expected: 3  ↑ ❌ length: 2
// @error: AbiEncodingArrayLengthMismatchError: ABI encoding array length mismatch
// @error: for type `uint256[3]`. Expected: `3`. Given: `2`.
```
### Solution

Pass an array of the correct length.
```ts twoslash
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['uint256[3]'], [[69n, 420n, 69n]])
//                           ↑ ✅ length: 3
```



## `AbiEncodingBytesSizeMismatchError`

The size of the bytes value does not match the size specified in the corresponding ABI parameter.

### Example
```ts twoslash
// @noErrors
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['bytes8'], [['0xdeadbeefdeadbeefdeadbeef']])
//                          ↑ expected: 8 bytes  ↑ ❌ size: 12 bytes
// @error: AbiEncodingBytesSizeMismatchError: Size of bytes "0xdeadbeefdeadbeefdeadbeef"
// @error: (bytes12) does not match expected size (bytes8).
```
### Solution

Pass a bytes value of the correct size.
```ts twoslash
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['bytes8'], ['0xdeadbeefdeadbeef'])
//                        ↑ ✅ size: 8 bytes
```



## `AbiEncodingInvalidArrayError`

The value provided is not a valid array as specified in the corresponding ABI parameter.

### Example
```ts twoslash
// @noErrors
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['uint256[3]'], [69])
```
### Solution

Pass an array value.



## `AbiEncodingLengthMismatchError`

The length of the values to encode does not match the length of the ABI parameters.

### Example
```ts twoslash
// @noErrors
import { Abi } from 'ox'
// ---cut---
Abi.encodeParameters(['string', 'uint256'], ['hello'])
// @error: AbiEncodingLengthMismatchError: ABI encoding params/values length mismatch.
// @error: Expected length (params): 2
// @error: Given length (values): 1
```
### Solution

Pass the correct number of values to encode.

### Solution

Pass a [valid ABI type](https://docs.soliditylang.org/en/develop/abi-spec.html#types).



## `AbiItemAmbiguityError`

TODO



## `BaseError`

Base error class inherited by all errors thrown by ox.



## `BlobSizeTooLargeError`

TODO



## `CannotInferTransactionTypeError`

TODO



## `EmptyBlobError`

TODO



## `EmptyBlobVersionedHashesError`

TODO



## `FeeCapTooHighError`

TODO



## `GasPriceTooHighError`

TODO



## `IntegerOutOfRangeError`

TODO



## `InvalidAbiTypeError`

TODO



## `InvalidAddressChecksumError`

TODO



## `InvalidAddressError`

TODO



## `InvalidAddressInputError`

TODO



## `InvalidBytesBooleanError`

TODO



## `InvalidBytesTypeError`

TODO



## `InvalidChainIdError`

TODO



## `InvalidHexBooleanError`

TODO



## `InvalidHexLengthError`

TODO



## `InvalidHexTypeError`

TODO



## `InvalidHexValueError`

TODO



## `InvalidPrimaryTypeError`

TODO



## `InvalidSerializedSignatureSizeError`

TODO



## `InvalidSerializedTransactionError`

TODO



## `InvalidSignatureRError`

TODO



## `InvalidSignatureSError`

TODO



## `InvalidSignatureVError`

TODO



## `InvalidSignatureYParityError`

TODO



## `InvalidTypeError`

TODO



## `InvalidVersionedHashSizeError`

TODO



## `InvalidVersionedHashVersionError`

TODO



## `MissingSignaturePropertiesError`

TODO



## `NegativeOffsetError`

TODO



## `PositionOutOfBoundsError`

TODO



## `RecursiveReadLimitExceededError`

TODO



## `SiweInvalidMessageFieldError`

TODO



## `SizeExceedsPaddingSizeError`

TODO



## `SizeOverflowError`

TODO



## `SliceOffsetOutOfBoundsError`

TODO



## `TipAboveFeeCapError`

TODO



## `TransactionTypeNotImplementedError`

TODO

