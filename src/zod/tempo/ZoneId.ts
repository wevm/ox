/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_ZoneId from '../../tempo/ZoneId.js'
import * as z from 'zod/mini'

/** Zone id schema (non-negative integer). */
export const ZoneId = z
  .number()
  .check(
    z.refine(
      (value) => Number.isInteger(value) && value >= 0,
      'expected zone id',
    ),
  )

/** Codec decoding a zone chain id into a zone id. */
export const chainId = z.codec(z.number(), ZoneId, {
  decode: (value) => core_ZoneId.fromChainId(value),
  encode: (value) => core_ZoneId.toChainId(value),
})
