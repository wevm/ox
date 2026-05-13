import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute, ExactPartial } from './internal/types.js'
import * as Json from './Json.js'

/**
 * Canonical type for an ECDSA Public Key.
 *
 * A {@link ox#PublicKey.PublicKey} is a serialized {@link ox#Hex.Hex} SEC1
 * encoding:
 *
 * - Uncompressed (default): `0x04{x32}{y32}` -- 65 bytes.
 * - Compressed: `0x02{x32}` or `0x03{x32}` -- 33 bytes.
 *
 * Use {@link ox#PublicKey.toParts} / {@link ox#PublicKey.fromParts} to convert
 * between the canonical form and the structured {@link ox#PublicKey.Parts}.
 */
export type PublicKey<compressed extends boolean = false> =
  compressed extends true ? Hex.Hex : Hex.Hex

/** Structured parts of an ECDSA public key. */
export type Parts<compressed extends boolean = false> = Compute<
  compressed extends true
    ? {
        prefix: number
        x: bigint
        y?: undefined
      }
    : {
        prefix: number
        x: bigint
        y: bigint
      }
>

/**
 * Asserts that a {@link ox#PublicKey.Parts} object is a valid ECDSA public
 * key.
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
 * @param parts - The public key parts to assert.
 */
export function assert(
  parts: ExactPartial<Parts>,
  options: assert.Options = {},
): asserts parts is Parts {
  const { compressed } = options
  const { prefix, x, y } = parts

  // Explicit `compressed: false` -- require uncompressed shape.
  if (compressed === false) {
    if (typeof x !== 'bigint' || typeof y !== 'bigint')
      throw new InvalidError({ publicKey: parts })
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError(),
      })
    return
  }

  // Explicit `compressed: true` -- require compressed shape.
  if (compressed === true) {
    if (typeof x !== 'bigint' || typeof y !== 'undefined')
      throw new InvalidError({ publicKey: parts })
    if (prefix !== 3 && prefix !== 2)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidCompressedPrefixError(),
      })
    return
  }

  // No explicit `compressed` option -- infer from shape.

  // Uncompressed
  if (typeof x === 'bigint' && typeof y === 'bigint') {
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError(),
      })
    return
  }

  // Compressed
  if (typeof x === 'bigint' && typeof y === 'undefined') {
    if (prefix !== 3 && prefix !== 2)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidCompressedPrefixError(),
      })
    return
  }

  // Unknown/invalid
  throw new InvalidError({ publicKey: parts })
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
 * const publicKey = PublicKey.fromParts({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const compressed = PublicKey.compress(publicKey)
 * // @log: '0x038318535b...'
 * ```
 *
 * @param publicKey - The public key to compress.
 * @returns The compressed public key.
 */
export function compress(publicKey: PublicKey<false>): PublicKey<true> {
  const { x, y } = toParts(publicKey)
  return fromParts<true>({
    prefix: y % 2n === 0n ? 2 : 3,
    x,
  })
}

export declare namespace compress {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Deserializes a {@link ox#PublicKey.PublicKey} from a {@link ox#Bytes.Bytes} value.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.fromBytes(new Uint8Array([128, 3, 131, ...]))
 * // @log: '0x048318535b54105d4a7aae...'
 * ```
 *
 * @param publicKey - The serialized public key.
 * @returns The {@link ox#PublicKey.PublicKey}.
 */
export function fromBytes(publicKey: Bytes.Bytes): PublicKey {
  return fromHex(Hex.fromBytes(publicKey))
}

export declare namespace fromBytes {
  type ErrorType =
    | fromHex.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Normalizes a {@link ox#Hex.Hex} encoded public key to a canonical
 * {@link ox#PublicKey.PublicKey}.
 *
 * Accepts:
 *
 * - 33 bytes (compressed + prefix).
 * - 64 bytes (uncompressed, missing `0x04` prefix). The `0x04` prefix is
 *   prepended to the canonical form.
 * - 65 bytes (uncompressed + prefix).
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.fromHex('0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5')
 * // @log: '0x048318535b54105d4a7aae...'
 * ```
 *
 * @param publicKey - The serialized public key.
 * @returns The canonical {@link ox#PublicKey.PublicKey}.
 */
export function fromHex(publicKey: Hex.Hex): PublicKey {
  if (
    publicKey.length !== 132 &&
    publicKey.length !== 130 &&
    publicKey.length !== 68
  )
    throw new InvalidSerializedSizeError({ publicKey })

  // Missing prefix: prepend 0x04.
  if (publicKey.length === 130) return `0x04${publicKey.slice(2)}` as PublicKey

  const prefix = Number(Hex.slice(publicKey, 0, 1))
  if (publicKey.length === 132) {
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError(),
      })
    return publicKey as PublicKey
  }

  // Compressed (68 chars total -> 33 bytes).
  if (prefix !== 2 && prefix !== 3)
    throw new InvalidPrefixError({
      prefix,
      cause: new InvalidCompressedPrefixError(),
    })
  return publicKey as PublicKey
}

export declare namespace fromHex {
  type ErrorType =
    | assert.ErrorType
    | Hex.slice.ErrorType
    | InvalidSerializedSizeError
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#PublicKey.PublicKey} to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.fromParts({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const bytes = PublicKey.toBytes(publicKey)
 * // @log: Uint8Array [4, 131, 24, 83, ...]
 * ```
 *
 * @param publicKey - The public key to serialize.
 * @returns The serialized public key.
 */
export function toBytes(
  publicKey: PublicKey<boolean>,
  options: toBytes.Options = {},
): Bytes.Bytes {
  return Bytes.fromHex(toHex(publicKey, options))
}

export declare namespace toBytes {
  type Options = {
    /**
     * Whether to include the prefix in the serialized public key.
     * @default true
     */
    includePrefix?: boolean | undefined
  }

  type ErrorType =
    | Hex.fromNumber.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#PublicKey.PublicKey} to its structured
 * {@link ox#PublicKey.Parts} form.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const parts = PublicKey.toParts(
 *   '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
 * )
 * // @log: { prefix: 4, x: 59295...n, y: 24099...n }
 * ```
 *
 * @param publicKey - The public key to convert.
 * @returns The structured {@link ox#PublicKey.Parts}.
 */
export function toParts<compressed extends boolean = false>(
  publicKey: PublicKey<compressed>,
): Parts<compressed> {
  if (
    publicKey.length !== 132 &&
    publicKey.length !== 130 &&
    publicKey.length !== 68
  )
    throw new InvalidSerializedSizeError({ publicKey })

  if (publicKey.length === 130) {
    const x = BigInt(Hex.slice(publicKey, 0, 32))
    const y = BigInt(Hex.slice(publicKey, 32, 64))
    return { prefix: 4, x, y } as never
  }

  if (publicKey.length === 132) {
    const prefix = Number(Hex.slice(publicKey, 0, 1))
    const x = BigInt(Hex.slice(publicKey, 1, 33))
    const y = BigInt(Hex.slice(publicKey, 33, 65))
    return { prefix, x, y } as never
  }

  const prefix = Number(Hex.slice(publicKey, 0, 1))
  const x = BigInt(Hex.slice(publicKey, 1, 33))
  return { prefix, x } as never
}

export declare namespace toParts {
  type ErrorType =
    | InvalidSerializedSizeError
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts {@link ox#PublicKey.Parts} into a canonical
 * {@link ox#PublicKey.PublicKey}.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.fromParts({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 * // @log: '0x048318535b54105d4a7aae...'
 * ```
 *
 * @param parts - The structured parts to convert.
 * @returns The canonical {@link ox#PublicKey.PublicKey}.
 */
export function fromParts<compressed extends boolean = false>(
  parts: Parts<compressed>,
): PublicKey<compressed> {
  assert(parts)
  const { prefix, x, y } = parts
  return Hex.concat(
    Hex.fromNumber(prefix, { size: 1 }),
    Hex.fromNumber(x, { size: 32 }),
    typeof y === 'bigint' ? Hex.fromNumber(y, { size: 32 }) : '0x',
  ) as PublicKey<compressed>
}

export declare namespace fromParts {
  type ErrorType =
    | assert.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Identity helper: returns the {@link ox#PublicKey.PublicKey} as
 * {@link ox#Hex.Hex}. The prefix can optionally be omitted.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.fromParts({
 *   prefix: 4,
 *   x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 *   y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * })
 *
 * const hex = PublicKey.toHex(publicKey)
 * // @log: '0x048318535b54105d4a7aae...'
 * ```
 *
 * @param publicKey - The public key.
 * @param options - Options.
 * @returns The {@link ox#Hex.Hex} representation.
 */
export function toHex(
  publicKey: PublicKey<boolean>,
  options: toHex.Options = {},
): Hex.Hex {
  const { includePrefix = true } = options
  if (includePrefix) return publicKey
  return `0x${publicKey.slice(4)}` as Hex.Hex
}

export declare namespace toHex {
  type Options = {
    /**
     * Whether to include the prefix in the serialized public key.
     * @default true
     */
    includePrefix?: boolean | undefined
  }

  type ErrorType = Hex.fromNumber.ErrorType | Errors.GlobalErrorType
}

/**
 * Validates a {@link ox#PublicKey.Parts} object. Returns `true` if valid,
 * `false` otherwise.
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
 * @param parts - The public key parts to validate.
 */
export function validate(
  parts: ExactPartial<Parts>,
  options: validate.Options = {},
): boolean {
  try {
    assert(parts, options)
    return true
  } catch (_error) {
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
