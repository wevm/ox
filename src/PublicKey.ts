import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Json from './Json.js'
import type { Compute, ExactPartial } from './internal/types.js'

/** Root type for Address. */
export type PublicKey<
  compressed extends boolean = false,
  bigintType = bigint,
  numberType = number,
> = Compute<
  compressed extends true
    ? {
        prefix: numberType
        x: bigintType
        y?: undefined
      }
    : {
        prefix: numberType
        x: bigintType
        y: bigintType
      }
>

/**
 * Asserts that a {@link ox#PublicKey.PublicKey} is valid.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * PublicKey.assert({
 *   prefix: 4,
 *   y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * })
 * // @error: PublicKey.InvalidError: Value \`{"y":"1"}\` is not a valid public key.
 * // @error: Public key must contain:
 * // @error: - an `x` and `prefix` value (compressed)
 * // @error: - an `x`, `y`, and `prefix` value (uncompressed)
 * ```
 *
 * @param publicKey - The public key object to assert.
 */
export function assert(
  publicKey: ExactPartial<PublicKey>,
  options: assert.Options = {},
): asserts publicKey is PublicKey {
  const { compressed } = options
  const { prefix, x, y } = publicKey

  // Uncompressed
  if (
    compressed === false ||
    (typeof x === 'bigint' && typeof y === 'bigint')
  ) {
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError(),
      })
    return
  }

  // Compressed
  if (
    compressed === true ||
    (typeof x === 'bigint' && typeof y === 'undefined')
  ) {
    if (prefix !== 3 && prefix !== 2)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidCompressedPrefixError(),
      })
    return
  }

  // Unknown/invalid
  throw new InvalidError({ publicKey })
}

export declare namespace assert {
  type Options = {
    /** Whether or not the public key should be compressed. */
    compressed?: boolean
  }

  type ErrorType = InvalidError | InvalidPrefixError | Errors.GlobalErrorType
}

/**
 * Compresses a {@link ox#PublicKey.PublicKey}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const compressed = PublicKey.compress(publicKey) // [!code focus]
 * // @log: {
 * // @log:   prefix: 3,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log: }
 * ```
 *
 * @param publicKey - The public key to compress.
 * @returns The compressed public key.
 */
export function compress(publicKey: PublicKey<false>): PublicKey<true> {
  const { x, y } = publicKey
  return {
    prefix: y % 2n === 0n ? 2 : 3,
    x,
  }
}

export declare namespace compress {
  type ErrorType = Errors.GlobalErrorType
}

compress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as compress.ErrorType

/**
 * Deserializes a {@link ox#PublicKey.PublicKey} from a {@link ox#(Hex:type)} or {@link ox#(Bytes:namespace).(Bytes:type)} value.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.deserialize('0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5')
 * // @log: {
 * // @log:   prefix: 4,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log: }
 * ```
 *
 * @example
 * ### Deserializing a Compressed Public Key
 *
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.deserialize('0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75')
 * // @log: {
 * // @log:   prefix: 3,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log: }
 * ```
 *
 * @param publicKey - The serialized public key.
 * @returns The deserialized public key.
 */
export function deserialize(publicKey: Bytes.Bytes | Hex.Hex): PublicKey {
  const hex =
    typeof publicKey === 'string' ? publicKey : Hex.fromBytes(publicKey)

  if (hex.length !== 132 && hex.length !== 130 && hex.length !== 68)
    throw new InvalidSerializedSizeError({ publicKey })

  if (hex.length === 130) {
    const x = BigInt(Hex.slice(hex, 0, 32))
    const y = BigInt(Hex.slice(hex, 32, 64))
    return {
      prefix: 4,
      x,
      y,
    } as never
  }

  if (hex.length === 132) {
    const prefix = Number(Hex.slice(hex, 0, 1))
    const x = BigInt(Hex.slice(hex, 1, 33))
    const y = BigInt(Hex.slice(hex, 33, 65))
    return {
      prefix,
      x,
      y,
    } as never
  }

  const prefix = Number(Hex.slice(hex, 0, 1))
  const x = BigInt(Hex.slice(hex, 1, 33))
  return {
    prefix,
    x,
  } as never
}

export declare namespace deserialize {
  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as deserialize.ErrorType

/**
 * Instantiates a typed {@link ox#PublicKey.PublicKey} object from a {@link ox#PublicKey.PublicKey}, {@link ox#(Bytes:namespace).(Bytes:type)}, or {@link ox#(Hex:type)}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 * // @log: {
 * // @log:   prefix: 4,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log: }
 * ```
 *
 * @example
 * ### From Serialized
 *
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from('0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5')
 * // @log: {
 * // @log:   prefix: 4,
 * // @log:   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log: }
 * ```
 *
 * @param value - The public key value to instantiate.
 * @returns The instantiated {@link ox#PublicKey.PublicKey}.
 */
export function from<
  const publicKey extends
    | CompressedPublicKey
    | UncompressedPublicKey
    | Hex.Hex
    | Bytes.Bytes,
>(value: from.Value<publicKey>): from.ReturnType<publicKey> {
  const publicKey = (() => {
    if (Hex.validate(value)) return deserialize(value)
    if (Bytes.validate(value)) return deserialize(value)

    const { prefix, x, y } = value
    if (typeof x === 'bigint' && typeof y === 'bigint')
      return { prefix: prefix ?? 0x04, x, y }
    return { prefix, x }
  })()

  assert(publicKey)

  return publicKey as never
}

export declare namespace from {
  type Value<
    publicKey extends
      | CompressedPublicKey
      | UncompressedPublicKey
      | Hex.Hex
      | Bytes.Bytes = PublicKey,
  > = publicKey | CompressedPublicKey | UncompressedPublicKey

