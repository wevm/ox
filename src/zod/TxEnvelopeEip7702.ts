/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Authorization from './Authorization.js'
import * as z_Uint from './Uint.js'
import {
  baseFields,
  signedBaseFields,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x4', 'eip7702')

/** EIP-7702 transaction envelope schema. */
export const TxEnvelopeEip7702 = z.object({
  ...baseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z_Authorization.ListSigned,
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
})

/** Signed EIP-7702 transaction envelope schema. */
export const Signed = z.object({
  ...signedBaseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z_Authorization.ListSigned,
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
})
