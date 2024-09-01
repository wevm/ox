import type { Hex } from '../hex/types.js'

/** ECDSA signature. */
export type Signature<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  yParity: numberType
}

/** RPC-formatted ECDSA signature. */
export type Signature_Rpc = Signature<Hex, Hex>

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
