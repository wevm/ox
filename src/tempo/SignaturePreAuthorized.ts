import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Rlp from '../core/Rlp.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

/** Unwrapped [TIP-1165](https://tips.sh/1165) pre-authorized signature. */
export type Unwrapped = {
  /** Root key's signed authorization of the access key. */
  keyAuthorization: KeyAuthorization.Signed
  /** V2 keychain signature by the access key. */
  signature: SignatureEnvelope.Keychain
}

/** Wrapped [TIP-1165](https://tips.sh/1165) pre-authorized signature. */
export type Wrapped = Hex.Hex

/**
 * Magic bytes used to identify [TIP-1165](https://tips.sh/1165) pre-authorized signatures.
 */
export const magicBytes =
  '0x1165116511651165116511651165116511651165116511651165116511651165' as const

/**
 * Asserts that a value is a valid pre-authorized signature.
 *
 * A wrapped value must end with {@link ox#SignaturePreAuthorized.magicBytes} and decode strictly.
 * An unwrapped value must hold a V2 keychain signature with a primitive inner
 * signature, and a signed key authorization.
 *
 * @example
 * ```ts twoslash
 * import { SignaturePreAuthorized } from 'ox/tempo'
 *
 * SignaturePreAuthorized.assert('0xdeadbeef')
 * // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid pre-authorized signature.
 * ```
 *
 * @param value - The value to assert.
 */
export function assert(value: Unwrapped | Wrapped): void {
  if (typeof value === 'string') {
    unwrap(value)
    return
  }
  if (value === null || typeof value !== 'object')
    throw new InvalidUnwrappedSignatureError({
      reason: 'expected an object',
      value,
    })
  const { keyAuthorization, signature } = value
  assertKeychain(signature, value)
  if (!keyAuthorization || typeof keyAuthorization !== 'object')
    throw new InvalidUnwrappedSignatureError({
      reason: 'missing key authorization',
      value,
    })
  if (!keyAuthorization.signature)
    throw new InvalidUnwrappedSignatureError({
      reason: 'key authorization is not signed',
      value,
    })
  // The discriminants alone don't make an encodable value: require both
  // constituents to serialize.
  const reason = (() => {
    try {
      SignatureEnvelope.assert(signature.inner)
      SignatureEnvelope.serialize(signature)
    } catch {
      return 'malformed keychain signature'
    }
    try {
      SignatureEnvelope.assert(keyAuthorization.signature)
      KeyAuthorization.serialize(keyAuthorization)
    } catch {
      return 'malformed signed key authorization'
    }
    return undefined
  })()
  if (reason) throw new InvalidUnwrappedSignatureError({ reason, value })
}

export declare namespace assert {
  type ErrorType =
    | InvalidWrappedSignatureError
    | InvalidUnwrappedSignatureError
    | Errors.GlobalErrorType
}

/**
 * Instantiates a [TIP-1165](https://tips.sh/1165) pre-authorized signature from its wrapped or unwrapped form.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { SignaturePreAuthorized } from 'ox/tempo'
 *
 * // Instantiate from serialized format. // [!code focus]
 * const unwrapped = SignaturePreAuthorized.from('0x...') // [!code focus]
 * // @log: { keyAuthorization: { ... }, signature: { ... } } // [!code focus]
 *
 * // Instantiate from constituent parts. // [!code focus]
 * const unwrapped = SignaturePreAuthorized.from({
 *   // [!code focus]
 *   keyAuthorization, // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param value - Wrapped or unwrapped pre-authorized signature.
 * @returns Unwrapped pre-authorized signature.
 */
export function from(value: Unwrapped | Wrapped): Unwrapped {
  if (typeof value === 'string') return unwrap(value)
  assert(value)
  return value
}

export declare namespace from {
  type ReturnType = Unwrapped

  type ErrorType = assert.ErrorType | unwrap.ErrorType | Errors.GlobalErrorType
}

