/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Uint from './Uint.js'
import {
  optionalChainIdFields,
  signedOptionalChainIdFields,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x0', 'legacy')

/** Legacy transaction envelope schema. */
export const TxEnvelopeLegacy = z.object({
  ...optionalChainIdFields(Type),
  gasPrice: z.optional(z_Uint.Uint),
})

/** Signed legacy transaction envelope schema. */
export const Signed = z.object({
  ...signedOptionalChainIdFields(Type),
  gasPrice: z.optional(z_Uint.Uint),
})
