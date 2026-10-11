/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_AccountOperation from '../../tempo/AccountOperation.js'
import * as z_Address from '../Address.js'
import * as z_Hash from '../Hash.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_AccountConfig from './AccountConfig.js'

function baseFields() {
  return {
    account: z_Address.Address,
    approvals: z.readonly(z.array(z_Hex.Hex)),
    config: z_AccountConfig.AccountConfig,
    createdAt: z.number(),
    hash: z_Hash.Hash,
    signatureCount: z.number(),
    threshold: z.number(),
    updatedAt: z.number(),
    weight: z.number(),
  }
}

const valid = z.refine((value) => {
  try {
    core_AccountOperation.from(value as never)
    return true
  } catch {
    return false
  }
}, 'expected valid account operation')

/** Fields shared by every account operation schema. */
export const Base = z.object(baseFields())

/** Account transaction approval operation schema. */
export const TransactionOperation = z
  .object({
    ...baseFields(),
    expiresAt: z.optional(z.number()),
    status: z.union([
      z.literal('pending'),
      z.literal('submitting'),
      z.literal('success'),
    ]),
    submissionId: z.optional(z_Hash.Hash),
    transaction: z_Hex.Hex,
    transactionHash: z.optional(z_Hash.Hash),
    type: z.literal('transaction'),
  })
  .check(valid)

/** Account key authorization approval operation schema. */
export const KeyAuthorizationOperation = z
  .object({
    ...baseFields(),
    keyAuthorization: z_Hex.Hex,
    status: z.union([z.literal('pending'), z.literal('success')]),
    type: z.literal('keyAuthorization'),
  })
  .check(valid)

/** Transaction or key authorization account operation schema. */
export const Operation = z.union([
  TransactionOperation,
  KeyAuthorizationOperation,
])
