import * as AbiParameters from '../core/AbiParameters.js'
import * as Authorization from '../core/Authorization.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Signature from '../core/Signature.js'

/** Unwrapped ERC-8010 signature. */
export type Unwrapped = {
  /** Authorization signed by the delegatee. */
  authorization: Authorization.Authorization<true>
  /** Data to initialize the delegation. */
  data?: Hex.Hex | undefined
  /** The original signature. */
  signature: Hex.Hex
}

/** Wrapped ERC-8010 signature. */
export type Wrapped = Hex.Hex

/**
 * Magic bytes used to identify ERC-8010 wrapped signatures.
 */
export const magicBytes =
  '0x8010801080108010801080108010801080108010801080108010801080108010' as const

/**
 * Asserts that the wrapped signature is valid.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc8010 } from 'ox/erc8010'
 *
 * SignatureErc8010.assert('0xdeadbeef')
 * // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-8010 wrapped signature.
 * ```
 *
 * @param value - The value to assert.
 */
export function assert(value: Unwrapped | Wrapped) {
  if (typeof value === 'string') {
    if (Hex.slice(value, -32) !== magicBytes)
      throw new InvalidWrappedSignatureError(value)
  } else Signature.assert(value.authorization)
}

export declare namespace assert {
  type ErrorType =
    | InvalidWrappedSignatureError
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Parses an [ERC-8010 wrapped signature](https://github.com/jxom/ERCs/blob/16f7e3891fff2e1e9c25dea0485497739db8a816/ERCS/erc-8010.md) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { SignatureErc8010 } from 'ox/erc8010' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * // Instantiate from serialized format. // [!code focus]
 * const wrapped = SignatureErc8010.from('0x...') // [!code focus]
 * // @log: { authorization: { ... }, data: '0x...', signature: { ... } } // [!code focus]
 *
 * // Instantiate from constituent parts. // [!code focus]
 * const wrapped = SignatureErc8010.from({ // [!code focus]
 *   authorization: { ... }, // [!code focus]
 *   data: '0x...', // [!code focus]
 *   signature, // [!code focus]
 * })
 * // @log: { authorization: { ... }, data: '0x...', signature: { ... } }
 * ```
 *
 * @param value - Value to parse.
 * @returns Parsed value.
 */
export function from(value: Unwrapped | Wrapped): Unwrapped {
  if (typeof value === 'string') return unwrap(value)
  return value
}

export declare namespace from {
  type ErrorType = unwrap.ErrorType | Errors.GlobalErrorType
}

/**
 * Unwraps an [ERC-8010 wrapped signature](https://github.com/jxom/ERCs/blob/16f7e3891fff2e1e9c25dea0485497739db8a816/ERCS/erc-8010.md) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc8010 } from 'ox/erc8010'
 *
 * const { authorization, data, signature } = SignatureErc8010.unwrap('0x...')
 * ```
 *
 * @param wrapped - Wrapped signature to unwrap.
 * @returns Unwrapped signature.
 */
export function unwrap(wrapped: Wrapped): Unwrapped {
  assert(wrapped)

  const suffixLength = Hex.toNumber(Hex.slice(wrapped, -64, -32))
  const suffix = Hex.slice(wrapped, -suffixLength - 64, -64)
  const signature = Hex.slice(wrapped, 0, -suffixLength - 64)

  const chainId = Hex.toNumber(Hex.slice(suffix, 0, 32))
  const delegation = Hex.slice(suffix, 32, 52)
  const nonce = Hex.toBigInt(Hex.slice(suffix, 52, 84))
  const yParity = Hex.toNumber(Hex.slice(suffix, 84, 85))
  const r = Hex.toBigInt(Hex.slice(suffix, 85, 117))
  const s = Hex.toBigInt(Hex.slice(suffix, 117, 149))

  const authorization = Authorization.from({
    address: delegation,
    chainId,
    nonce,
    yParity,
    r,
    s,
  })
  const data = (() => {
    try {
      return Hex.slice(suffix, 149)
    } catch {
      return undefined
    }
  })()

  return { authorization, data, signature }
}

export declare namespace unwrap {
  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Wraps a signature into [ERC-8010 format](https://github.com/jxom/ERCs/blob/16f7e3891fff2e1e9c25dea0485497739db8a816/ERCS/erc-8010.md).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { SignatureErc8010 } from 'ox/erc8010' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * const wrapped = SignatureErc8010.wrap({ // [!code focus]
 *   authorization: { ... }, // [!code focus]
 *   data: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param value - Values to wrap.
 * @returns Wrapped signature.
 */
export function wrap(value: Unwrapped): Wrapped {
  assert(value)

  const { data, signature } = value
  const authorization = AbiParameters.encodePacked(
    ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
    [
      BigInt(value.authorization.chainId),
      value.authorization.address,
      BigInt(value.authorization.nonce),
      value.authorization.yParity,
      value.authorization.r,
      value.authorization.s,
    ],
  )
  const suffix = AbiParameters.encodePacked(
    ['bytes', 'bytes'],
    [authorization, data ?? '0x'],
  )
  const suffixLength = Hex.fromNumber(Hex.size(suffix), { size: 32 })
  return Hex.concat(signature, suffix, suffixLength, magicBytes)
}

export declare namespace wrap {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Validates a wrapped signature. Returns `true` if the wrapped signature is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc8010 } from 'ox/erc8010'
 *
 * const valid = SignatureErc8010.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param value - The value to validate.
 * @returns `true` if the value is valid, `false` otherwise.
 */
export function validate(value: Unwrapped | Wrapped): boolean {
  try {
    assert(value)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when the ERC-8010 wrapped signature is invalid. */
export class InvalidWrappedSignatureError extends Errors.BaseError {
  override readonly name = 'SignatureErc8010.InvalidWrappedSignatureError'

  constructor(wrapped: Wrapped) {
    super(`Value \`${wrapped}\` is an invalid ERC-8010 wrapped signature.`)
  }
}
