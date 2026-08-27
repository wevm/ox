/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_MultisigOperation from '../../tempo/MultisigOperation.js'
import * as z_Address from '../Address.js'
import * as z_Hash from '../Hash.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_MultisigConfig from './MultisigConfig.js'

function baseFields() {
  return {
    account: z_Address.Address,
    approvals: z.readonly(z.array(z_Hex.Hex)),
    config: z_MultisigConfig.MultisigConfig,
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
    core_MultisigOperation.from(value as never)
    return true
  } catch {
    return false
  }
}, 'expected valid multisig operation')

/** Fields shared by every multisig operation schema. */
export const Base = z.object(baseFields())

/** Multisig transaction approval operation schema. */
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

/** Multisig key authorization approval operation schema. */
export const KeyAuthorizationOperation = z
  .object({
    ...baseFields(),
    keyAuthorization: z_Hex.Hex,
    status: z.union([z.literal('pending'), z.literal('success')]),
    type: z.literal('keyAuthorization'),
  })
  .check(valid)

/** Transaction or key authorization multisig operation schema. */
export const Operation = z.union([
  TransactionOperation,
  KeyAuthorizationOperation,
])
