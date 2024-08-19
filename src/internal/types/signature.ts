/** [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signature. */
export type CompactSignature = {
  r: bigint
  yParityAndS: bigint
}

/** (Legacy) ECDSA signature. */
export type LegacySignature = {
  r: bigint
  s: bigint
  v: number
}

/** ECDSA signature. */
export type Signature = {
  r: bigint
  s: bigint
  yParity: 0 | 1
}
