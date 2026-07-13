/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_KeyAuthorization from '../../tempo/KeyAuthorization.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import {
  uintBigintNumberish,
  uintNumberNumberish,
} from '../internal/Integer.js'
import * as z from 'zod/mini'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

/** RPC token spending limit schema. */
export const RpcTokenLimit = z.object({
  limit: z_Hex.Hex,
  period: z.optional(z.nullable(z_Hex.Hex)),
  token: z_Address.Address,
})

/** RPC selector rule schema. */
export const RpcSelectorRule = z.object({
  recipients: z.optional(z.nullable(z.readonly(z.array(z_Address.Address)))),
  selector: z_Hex.Hex,
})

/** RPC call scope schema. */
export const RpcCallScope = z.object({
  selectorRules: z.optional(z.nullable(z.readonly(z.array(RpcSelectorRule)))),
  target: z_Address.Address,
})

/** RPC key authorization schema. */
export const Rpc = z.object({
  account: z.optional(z.nullable(z_Address.Address)),
  allowedCalls: z.optional(z.nullable(z.readonly(z.array(RpcCallScope)))),
  chainId: z_Hex.Hex,
  expiry: z.optional(z.nullable(z_Hex.Hex)),
  isAdmin: z.optional(z.nullable(z.boolean())),
  keyId: z_Address.Address,
  keyType: z_SignatureEnvelope.Type,
  limits: z.optional(z.nullable(z.readonly(z.array(RpcTokenLimit)))),
  signature: z_SignatureEnvelope.Rpc,
  witness: z.optional(z.nullable(z_Hex.Hex)),
})

/** Token spending limit schema. */
export const TokenLimit = z.object({
  limit: z.bigint(),
  period: z.optional(z.number()),
  token: z_Address.Address,
})

/** Encode-only token spending limit schema accepting numberish `toRpc` inputs. */
export const TokenLimitToRpc = z.object({
  limit: uintBigintNumberish(),
  period: z.optional(uintNumberNumberish()),
  token: z_Address.Address,
})

/** Call scope schema. */
export const Scope = z.object({
  address: z_Address.Address,
  recipients: z.optional(z.readonly(z.array(z_Address.Address))),
  selector: z.optional(z.union([z_Hex.Hex, z.string()])),
})

const domainShape = {
  address: z_Address.Address,
  chainId: z.bigint(),
  expiry: z.optional(z.number()),
  limits: z.optional(z.readonly(z.array(TokenLimit))),
  scopes: z.optional(z.readonly(z.array(Scope))),
  signature: z_SignatureEnvelope.Domain,
  type: z_SignatureEnvelope.Type,
  witness: z.optional(z_Hex.Hex),
}

/** Decoded key authorization schema (TIP-1049 admin fields are paired: both or neither). */
export const Domain = z.union([
  z.object({
    ...domainShape,
    account: z_Address.Address,
    isAdmin: z.boolean(),
  }),
  z.object(domainShape),
])

const domainToRpcShape = {
  ...domainShape,
  chainId: uintBigintNumberish(),
  expiry: z.optional(uintNumberNumberish()),
  limits: z.optional(z.readonly(z.array(TokenLimitToRpc))),
}

/** Encode-only decoded key authorization schema accepting numberish `toRpc` inputs. */
export const DomainToRpc = z.union([
  z.object({
    ...domainToRpcShape,
    account: z_Address.Address,
    isAdmin: z.boolean(),
  }),
  z.object(domainToRpcShape),
])

/** Codec decoding an RPC key authorization into a signed key authorization. */
export const KeyAuthorization = z.codec(Rpc, Domain, {
  decode: (value) => core_KeyAuthorization.fromRpc(value as never) as never,
  encode: (value) => core_KeyAuthorization.toRpc(value as never) as never,
})

/** Encode-only key authorization codec accepting numberish `toRpc` inputs. */
export const KeyAuthorizationToRpc = z.codec(Rpc, DomainToRpc, {
  decode: (value) => core_KeyAuthorization.fromRpc(value as never) as never,
  encode: (value) => core_KeyAuthorization.toRpc(value as never) as never,
})

/** Signed key authorization schema. */
export const Signed = KeyAuthorization

/** Encode-only signed key authorization schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = KeyAuthorizationToRpc
