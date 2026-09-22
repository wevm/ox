/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as Hex from '../../core/Hex.js'
import * as Quantity from '../../core/internal/quantity.js'
import { quantityHex, uintBigint, uintNumber } from './Integer.js'
import * as z from 'zod/mini'

export const chainId = z.codec(
  quantityHex(),
  z.union([uintNumber(), uintBigint()]),
  {
    decode(value) {
      const id = Hex.toBigInt(value)
      return id <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(id) : id
    },
    encode: (value) => Hex.fromNumber(value),
  },
)

export const chainIdToRpc = z.codec(
  quantityHex(),
  z.union([quantityHex(), uintNumber(), uintBigint()]),
  {
    decode: (value) => z.decode(chainId, value),
    encode: (value) => Quantity.fromNumberish(value),
  },
)
