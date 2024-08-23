import { secp256k1 } from '@noble/curves/secp256k1'

import type { GlobalErrorType } from '../errors/error.js'
import {
  InvalidSerializedSignatureSizeError,
  InvalidSignatureYParityError,
} from '../errors/signature.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'
import type { Compute } from '../types/utils.js'
import { compactSignatureToSignature } from './compactSignatureToSignature.js'
import { vToYParity } from './vToYParity.js'

/**
 * Deserializes a {@link Types#Bytes} or {@link Types#Hex} signature into a structured {@link Signature}.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * Signature.deserialize('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c')
 * // { r: 5231...n, s: 3522...n, yParity: 0 }
 * ```
 */
export function deserializeSignature(
  serialized: Bytes | Hex,
): deserializeSignature.ReturnType {
  const hex = typeof serialized === 'string' ? serialized : toHex(serialized)

  if (hex.length !== 130 && hex.length !== 132)
    throw new InvalidSerializedSignatureSizeError({ signature: hex })

  const { r, ...signature } = secp256k1.Signature.fromCompact(hex.slice(2, 130))

  const { s, yParity } = (() => {
    // If the signature is a compact signature, normalize it to a full signature.
    if (hex.length === 130)
      return compactSignatureToSignature({
        r,
        yParityAndS: signature.s,
      })

    let yParity = Number(`0x${hex.slice(130)}`)
    if (yParity !== 0 && yParity !== 1) {
      try {
        yParity = vToYParity(yParity)
      } catch {
        throw new InvalidSignatureYParityError({ value: yParity })
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
  } as deserializeSignature.ReturnType
}

export declare namespace deserializeSignature {
  type ReturnType = Compute<Signature>

  type ErrorType =
    | compactSignatureToSignature.ErrorType
    | toHex.ErrorType
    | InvalidSerializedSignatureSizeError
    | InvalidSignatureYParityError
    | GlobalErrorType
}

deserializeSignature.parseError = (error: unknown) =>
  error as deserializeSignature.ErrorType
