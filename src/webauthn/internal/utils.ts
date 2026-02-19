import * as Base64 from '../../core/Base64.js'
import type * as Types from '../Types.js'

/** @internal */
export const base64UrlOptions = { url: true, pad: false } as const

/** @internal */
export const responseKeys = [
  'attestationObject',
  'authenticatorData',
  'clientDataJSON',
  'signature',
  'userHandle',
] as const

/** @internal */
export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

/** @internal */
export function bufferSourceToBytes(source: Types.BufferSource): Uint8Array {
  if (source instanceof Uint8Array) return source
  if (source instanceof ArrayBuffer) return new Uint8Array(source)
  return new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
}

/** @internal */
export function serializeExtensions(
  extensions: Types.AuthenticationExtensionsClientInputs,
): Types.AuthenticationExtensionsClientInputs<true> {
  const { prf, ...rest } = extensions
  return {
    ...rest,
    ...(prf && {
      prf: {
        eval: {
          first: Base64.fromBytes(prf.eval.first, base64UrlOptions),
        },
      },
    }),
  }
}

/** @internal */
export function deserializeExtensions(
  extensions: Types.AuthenticationExtensionsClientInputs<true>,
): Types.AuthenticationExtensionsClientInputs {
  const { prf, ...rest } = extensions
  return {
    ...rest,
    ...(prf && {
      prf: {
        eval: {
          first: Base64.toBytes(prf.eval.first),
        },
      },
    }),
  }
}
