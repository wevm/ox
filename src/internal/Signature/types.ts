import type { Hex } from '../Hex/types.js'
import type { Compute, RequiredBy } from '../types.js'

/** ECDSA signature. */
export type Signature<
  recovered extends boolean = true,
  bigintType = bigint,
  numberType = number,
> = Compute<
  RequiredBy<
    {
      r: bigintType
      s: bigintType
      yParity?: numberType | undefined
    },
    recovered extends true ? 'yParity' : never
  >
>

/** RPC-formatted ECDSA signature. */
export type Signature_Rpc<recovered extends boolean = true> = Signature<
  recovered,
  Hex,
  Hex
>

/** [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type Signature_Compact<bigintType = bigint> = {
  r: bigintType
  yParityAndS: bigintType
}

/** RPC-formatted [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type Signature_CompactRpc = Signature_Compact<Hex>

/** (Legacy) ECDSA signature. */
export type Signature_Legacy<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  v: numberType
}

/** RPC-formatted (Legacy) ECDSA signature. */
export type Signature_LegacyRpc = Signature_Legacy<Hex, Hex>

export type Signature_Tuple = readonly [yParity: Hex, r: Hex, s: Hex]
