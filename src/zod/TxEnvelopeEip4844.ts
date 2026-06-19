/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Hex from './Hex.js'
import {
  baseFields,
  signedBaseFields,
  strict,
  toRpc,
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
export const TxEnvelopeEip4844 = z.object(fields(strict.uint, strict.num))

/** Encode-only EIP-4844 transaction envelope schema accepting numberish `toRpc` inputs. */
export const TxEnvelopeEip4844ToRpc = z.object(fields(toRpc.uint, toRpc.num))

/** Signed EIP-4844 transaction envelope schema. */
export const Signed = z.object(signedFields(strict.uint, strict.num))

/** Encode-only signed EIP-4844 transaction envelope schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = z.object(signedFields(toRpc.uint, toRpc.num))

function fields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...baseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
    maxFeePerBlobGas: z.optional(uint),
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
    sidecars: z.optional(Sidecars),
  }
}

function signedFields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...signedBaseFields(Type, uint, num),
    accessList: z.optional(z_AccessList.AccessList),
    blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
    maxFeePerBlobGas: z.optional(uint),
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
    sidecars: z.optional(Sidecars),
  }
}
