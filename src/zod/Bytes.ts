/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

/** Byte array schema encoded as hex. */
export const Bytes = z.codec(bytesHex(), bytesRaw(), {
  decode: decodeHex,
  encode: encodeHex,
})

/** Returns a byte-sized byte array schema encoded as hex. */
export function sizedBytes(size: number) {
  return z.codec(z_Hex.sizedHex(size), bytesRaw(size), {
    decode: decodeHex,
    encode: encodeHex,
  })
}

/** 32-byte byte array schema encoded as hex. */
export const Bytes32 = sizedBytes(32)

function bytesRaw(size?: number) {
  return z
    .custom<Uint8Array>(
      (value) => value instanceof Uint8Array,
      'expected bytes',
    )
    .check(
      z.refine(
        (value) => size === undefined || value.length === size,
        size === undefined ? 'expected bytes' : `expected ${size} bytes`,
      ),
    )
}

function bytesHex() {
  return z_Hex.Hex.check(
    z.refine(
      (value) => value.length % 2 === 0,
      'expected even-length bytes hex',
    ),
  )
}

function decodeHex(value: z.output<typeof z_Hex.Hex>) {
  const bytes = new Uint8Array((value.length - 2) / 2)
  for (let index = 0; index < bytes.length; index++)
    bytes[index] = Number.parseInt(
      value.slice(2 + index * 2, 4 + index * 2),
      16,
    )
  return bytes
}

function encodeHex(value: Uint8Array) {
  let hex = '0x'
  for (const byte of value) hex += byte.toString(16).padStart(2, '0')
  return hex as z.output<typeof z_Hex.Hex>
}
