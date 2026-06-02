/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_TokenId from '../../tempo/TokenId.js'
import * as z_Address from '../Address.js'
import * as z from 'zod/mini'

/** TIP-20 token id schema (non-negative bigint). */
export const TokenId = z
  .bigint()
  .check(z.refine((value) => value >= 0n, 'expected token id'))

/** Codec decoding a TIP-20 token address into a token id. */
export const address = z.codec(z_Address.Address, TokenId, {
  decode: (value) => core_TokenId.fromAddress(value),
  encode: (value) => core_TokenId.toAddress(value),
})
