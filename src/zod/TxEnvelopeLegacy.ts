/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import {
  optionalChainIdFields,
  signedOptionalChainIdFields,
  strict,
  toRpc,
  type,
} from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const Type = type('0x0', 'legacy')

/** Legacy transaction envelope schema. */
export const TxEnvelopeLegacy = z.object(fields(strict.uint, strict.num))

/** Encode-only legacy transaction envelope schema accepting numberish `toRpc` inputs. */
export const TxEnvelopeLegacyToRpc = z.object(fields(toRpc.uint, toRpc.num))

/** Signed legacy transaction envelope schema. */
export const Signed = z.object(signedFields(strict.uint, strict.num))

/** Encode-only signed legacy transaction envelope schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = z.object(signedFields(toRpc.uint, toRpc.num))

function fields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...optionalChainIdFields(Type, uint, num),
    gasPrice: z.optional(uint),
  }
}

function signedFields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    ...signedOptionalChainIdFields(Type, uint, num),
    gasPrice: z.optional(uint),
  }
}
