/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** RPC storage proof schema decoded to a storage proof. */
export const StorageProof = z.object(storageProofFields(z_Uint.Uint))

/** Encode-only storage proof schema accepting numberish `toRpc` inputs. */
export const StorageProofToRpc = z.object(storageProofFields(z_Uint.UintToRpc))

/** RPC account proof schema decoded to an account proof. */
export const AccountProof = z.object(
  accountProofFields(z_Uint.Uint, z_Number.Number, StorageProof),
)

/** Encode-only account proof schema accepting numberish `toRpc` inputs. */
export const AccountProofToRpc = z.object(
  accountProofFields(z_Uint.UintToRpc, z_Number.NumberToRpc, StorageProofToRpc),
)

function storageProofFields<uint extends z.ZodMiniType>(uint: uint) {
  return {
    key: z_Hex.Hex,
    proof: z.readonly(z.array(z_Hex.Hex)),
    value: uint,
  }
}

function accountProofFields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  storageProof extends z.ZodMiniType,
>(uint: uint, num: num, storageProof: storageProof) {
  return {
    address: z_Address.Address,
    balance: uint,
    codeHash: z_Hex.Hex,
    nonce: num,
    storageHash: z_Hex.Hex,
    accountProof: z.readonly(z.array(z_Hex.Hex)),
    storageProof: z.readonly(z.array(storageProof)),
  }
}
