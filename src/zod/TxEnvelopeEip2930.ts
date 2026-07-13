/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import {
  baseFields,
  signedBaseFields,
  strict,
  toRpc,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x1', 'eip2930')

/** EIP-2930 transaction envelope schema. */
export const TxEnvelopeEip2930 = z.object(fields(strict.uint, strict.num))

/** Encode-only EIP-2930 transaction envelope schema accepting numberish `toRpc` inputs. */
export const TxEnvelopeEip2930ToRpc = z.object(fields(toRpc.uint, toRpc.num))

/** Signed EIP-2930 transaction envelope schema. */
export const Signed = z.object(signedFields(strict.uint, strict.num))

/** Encode-only signed EIP-2930 transaction envelope schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = z.object(signedFields(toRpc.uint, toRpc.num))

function fields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...baseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    gasPrice: z.optional(uint),
  }
}

function signedFields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...signedBaseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    gasPrice: z.optional(uint),
  }
}
