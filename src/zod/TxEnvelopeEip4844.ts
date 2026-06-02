/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import {
  baseFields,
  signedBaseFields,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x3', 'eip4844')

/** EIP-4844 sidecars schema. */
export const Sidecars = z.object({
  blobs: z.readonly(z.array(z_Hex.Hex)),
  commitments: z.readonly(z.array(z_Hex.Hex)),
  cellProofs: z.readonly(z.array(z_Hex.Hex)),
})

/** EIP-4844 transaction envelope schema. */
export const TxEnvelopeEip4844 = z.object({
  ...baseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  maxFeePerBlobGas: z.optional(z_Uint.Uint),
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
  sidecars: z.optional(Sidecars),
})

/** Signed EIP-4844 transaction envelope schema. */
export const Signed = z.object({
  ...signedBaseFields(Type),
  accessList: z.optional(z_AccessList.AccessList),
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  maxFeePerBlobGas: z.optional(z_Uint.Uint),
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
  sidecars: z.optional(Sidecars),
})
