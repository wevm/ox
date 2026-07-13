/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Authorization from './Authorization.js'
import {
  baseFields,
  signedBaseFields,
  strict,
  toRpc,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x4', 'eip7702')

/** EIP-7702 transaction envelope schema. */
export const TxEnvelopeEip7702 = z.object(
  fields(strict.uint, strict.num, z_Authorization.ListSigned),
)

/** Encode-only EIP-7702 transaction envelope schema accepting numberish `toRpc` inputs. */
export const TxEnvelopeEip7702ToRpc = z.object(
  fields(toRpc.uint, toRpc.num, z_Authorization.ListSignedToRpc),
)

/** Signed EIP-7702 transaction envelope schema. */
export const Signed = z.object(
  signedFields(strict.uint, strict.num, z_Authorization.ListSigned),
)

/** Encode-only signed EIP-7702 transaction envelope schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = z.object(
  signedFields(toRpc.uint, toRpc.num, z_Authorization.ListSignedToRpc),
)

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  authorizationList extends z.ZodMiniType,
>(uint: uint, num: num, authorizationList: authorizationList) {
  return {
    ...baseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    authorizationList,
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
  }
}

function signedFields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  authorizationList extends z.ZodMiniType,
>(uint: uint, num: num, authorizationList: authorizationList) {
  return {
    ...signedBaseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    authorizationList,
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
  }
}
