/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import { quantityHex, uintBigint } from './internal/Integer.js'
import * as z from 'zod/mini'

/** Hex quantity decoded as `bigint` and encoded as hex. */
export const BigInt = z.codec(quantityHex(), uintBigint(), {
  decode: (value) => core_Hex.toBigInt(value),
  encode: (value) => core_Hex.fromNumber(value),
})
