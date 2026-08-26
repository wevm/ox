/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_MultisigConfig from '../../tempo/MultisigConfig.js'
import * as core_MultisigWitness from '../../tempo/MultisigWitness.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_MultisigConfig from './MultisigConfig.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

const ConfigRpc = z
  .object({
    owners: z.readonly(z.array(z_MultisigConfig.Owner)),
    salt: z_Hex.Hex,
    threshold: z.number(),
    version: z.number(),
  })
  .check(
    z.refine(
      (value) => core_MultisigConfig.validate(value),
      'expected valid native multisig configuration',
    ),
  )

const NestedPrimitiveApproval = z.object({
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(z_SignatureEnvelope.Type),
  owner: z_Address.Address,
})

const PrimitiveApproval = z.object({
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(z_SignatureEnvelope.Type),
  owner: z_Address.Address,
  type: z.literal('primitive'),
})

const NestedWitness = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(NestedPrimitiveApproval)
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: z_MultisigConfig.Config,
})

const NestedWitnessRpc = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(NestedPrimitiveApproval)
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: ConfigRpc,
})

/** Native multisig simulation witness schema. */
export const Domain = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(
        z.union([
          PrimitiveApproval,
          z.object({
            type: z.literal('multisig'),
            witness: NestedWitness,
          }),
        ]),
      )
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: z_MultisigConfig.Config,
})

const Rpc_ = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(
        z.union([
          PrimitiveApproval,
          z.object({
            type: z.literal('multisig'),
            witness: NestedWitnessRpc,
          }),
        ]),
      )
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: ConfigRpc,
})

/** Codec decoding an RPC multisig witness into its domain representation. */
export const MultisigWitness = z.codec(Rpc_, Domain, {
  decode: (value) => core_MultisigWitness.fromRpc(value),
  encode: (value) => core_MultisigWitness.toRpc(value),
})

/** RPC native multisig simulation witness schema. */
export const Rpc = Rpc_