/**
 * Parses a [TIP-1165](https://tips.sh/1165) pre-authorized signature into its keychain signature and signed key authorization.
 *
 * Decoding is strict: the value must end with {@link ox#SignaturePreAuthorized.magicBytes},
 * and the rest must be one canonical RLP list of exactly two items with no trailing bytes.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { SignaturePreAuthorized } from 'ox/tempo'
 *
 * const { keyAuthorization, signature } =
 *   SignaturePreAuthorized.unwrap('0x...')
 * ```
 *
 * @param wrapped - Wrapped pre-authorized signature to parse.
 * @returns Unwrapped pre-authorized signature.
 */
export function unwrap(wrapped: Wrapped): Unwrapped {
  if (
    typeof wrapped !== 'string' ||
    !Hex.validate(wrapped, { even: true, strict: true }) ||
    Hex.size(wrapped) <= Hex.size(magicBytes) ||
    Hex.slice(wrapped, -Hex.size(magicBytes)).toLowerCase() !== magicBytes
  )
    throw new InvalidWrappedSignatureError(wrapped)

  try {
    const body = Hex.slice(wrapped, 0, -Hex.size(magicBytes))
    const decoded = Rlp.toHex(body)
    if (!Array.isArray(decoded) || decoded.length !== 2)
      throw new Errors.BaseError('expected an RLP list of exactly two items')
    // The RLP decoder ignores trailing input, so require the list to span
    // the whole body.
    if (Rlp.fromHex(decoded).toLowerCase() !== body.toLowerCase())
      throw new Errors.BaseError('unexpected bytes after the RLP list')
    const [signatureSerialized, keyAuthorizationTuple] = decoded
    if (
      typeof signatureSerialized !== 'string' ||
      !Hex.validate(signatureSerialized)
    )
      throw new Errors.BaseError('keychain signature is not an RLP string')
    if (!Array.isArray(keyAuthorizationTuple))
      throw new Errors.BaseError('signed key authorization is not an RLP list')
    if (keyAuthorizationTuple.length !== 2)
      throw new Errors.BaseError('key authorization is not signed')

    const signature = SignatureEnvelope.deserialize(signatureSerialized)
    assertKeychain(signature, wrapped)
    // Deserialization normalizes some inputs (such as a trailing envelope
    // magic). Require the exact bytes back so the result encodes the input.
    if (
      SignatureEnvelope.serialize(signature).toLowerCase() !==
      signatureSerialized.toLowerCase()
    )
      throw new Errors.BaseError('keychain signature is not canonical')

    const keyAuthorization = KeyAuthorization.fromTuple(
      keyAuthorizationTuple as unknown as KeyAuthorization.Tuple<true>,
    ) as KeyAuthorization.Signed
    if (
      KeyAuthorization.serialize(keyAuthorization).toLowerCase() !==
      Rlp.fromHex(keyAuthorizationTuple).toLowerCase()
    )
      throw new Errors.BaseError('signed key authorization is not canonical')

    return { keyAuthorization, signature }
  } catch (error) {
    if (error instanceof InvalidWrappedSignatureError) throw error
    throw new InvalidWrappedSignatureError(wrapped, { cause: error as Error })
  }
}

export declare namespace unwrap {
  type ErrorType = InvalidWrappedSignatureError | Errors.GlobalErrorType
}

