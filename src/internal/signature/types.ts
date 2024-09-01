import type { Hex } from '../hex/types.js'

/** ECDSA signature. */
export type Signature<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  yParity: numberType
}

/** [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type Signature_Compact<bigintType = bigint> = {
  r: bigintType
  yParityAndS: bigintType
}

/** (Legacy) ECDSA signature. */
export type Signature_Legacy<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  v: numberType
}

export type Signature_Tuple = readonly [yParity: Hex, r: Hex, s: Hex]
