import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import {
  Signature_InvalidSerializedSizeError,
  Signature_InvalidYParityError,
} from './errors.js'
import { Signature_fromCompact } from './fromCompact.js'
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
export function Signature_deserialize(serialized: Bytes | Hex): Signature {
  const hex = typeof serialized === 'string' ? serialized : Hex_from(serialized)

  if (hex.length !== 130 && hex.length !== 132)
    throw new Signature_InvalidSerializedSizeError({ signature: hex })

  const { r, ...signature } = secp256k1.Signature.fromCompact(hex.slice(2, 130))

  const { s, yParity } = (() => {
    // If the signature is a compact signature, normalize it to a full signature.
    if (hex.length === 130)
      return Signature_fromCompact({
        r,
        yParityAndS: signature.s,
      })

    let yParity = Number(`0x${hex.slice(130)}`)
    if (yParity !== 0 && yParity !== 1) {
      try {
        yParity = Signature_vToYParity(yParity)
      } catch {
        throw new Signature_InvalidYParityError({ value: yParity })
      }
    }
    return {
      s: signature.s,
      yParity,
    }
  })()

  return {
    r,
    s,
    yParity,
  } as Signature
}

export declare namespace Signature_deserialize {
  type ErrorType =
    | Signature_fromCompact.ErrorType
    | Hex_from.ErrorType
    | Signature_InvalidSerializedSizeError
    | Signature_InvalidYParityError
    | GlobalErrorType
}

Signature_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_deserialize.ErrorType