/**
 * Serializes a [TIP-1165](https://tips.sh/1165) pre-authorized signature:
 * `rlp([keychain_signature, signed_key_authorization]) ‖ magic`.
 *
 * The signature must be a V2 keychain signature whose inner signature is
 * secp256k1, P256, or WebAuthn.
 *
 * @example
 * ```ts twoslash
 * import { Hash, Hex, Secp256k1 } from 'ox'
 * import {
 *   KeyAuthorization,
 *   SignatureEnvelope,
 *   SignaturePreAuthorized
 * } from 'ox/tempo'
 *
 * const account = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
 * const accessKey = Secp256k1.randomPrivateKey()
 * const rootKey = Secp256k1.randomPrivateKey()
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   chainId: 4217n,
 *   type: 'secp256k1'
 * })
 * const keyAuthorization = KeyAuthorization.from(
 *   authorization,
 *   {
 *     signature: SignatureEnvelope.from(
 *       Secp256k1.sign({
 *         payload:
 *           KeyAuthorization.getSignPayload(authorization),
 *         privateKey: rootKey
 *       })
 *     )
 *   }
 * )
 *
 * const hash = Hash.keccak256(Hex.fromString('hello'))
 * const signature = SignatureEnvelope.from({
 *   inner: SignatureEnvelope.from(
 *     Secp256k1.sign({
 *       payload: Hash.keccak256(
 *         Hex.concat('0x04', hash, account)
 *       ),
 *       privateKey: accessKey
 *     })
 *   ),
 *   userAddress: account
 * })
 *
 * const wrapped = SignaturePreAuthorized.wrap({
 *   // [!code focus]
 *   keyAuthorization, // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param value - Unwrapped pre-authorized signature.
 * @returns Wrapped pre-authorized signature.
 */
export function wrap(value: Unwrapped): Wrapped {
  assert(value)
  const { keyAuthorization, signature } = value
  return Hex.concat(
    Rlp.fromHex([
      SignatureEnvelope.serialize(signature),
      KeyAuthorization.toTuple(keyAuthorization) as never,
    ]),
    magicBytes,
  )
}

export declare namespace wrap {
  type ErrorType =
    | assert.ErrorType
    | SignatureEnvelope.serialize.ErrorType
    | KeyAuthorization.toTuple.ErrorType
    | Rlp.fromHex.ErrorType
    | Hex.concat.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates a wrapped pre-authorized signature. Returns `true` if it decodes strictly, `false` otherwise.
 *
 * This checks the encoding only. It does not verify either signature or read chain state.
 *
 * @example
 * ```ts twoslash
 * import { SignaturePreAuthorized } from 'ox/tempo'
 *
 * const valid = SignaturePreAuthorized.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param wrapped - The wrapped signature to validate.
 * @returns `true` if the wrapped signature is valid, `false` otherwise.
 */
export function validate(wrapped: Wrapped): boolean {
  try {
    unwrap(wrapped)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

function assertKeychain(
  signature: SignatureEnvelope.SignatureEnvelope | undefined,
  value: unknown,
): asserts signature is SignatureEnvelope.Keychain {
  const reason = (() => {
    if (!signature || typeof signature !== 'object')
      return 'missing keychain signature'
    if (signature.type !== 'keychain')
      return `expected a keychain signature, got \`${signature.type}\``
    if (signature.version === 'v1')
      return 'keychain V1 signatures are not supported'
    const type = (() => {
      try {
        return SignatureEnvelope.getType(signature.inner)
      } catch {
        return undefined
      }
    })()
    if (type !== 'secp256k1' && type !== 'p256' && type !== 'webAuthn')
      return `expected a secp256k1, p256, or webAuthn inner signature, got \`${type}\``
    return undefined
  })()
  if (!reason) return
  if (typeof value === 'string')
    throw new InvalidWrappedSignatureError(value, {
      cause: new Errors.BaseError(reason),
    })
  throw new InvalidUnwrappedSignatureError({ reason, value })
}

/** Thrown when a wrapped pre-authorized signature is invalid. */
export class InvalidWrappedSignatureError extends Errors.BaseError<
  Error | undefined
> {
  override readonly name = 'SignaturePreAuthorized.InvalidWrappedSignatureError'

  constructor(wrapped: unknown, options: { cause?: Error | undefined } = {}) {
    super(
      `Value \`${wrapped}\` is an invalid pre-authorized signature.`,
      options,
    )
  }
}

/** Thrown when an unwrapped pre-authorized signature is malformed. */
export class InvalidUnwrappedSignatureError extends Errors.BaseError {
  override readonly name =
    'SignaturePreAuthorized.InvalidUnwrappedSignatureError'

  /** The malformed value. */
  readonly value: unknown

  constructor({ reason, value }: { reason: string; value: unknown }) {
    super(`Value is an invalid unwrapped pre-authorized signature: ${reason}.`)
    this.value = value
  }
}
