import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import { PublicKey_assert } from './assert.js'
import type { PublicKey } from './types.js'

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
export function PublicKey_serialize<as extends 'Hex' | 'Bytes' = 'Hex'>(
  publicKey: PublicKey<boolean>,
  options: PublicKey_serialize.Options<as> = {},
): PublicKey_serialize.ReturnType<as> {
  PublicKey_assert(publicKey)

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

export declare namespace PublicKey_serialize {
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
    | (as extends 'Hex' ? Hex : never)
    | (as extends 'Bytes' ? Bytes : never)

  type ErrorType =
    | Hex.fromNumber.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

PublicKey_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as PublicKey_serialize.ErrorType
