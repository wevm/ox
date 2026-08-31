/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_MultisigConfig from '../../tempo/MultisigConfig.js'
import * as core_MultisigSimulation from '../../tempo/MultisigSimulation.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_MultisigConfig from './MultisigConfig.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

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

const NestedSpec = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(NestedPrimitiveApproval)
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: z_MultisigConfig.Config,
})

const NestedSpecRpc = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(NestedPrimitiveApproval)
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: z_Hex.Hex,
})

/** Native multisig simulation spec schema. */
export const Domain = z.object({
  account: z_Address.Address,
  approvals: z.readonly(
    z
      .array(
        z.union([
          PrimitiveApproval,
          z.object({
            spec: NestedSpec,
            type: z.literal('multisig'),
          }),
        ]),
      )
      .check(z.maxLength(core_MultisigConfig.maxSignatures)),
  ),
  config: z_MultisigConfig.Config,
})

const Rpc_ = z
  .object({
    account: z_Address.Address,
    approvals: z.readonly(
      z
        .array(
          z.union([
            PrimitiveApproval,
            z.object({
              spec: NestedSpecRpc,
              type: z.literal('multisig'),
            }),
          ]),
        )
        .check(z.maxLength(core_MultisigConfig.maxSignatures)),
    ),
    config: z_Hex.Hex,
  })
  .check(
    z.refine((value) => {
      try {
        core_MultisigSimulation.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'expected valid native multisig simulation spec'),
  )

/** Codec decoding an RPC multisig simulation spec into its domain representation. */
export const MultisigSimulation = z.codec(Rpc_, Domain, {
  decode: (value) => core_MultisigSimulation.fromRpc(value),
  encode: (value) => core_MultisigSimulation.toRpc(value),
})

/** RPC native multisig simulation spec schema. */
export const Rpc = Rpc_
