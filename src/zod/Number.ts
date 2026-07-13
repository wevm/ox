/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import {
  encodeNumberish,
  quantityHex,
  uintNumber,
  uintNumberNumberish,
} from './internal/Integer.js'
import * as z from 'zod/mini'

/** Hex quantity decoded as `number` and encoded as hex. */
export const Number = z.codec(quantityHex(), uintNumber(), {
  decode: (value) => core_Hex.toNumber(value),
  encode: (value) => core_Hex.fromNumber(value),
})

/** Encode-only hex quantity accepting `Hex | number`. */
export const NumberToRpc = z.codec(quantityHex(), uintNumberNumberish(), {
  decode: (value) => core_Hex.toNumber(value),
  encode: (value) => encodeNumberish(value),
})
