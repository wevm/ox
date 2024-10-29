import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import type { Bytes } from '../Bytes/types.js'
import {
  Signature_InvalidSerializedSizeError,
  Signature_InvalidYParityError,
} from './errors.js'
import type { Signature } from './types.js'
import { Signature_vToYParity } from './vToYParity.js'

/**
 * Deserializes a {@link ox#Bytes.Bytes} or {@link ox#(Hex:type)} signature into a structured {@link ox#Signature.Signature}.
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
  const hex = Hex.from(serialized)

  if (hex.length !== 130 && hex.length !== 132)
    throw new Signature_InvalidSerializedSizeError({ signature: hex })

  const r = BigInt(Hex.slice(hex, 0, 32))
  const s = BigInt(Hex.slice(hex, 32, 64))

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
  type ErrorType =
    | Hex.from.ErrorType
    | Signature_InvalidSerializedSizeError
    | Errors.GlobalErrorType
}

Signature_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_deserialize.ErrorType
