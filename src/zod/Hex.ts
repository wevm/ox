/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import * as z from 'zod/mini'

/** Hex string schema. */
export const Hex = z
  .templateLiteral([z.literal('0x'), z.string()])
  .check(z.refine((value) => /^0x[0-9a-fA-F]*$/.test(value), 'expected hex'))

/** Returns a byte-sized hex string schema. */
export function sizedHex(size: number) {
  return Hex.check(
    z.refine(
      (value) => core_Hex.size(value) === size,
      `expected ${size} bytes`,
    ),
  )
}

/** 4-byte hex string schema. */
export const Hex4 = sizedHex(4)
/** 8-byte hex string schema. */
export const Hex8 = sizedHex(8)
/** 12-byte hex string schema. */
export const Hex12 = sizedHex(12)
/** 16-byte hex string schema. */
export const Hex16 = sizedHex(16)
/** 20-byte hex string schema. */
export const Hex20 = sizedHex(20)
/** 24-byte hex string schema. */
export const Hex24 = sizedHex(24)
/** 32-byte hex string schema. */
export const Hex32 = sizedHex(32)
/** 40-byte hex string schema. */
export const Hex40 = sizedHex(40)
/** 48-byte hex string schema. */
export const Hex48 = sizedHex(48)
/** 56-byte hex string schema. */
export const Hex56 = sizedHex(56)
/** 64-byte hex string schema. */
export const Hex64 = sizedHex(64)
/** 72-byte hex string schema. */
export const Hex72 = sizedHex(72)
/** 80-byte hex string schema. */
export const Hex80 = sizedHex(80)
/** 88-byte hex string schema. */
export const Hex88 = sizedHex(88)
/** 96-byte hex string schema. */
export const Hex96 = sizedHex(96)
/** 104-byte hex string schema. */
export const Hex104 = sizedHex(104)
/** 112-byte hex string schema. */
export const Hex112 = sizedHex(112)
/** 120-byte hex string schema. */
export const Hex120 = sizedHex(120)
/** 128-byte hex string schema. */
export const Hex128 = sizedHex(128)
/** 136-byte hex string schema. */
export const Hex136 = sizedHex(136)
/** 144-byte hex string schema. */
export const Hex144 = sizedHex(144)
/** 152-byte hex string schema. */
export const Hex152 = sizedHex(152)
/** 160-byte hex string schema. */
export const Hex160 = sizedHex(160)
/** 168-byte hex string schema. */
export const Hex168 = sizedHex(168)
/** 176-byte hex string schema. */
export const Hex176 = sizedHex(176)
/** 184-byte hex string schema. */
export const Hex184 = sizedHex(184)
/** 192-byte hex string schema. */
export const Hex192 = sizedHex(192)
/** 200-byte hex string schema. */
export const Hex200 = sizedHex(200)
/** 208-byte hex string schema. */
export const Hex208 = sizedHex(208)
/** 216-byte hex string schema. */
export const Hex216 = sizedHex(216)
/** 224-byte hex string schema. */
export const Hex224 = sizedHex(224)
/** 232-byte hex string schema. */
export const Hex232 = sizedHex(232)
/** 240-byte hex string schema. */
export const Hex240 = sizedHex(240)
/** 248-byte hex string schema. */
export const Hex248 = sizedHex(248)
/** 256-byte hex string schema. */
export const Hex256 = sizedHex(256)
