import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import { PublicKey_InvalidSerializedSizeError } from './errors.js'
import type { PublicKey } from './types.js'

/**
 * Deserializes a {@link ox#PublicKey.PublicKey} from a {@link ox#Hex.Hex} or {@link ox#Bytes.Bytes} value.
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
export function PublicKey_deserialize(publicKey: Bytes | Hex): PublicKey {
  const hex = typeof publicKey === 'string' ? publicKey : Hex_from(publicKey)

  if (hex.length !== 132 && hex.length !== 130 && hex.length !== 68)
    throw new PublicKey_InvalidSerializedSizeError({ publicKey })

  if (hex.length === 130) {
    const x = BigInt(Hex_slice(hex, 0, 32))
    const y = BigInt(Hex_slice(hex, 32, 64))
    return {
      prefix: 4,
      x,
      y,
    } as never
  }

  if (hex.length === 132) {
    const prefix = Number(Hex_slice(hex, 0, 1))
    const x = BigInt(Hex_slice(hex, 1, 33))
    const y = BigInt(Hex_slice(hex, 33, 65))
    return {
      prefix,
      x,
      y,
    } as never
  }

  const prefix = Number(Hex_slice(hex, 0, 1))
  const x = BigInt(Hex_slice(hex, 1, 33))
  return {
    prefix,
    x,
  } as never
}

export declare namespace PublicKey_deserialize {
  type ErrorType = Hex_from.ErrorType | GlobalErrorType
}

PublicKey_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as PublicKey_deserialize.ErrorType
