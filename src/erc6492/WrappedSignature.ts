import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Signature from '../core/Signature.js'

/** ERC-6492 Wrapped Signature. */
export type WrappedSignature = {
  /** Calldata to pass to the target address for counterfactual verification. */
  data: Hex.Hex
  /** The original signature. */
  signature: Signature.Signature
  /** The target address to use for counterfactual verification. */
  to: Address.Address
}

/**
 * Magic bytes used to identify ERC-6492 wrapped signatures.
 */
export const magicBytes =
  '0x6492649264926492649264926492649264926492649264926492649264926492' as const

/**
 * Asserts that the wrapped signature is valid.
 *
 * @example
 * ```ts twoslash
 * import { WrappedSignature } from 'ox/erc6492'
 *
 * WrappedSignature.assert('0xdeadbeef')
 * // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-6492 wrapped signature.
 * ```
 *
 * @param wrapped - The wrapped signature to assert.
 */
export function assert(wrapped: Hex.Hex) {
  if (Hex.slice(wrapped, -32) !== magicBytes)
    throw new InvalidWrappedSignatureError(wrapped)
}

export declare namespace assert {
  type ErrorType =
    | InvalidWrappedSignatureError
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Parses an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { WrappedSignature } from 'ox/erc6492' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * // Instantiate from serialized format. // [!code focus]
 * const wrapped = WrappedSignature.from('0x...') // [!code focus]
 * // @log: { data: '0x...', signature: { ... }, to: '0x...', } // [!code focus]
 *
 * // Instantiate from constituent parts. // [!code focus]
 * const wrapped = WrappedSignature.from({ // [!code focus]
 *   data: '0x...', // [!code focus]
 *   signature, // [!code focus]
 *   to: '0x...', // [!code focus]
 * })
 * // @log: { data: '0x...', signature: { ... }, to: '0x...', }
 * ```
 *
 * @param wrapped - Wrapped signature to parse.
 * @returns Wrapped signature.
 */
export function from(wrapped: WrappedSignature | Hex.Hex): WrappedSignature {
  if (typeof wrapped === 'string') return fromHex(wrapped)
  return wrapped
}

export declare namespace from {
  type ReturnType = WrappedSignature

  type ErrorType =
    | AbiParameters.from.ErrorType
    | AbiParameters.decode.ErrorType
    | Signature.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Parses an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * import { WrappedSignature } from 'ox/erc6492'
 *
 * const { data, signature, to } = WrappedSignature.fromHex('0x...')
 * ```
 *
 * @param wrapped - Wrapped signature to parse.
 * @returns Wrapped signature.
 */
export function fromHex(wrapped: Hex.Hex): WrappedSignature {
  assert(wrapped)

  const [to, data, signature_hex] = AbiParameters.decode(
    AbiParameters.from('address, bytes, bytes'),
    wrapped,
  )

  const signature = Signature.fromHex(signature_hex)

  return { data, signature, to }
}

export declare namespace fromHex {
  type ErrorType =
    | AbiParameters.from.ErrorType
    | AbiParameters.decode.ErrorType
    | Signature.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification).
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { WrappedSignature } from 'ox/erc6492' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * const wrapped = WrappedSignature.toHex({ // [!code focus]
 *   data: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 *   to: '0x00000000219ab540356cBB839Cbe05303d7705Fa', // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param value - Wrapped signature to serialize.
 * @returns Serialized wrapped signature.
 */
export function toHex(value: WrappedSignature): Hex.Hex {
  const { data, signature, to } = value

  return Hex.concat(
    AbiParameters.encode(AbiParameters.from('address, bytes, bytes'), [
      to,
      data,
      Signature.toHex(signature),
    ]),
    magicBytes,
  )
}

export declare namespace toHex {
  type ErrorType =
    | AbiParameters.encode.ErrorType
    | Hex.concat.ErrorType
    | Signature.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates a wrapped signature. Returns `true` if the wrapped signature is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { WrappedSignature } from 'ox/erc6492'
 *
 * const valid = WrappedSignature.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param wrapped - The wrapped signature to validate.
 * @returns `true` if the wrapped signature is valid, `false` otherwise.
 */
export function validate(wrapped: Hex.Hex): boolean {
  try {
    assert(wrapped)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when the ERC-6492 wrapped signature is invalid. */
export class InvalidWrappedSignatureError extends Errors.BaseError {
  override readonly name = 'WrappedSignature.InvalidWrappedSignatureError'

  constructor(wrapped: Hex.Hex) {
    super(`Value \`${wrapped}\` is an invalid ERC-6492 wrapped signature.`)
  }
}
