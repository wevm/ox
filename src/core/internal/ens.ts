import { Bytes } from '../../index.js'
import * as Ens from '../Ens.js'
import type * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'

/**
 * @internal
 * Encodes a [DNS packet](https://docs.ens.domains/resolution/names#dns) into a ByteArray containing a UDP payload.
 */
export function packetToBytes(packet: string): Bytes.Bytes {
  // strip leading and trailing `.`
  const value = packet.replace(/^\.|\.$/gm, '')
  if (value.length === 0) return new Uint8Array(1)

  // Pre-encode each label so we can size the output buffer exactly.
  // Labels longer than 255 bytes are replaced with their wrapped labelhash
  // form, so the final size is not directly derivable from the input string
  // length when oversized labels are present.
  const list = value.split('.')
  const encoded: Uint8Array[] = new Array(list.length)
  let total = 1 // trailing zero terminator
  for (let i = 0; i < list.length; i++) {
    let bytes = Bytes.fromString(list[i]!)
    if (bytes.byteLength > 255)
      bytes = Bytes.fromString(wrapLabelhash(Ens.labelhash(list[i]!)))
    encoded[i] = bytes
    total += bytes.length + 1
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (let i = 0; i < encoded.length; i++) {
    const bytes = encoded[i]!
    out[offset] = bytes.length
    out.set(bytes, offset + 1)
    offset += bytes.length + 1
  }
  return out
}

export declare namespace packetToBytes {
  type ErrorType =
    | wrapLabelhash.ErrorType
    | Ens.labelhash.ErrorType
    | Bytes.fromString.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function wrapLabelhash(hash: Hex.Hex): `[${string}]` {
  return `[${hash.slice(2)}]`
}

export declare namespace wrapLabelhash {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export function unwrapLabelhash(label: string): Hex.Hex | null {
  if (label.length !== 66) return null
  if (label.indexOf('[') !== 0) return null
  if (label.indexOf(']') !== 65) return null
  const hash = `0x${label.slice(1, 65)}`
  if (!Hex.validate(hash, { strict: true })) return null
  return hash
}

export declare namespace unwrapLabelhash {
  type ErrorType = Hex.validate.ErrorType | Errors.GlobalErrorType
}