  type ReturnType<
    publicKey extends
      | CompressedPublicKey
      | UncompressedPublicKey
      | Hex.Hex
      | Bytes.Bytes = PublicKey,
  > = publicKey extends CompressedPublicKey | UncompressedPublicKey
    ? publicKey extends UncompressedPublicKey
      ? Compute<publicKey & { readonly prefix: 0x04 }>
      : publicKey
    : PublicKey

  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType

/** @internal */
export type CompressedPublicKey = PublicKey<true>

/** @internal */
export type UncompressedPublicKey = Omit<PublicKey<false>, 'prefix'> & {
  prefix?: PublicKey['prefix'] | undefined
}

/**
 * Serializes a {@link ox#PublicKey.PublicKey} to {@link ox#(Hex:type)} or {@link ox#(Bytes:namespace).(Bytes:type)}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const serialized = PublicKey.serialize(publicKey) // [!code focus]
 * // @log: '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
 * ```
 *
 * @param publicKey - The public key to serialize.
 * @returns The serialized public key.
 */
export function serialize<as extends 'Hex' | 'Bytes' = 'Hex'>(
  publicKey: PublicKey<boolean>,
  options: serialize.Options<as> = {},
): serialize.ReturnType<as> {
  assert(publicKey)

  const { prefix, x, y } = publicKey
  const { as = 'Hex', includePrefix = true } = options

  const publicKey_ = Hex.concat(
    includePrefix ? Hex.fromNumber(prefix, { size: 1 }) : '0x',
    Hex.fromNumber(x, { size: 32 }),
    // If the public key is not compressed, add the y coordinate.
    typeof y === 'bigint' ? Hex.fromNumber(y, { size: 32 }) : '0x',
  )

  if (as === 'Hex') return publicKey_ as never
  return Bytes.fromHex(publicKey_) as never
}

export declare namespace serialize {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Type to serialize the public key as.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /**
     * Whether to include the prefix in the serialized public key.
     * @default true
     */
    includePrefix?: boolean | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Bytes' ? Bytes.Bytes : never)

  type ErrorType =
    | Hex.fromNumber.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serialize.ErrorType

/**
 * Validates a {@link ox#PublicKey.PublicKey}. Returns `true` if valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const valid = PublicKey.validate({
 *   prefix: 4,
 *   y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * })
 * // @log: false
 * ```
 *
 * @param publicKey - The public key object to assert.
 */
export function validate(
  publicKey: ExactPartial<PublicKey>,
  options: validate.Options = {},
): boolean {
  try {
    assert(publicKey, options)
    return true
  } catch (error) {
    return false
  }
}

export declare namespace validate {
  type Options = {
    /** Whether or not the public key should be compressed. */
    compressed?: boolean
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Thrown when a public key is invalid.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * PublicKey.assert({ y: 1n })
 * // @error: PublicKey.InvalidError: Value `{"y":1n}` is not a valid public key.
 * // @error: Public key must contain:
 * // @error: - an `x` and `prefix` value (compressed)
 * // @error: - an `x`, `y`, and `prefix` value (uncompressed)
 * ```
 */
export class InvalidError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidError'

  constructor({ publicKey }: { publicKey: unknown }) {
    super(`Value \`${Json.stringify(publicKey)}\` is not a valid public key.`, {
      metaMessages: [
        'Public key must contain:',
        '- an `x` and `prefix` value (compressed)',
        '- an `x`, `y`, and `prefix` value (uncompressed)',
      ],
    })
  }
}

/** Thrown when a public key has an invalid prefix. */
export class InvalidPrefixError<
  cause extends InvalidCompressedPrefixError | InvalidUncompressedPrefixError =
    | InvalidCompressedPrefixError
    | InvalidUncompressedPrefixError,
> extends Errors.BaseError<cause> {
  override readonly name = 'PublicKey.InvalidPrefixError'

  constructor({ prefix, cause }: { prefix: number | undefined; cause: cause }) {
    super(`Prefix "${prefix}" is invalid.`, {
      cause,
    })
  }
}

/** Thrown when the public key has an invalid prefix for a compressed public key. */
export class InvalidCompressedPrefixError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidCompressedPrefixError'

  constructor() {
    super('Prefix must be 2 or 3 for compressed public keys.')
  }
}

/** Thrown when the public key has an invalid prefix for an uncompressed public key. */
export class InvalidUncompressedPrefixError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidUncompressedPrefixError'

  constructor() {
    super('Prefix must be 4 for uncompressed public keys.')
  }
}

/** Thrown when the public key has an invalid serialized size. */
export class InvalidSerializedSizeError extends Errors.BaseError {
  override readonly name = 'PublicKey.InvalidSerializedSizeError'

  constructor({ publicKey }: { publicKey: Hex.Hex | Bytes.Bytes }) {
    super(`Value \`${publicKey}\` is an invalid public key size.`, {
      metaMessages: [
        'Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).',
        `Received ${Hex.size(Hex.from(publicKey))} bytes.`,
      ],
    })
  }
}
