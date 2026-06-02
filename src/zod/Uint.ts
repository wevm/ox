/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import {
  decodeInteger,
  quantityHex,
  type SmallBits,
  uintBigint,
  uintNumber,
} from './internal/Integer.js'
import * as z from 'zod/mini'

/** Unsized unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint = z.codec(quantityHex(), uintBigint(), {
  decode: (value) => core_Hex.toBigInt(value),
  encode: (value) => core_Hex.fromNumber(value),
})

/** 8-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint8 = unsigned(8)
/** 16-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint16 = unsigned(16)
/** 24-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint24 = unsigned(24)
/** 32-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint32 = unsigned(32)
/** 40-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint40 = unsigned(40)
/** 48-bit unsigned integer decoded as `number` and encoded as hex. */
export const Uint48 = unsigned(48)
/** 56-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint56 = unsignedBigint(56)
/** 64-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint64 = unsignedBigint(64)
/** 72-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint72 = unsignedBigint(72)
/** 80-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint80 = unsignedBigint(80)
/** 88-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint88 = unsignedBigint(88)
/** 96-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint96 = unsignedBigint(96)
/** 104-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint104 = unsignedBigint(104)
/** 112-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint112 = unsignedBigint(112)
/** 120-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint120 = unsignedBigint(120)
/** 128-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint128 = unsignedBigint(128)
/** 136-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint136 = unsignedBigint(136)
/** 144-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint144 = unsignedBigint(144)
/** 152-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint152 = unsignedBigint(152)
/** 160-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint160 = unsignedBigint(160)
/** 168-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint168 = unsignedBigint(168)
/** 176-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint176 = unsignedBigint(176)
/** 184-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint184 = unsignedBigint(184)
/** 192-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint192 = unsignedBigint(192)
/** 200-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint200 = unsignedBigint(200)
/** 208-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint208 = unsignedBigint(208)
/** 216-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint216 = unsignedBigint(216)
/** 224-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint224 = unsignedBigint(224)
/** 232-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint232 = unsignedBigint(232)
/** 240-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint240 = unsignedBigint(240)
/** 248-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint248 = unsignedBigint(248)
/** 256-bit unsigned integer decoded as `bigint` and encoded as hex. */
export const Uint256 = unsignedBigint(256)

function unsigned(bits: SmallBits) {
  return z.codec(quantityHex(bits), uintNumber(bits), {
    decode: (value) => globalThis.Number(decodeInteger(value, bits, false)),
    encode: (value) => core_Hex.fromNumber(value),
  })
}

function unsignedBigint(bits: number) {
  return z.codec(quantityHex(bits), uintBigint(bits), {
    decode: (value) => decodeInteger(value, bits, false),
    encode: (value) => core_Hex.fromNumber(value),
  })
}
