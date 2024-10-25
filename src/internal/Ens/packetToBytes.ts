import type * as Errors from '../../Errors.js'
// Adapted from https://github.com/mafintosh/dns-packet
import { fromString } from '../Bytes/fromString.js'
import type { Bytes } from '../Bytes/types.js'
import { encodeLabelhash } from './encodeLabelhash.js'
import { Ens_labelhash } from './labelhash.js'

/**
 * @internal
 * Encodes a [DNS packet](https://docs.ens.domains/resolution/names#dns) into a ByteArray containing a UDP payload.
 */
export function Ens_packetToBytes(packet: string): Bytes {
  // strip leading and trailing `.`
  const value = packet.replace(/^\.|\.$/gm, '')
  if (value.length === 0) return new Uint8Array(1)

  const bytes = new Uint8Array(fromString(value).byteLength + 2)

  let offset = 0
  const list = value.split('.')
  for (let i = 0; i < list.length; i++) {
    let encoded = fromString(list[i]!)
    // if the length is > 255, make the encoded label value a labelhash
    // this is compatible with the universal resolver
    if (encoded.byteLength > 255)
      encoded = fromString(encodeLabelhash(Ens_labelhash(list[i]!)))
    bytes[offset] = encoded.length
    bytes.set(encoded, offset + 1)
    offset += encoded.length + 1
  }

  if (bytes.byteLength !== offset + 1) return bytes.slice(0, offset + 1)

  return bytes
}

export declare namespace Ens_packetToBytes {
  type ErrorType =
    | Ens_labelhash.ErrorType
    | fromString.ErrorType
    | Errors.GlobalErrorType
}
