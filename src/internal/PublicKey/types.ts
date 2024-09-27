import type { Compute } from '../types.js'

/** Root type for a ECDSA Public Key. */
export type PublicKey<
  compressed extends boolean = false,
  bigintType = bigint,
  numberType = number,
> = Compute<
  compressed extends true
    ? {
        prefix: numberType
        x: bigintType
        y?: undefined
      }
    : {
        prefix: numberType
        x: bigintType
        y: bigintType
      }
>
