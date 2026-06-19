/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const yParityHex = z_Hex.Hex.check(
  z.refine(
    (value) => value === '0x0' || value === '0x1',
    'expected yParity hex',
  ),
)

/** Unsigned EIP-7702 authorization schema. */
export const Unsigned = z.object(unsignedFields(z_Number.Number, z_Uint.Uint))

/** Encode-only unsigned EIP-7702 authorization schema accepting numberish `toRpc` inputs. */
export const UnsignedToRpc = z.object(
  unsignedFields(z_Number.NumberToRpc, z_Uint.UintToRpc),
)

/** Signed EIP-7702 authorization schema. */
export const Signed = z.object(
  signedFields(z_Number.Number, z_Uint.Uint, yParityUint()),
)

/** Encode-only signed EIP-7702 authorization schema accepting numberish `toRpc` inputs. */
export const SignedToRpc = z.object(
  signedFields(z_Number.NumberToRpc, z_Uint.UintToRpc, yParityUintToRpc()),
)

/** EIP-7702 authorization schema. */
export const Authorization = z.union([Signed, Unsigned])

/** Encode-only EIP-7702 authorization schema accepting numberish `toRpc` inputs. */
export const AuthorizationToRpc = z.union([SignedToRpc, UnsignedToRpc])

/** EIP-7702 authorization list schema. */
export const List = z.readonly(z.array(Authorization))

/** Signed EIP-7702 authorization list schema. */
export const ListSigned = z.readonly(z.array(Signed))

/** Encode-only signed EIP-7702 authorization list schema accepting numberish `toRpc` inputs. */
export const ListSignedToRpc = z.readonly(z.array(SignedToRpc))

/** Unsigned EIP-7702 authorization tuple schema. */
export const TupleUnsigned = z.readonly(
  z.tuple([z_Hex.Hex, z_Address.Address, z_Hex.Hex]),
)

/** Signed EIP-7702 authorization tuple schema. */
export const TupleSigned = z.readonly(
  z.tuple([
    z_Hex.Hex,
    z_Address.Address,
    z_Hex.Hex,
    yParityHex,
    z_Hex.Hex32,
    z_Hex.Hex32,
  ]),
)

/** EIP-7702 authorization tuple schema. */
export const Tuple = z.union([TupleSigned, TupleUnsigned])

/** EIP-7702 authorization tuple list schema. */
export const TupleList = z.readonly(z.array(Tuple))

/** Signed EIP-7702 authorization tuple list schema. */
export const TupleListSigned = z.readonly(z.array(TupleSigned))

function yParityUint() {
  return z_Uint.Uint8.check(
    z.refine((value) => value === 0 || value === 1, 'expected yParity'),
  )
}

function yParityUintToRpc() {
  return z_Uint.Uint8ToRpc.check(
    z.refine(
      (value) =>
        value === 0 || value === 1 || value === '0x0' || value === '0x1',
      'expected yParity',
    ),
  )
}

function unsignedFields<num extends z.ZodMiniType, uint extends z.ZodMiniType>(
  num: num,
  uint: uint,
) {
  return {
    address: z_Address.Address,
    chainId: num,
    nonce: uint,
    r: z.optional(z.undefined()),
    s: z.optional(z.undefined()),
    yParity: z.optional(z.undefined()),
  }
}

function signedFields<
  num extends z.ZodMiniType,
  uint extends z.ZodMiniType,
  yParity extends z.ZodMiniType,
>(num: num, uint: uint, yParity: yParity) {
  return {
    address: z_Address.Address,
    chainId: num,
    nonce: uint,
    r: z_Hex.Hex32,
    s: z_Hex.Hex32,
    yParity,
  }
}
