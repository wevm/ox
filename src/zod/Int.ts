/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import {
  decodeInteger,
  intBigint,
  intNumber,
  quantityHex,
  type SmallBits,
  uintBigint,
} from './internal/Integer.js'
import * as z from 'zod/mini'

/** Unsized integer decoded as `bigint` and encoded as hex. */
export const Int = z.codec(quantityHex(), uintBigint(), {
  decode: (value) => core_Hex.toBigInt(value),
  encode: (value) => core_Hex.fromNumber(value),
})

/** 8-bit signed integer decoded as `number` and encoded as hex. */
export const Int8 = signed(8)
/** 16-bit signed integer decoded as `number` and encoded as hex. */
export const Int16 = signed(16)
/** 24-bit signed integer decoded as `number` and encoded as hex. */
export const Int24 = signed(24)
/** 32-bit signed integer decoded as `number` and encoded as hex. */
export const Int32 = signed(32)
/** 40-bit signed integer decoded as `number` and encoded as hex. */
export const Int40 = signed(40)
/** 48-bit signed integer decoded as `number` and encoded as hex. */
export const Int48 = signed(48)
/** 56-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int56 = signedBigint(56)
/** 64-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int64 = signedBigint(64)
/** 72-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int72 = signedBigint(72)
/** 80-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int80 = signedBigint(80)
/** 88-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int88 = signedBigint(88)
/** 96-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int96 = signedBigint(96)
/** 104-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int104 = signedBigint(104)
/** 112-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int112 = signedBigint(112)
/** 120-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int120 = signedBigint(120)
/** 128-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int128 = signedBigint(128)
/** 136-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int136 = signedBigint(136)
/** 144-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int144 = signedBigint(144)
/** 152-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int152 = signedBigint(152)
/** 160-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int160 = signedBigint(160)
/** 168-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int168 = signedBigint(168)
/** 176-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int176 = signedBigint(176)
/** 184-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int184 = signedBigint(184)
/** 192-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int192 = signedBigint(192)
/** 200-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int200 = signedBigint(200)
/** 208-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int208 = signedBigint(208)
/** 216-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int216 = signedBigint(216)
/** 224-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int224 = signedBigint(224)
/** 232-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int232 = signedBigint(232)
/** 240-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int240 = signedBigint(240)
/** 248-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int248 = signedBigint(248)
/** 256-bit signed integer decoded as `bigint` and encoded as hex. */
export const Int256 = signedBigint(256)

function signed(bits: SmallBits) {
  return z.codec(quantityHex(bits), intNumber(bits), {
    decode: (value) => globalThis.Number(decodeInteger(value, bits, true)),
    encode: (value) =>
      core_Hex.fromNumber(value, { signed: true, size: bits / 8 }),
  })
}

function signedBigint(bits: number) {
  return z.codec(quantityHex(bits), intBigint(bits), {
    decode: (value) => decodeInteger(value, bits, true),
    encode: (value) =>
      core_Hex.fromNumber(value, { signed: true, size: bits / 8 }),
  })
}
