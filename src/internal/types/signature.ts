import type { Hex } from './data.js'

/** ECDSA signature. */
export type Signature<bigintType = bigint> = {
  r: bigintType
  s: bigintType
  yParity: 0 | 1
}

/** [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type Signature_Compact<bigintType = bigint> = {
  r: bigintType
  yParityAndS: bigintType
}

/** (Legacy) ECDSA signature. */
export type Signature_Legacy<bigintType = bigint> = {
  r: bigintType
  s: bigintType
  v: number
}

export type Signature_Tuple = readonly [yParity: Hex, r: Hex, s: Hex]
