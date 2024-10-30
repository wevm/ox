import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { Compute } from '../types.js'
import { PublicKey_assert } from './assert.js'
import { PublicKey_deserialize } from './deserialize.js'
import type { PublicKey } from './types.js'

/** @internal */
export type CompressedPublicKey = PublicKey<true>

/** @internal */
export type UncompressedPublicKey = Omit<PublicKey<false>, 'prefix'> & {
  prefix?: PublicKey['prefix'] | undefined
}

/**
 * Instantiates a typed {@link ox#PublicKey.PublicKey} object from a {@link ox#PublicKey.PublicKey}, {@link ox#Bytes.Bytes}, or {@link ox#Hex.Hex}.
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
export function PublicKey_from<
  const publicKey extends
    | CompressedPublicKey
    | UncompressedPublicKey
    | Hex.Hex
    | Bytes.Bytes,
>(
  value: PublicKey_from.Value<publicKey>,
): PublicKey_from.ReturnType<publicKey> {
  const publicKey = (() => {
    if (Hex.validate(value)) return PublicKey_deserialize(value)
    if (Bytes.validate(value)) return PublicKey_deserialize(value)

    const { prefix, x, y } = value
    if (typeof x === 'bigint' && typeof y === 'bigint')
      return { prefix: prefix ?? 0x04, x, y }
    return { prefix, x }
  })()

  PublicKey_assert(publicKey)

  return publicKey as never
}

export declare namespace PublicKey_from {
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

  type ErrorType = PublicKey_assert.ErrorType | Errors.GlobalErrorType
}

PublicKey_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as PublicKey_from.ErrorType
