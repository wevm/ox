/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Uint from './Uint.js'
import {
  baseFields,
  signedBaseFields,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x2', 'eip1559')

/** EIP-1559 transaction envelope schema. */
export const TxEnvelopeEip1559 = z.object({
  ...baseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
})

/** Signed EIP-1559 transaction envelope schema. */
export const Signed = z.object({
  ...signedBaseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
})
