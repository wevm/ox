/** [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type CompactSignature<bigintType = bigint> = {
  r: bigintType
  yParityAndS: bigintType
}

/** (Legacy) ECDSA signature. */
export type LegacySignature<bigintType = bigint> = {
  r: bigintType
  s: bigintType
  v: number
}

/** ECDSA signature. */
export type Signature<bigintType = bigint> = {
  r: bigintType
  s: bigintType
  yParity: 0 | 1
}
