import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import {
  Signature_InvalidSerializedSizeError,
  Signature_InvalidYParityError,
} from './errors.js'
import type { Signature } from './types.js'
import { Signature_vToYParity } from './vToYParity.js'

/**
 * Deserializes a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} signature into a structured {@link ox#Signature.Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.deserialize('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c')
 * // @log: { r: 5231...n, s: 3522...n, yParity: 0 }
 * ```
 *
 * @param serialized - The serialized signature.
 * @returns The deserialized {@link ox#Signature.Signature}.
 */
export function Signature_deserialize<compact extends boolean = boolean>(
  serialized: Bytes | Hex,
  options: Signature_deserialize.Options<compact> = {},
): Signature<compact extends true ? false : true> {
  const { compact } = options

  const hex = typeof serialized === 'string' ? serialized : Hex_from(serialized)

  if (hex.length !== 130 && hex.length !== 132)
    throw new Signature_InvalidSerializedSizeError({ signature: hex })
  if (compact === true && hex.length !== 130)
    throw new Signature_InvalidSerializedSizeError({ signature: hex })
  if (compact === false && hex.length !== 132)
    throw new Signature_InvalidSerializedSizeError({ signature: hex })

  const { r, s } = secp256k1.Signature.fromCompact(hex.slice(2, 130))

  const yParity = (() => {
    const yParity = Number(`0x${hex.slice(130)}`)
    if (Number.isNaN(yParity)) return undefined
    try {
      return Signature_vToYParity(yParity)
    } catch {
      throw new Signature_InvalidYParityError({ value: yParity })
    }
  })()

  if (typeof yParity === 'undefined')
    return {
      r,
      s,
    } as never
  return {
    r,
    s,
    yParity,
  } as never
}

export declare namespace Signature_deserialize {
  type Options<compact extends boolean = boolean> = {
    /** Whether or not the signature being deserialized is compact. */
    compact?: compact | boolean | undefined
  }

  type ErrorType =
    | Hex_from.ErrorType
    | Signature_InvalidSerializedSizeError
    | GlobalErrorType
}

Signature_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_deserialize.ErrorType
