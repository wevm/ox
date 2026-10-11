/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_AccountConfig from '../../tempo/AccountConfig.js'
import * as core_AccountSimulation from '../../tempo/AccountSimulation.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_AccountConfig from './AccountConfig.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

const PrimitiveApproval = z.strictObject({
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(z_SignatureEnvelope.Type),
  owner: z_Address.Address,
})

/** Account simulation spec schema. */
export const Domain = z.object({
  approvals: z.readonly(
    z
      .array(PrimitiveApproval)
      .check(z.maxLength(core_AccountConfig.maxSignatures)),
  ),
  config: z_AccountConfig.Config,
})

const Rpc_ = z
  .object({
    approvals: z.readonly(
      z
        .array(PrimitiveApproval)
        .check(z.maxLength(core_AccountConfig.maxSignatures)),
    ),
    config: z_Hex.Hex,
  })
  .check(
    z.refine((value) => {
      try {
        core_AccountSimulation.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'expected valid account simulation spec'),
  )

/** Codec decoding an RPC account simulation spec into its domain representation. */
export const AccountSimulation = z.codec(Rpc_, Domain, {
  decode: (value) => core_AccountSimulation.fromRpc(value),
  encode: (value) => core_AccountSimulation.toRpc(value),
})

/** RPC account simulation spec schema. */
export const Rpc = Rpc_
