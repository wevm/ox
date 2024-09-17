import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

/** ECDSA signature. */
export type Signature<
  recovered extends boolean = true,
  bigintType = bigint,
  numberType = number,
> = Compute<
  recovered extends true
    ? {
        r: bigintType
        s: bigintType
        yParity: numberType
      }
    : {
        r: bigintType
        s: bigintType
        yParity?: numberType | undefined
      }
>

/** RPC-formatted ECDSA signature. */
export type Signature_Rpc<recovered extends boolean = true> = Signature<
  recovered,
  Hex,
  Hex
>

/** (Legacy) ECDSA signature. */
export type Signature_Legacy<bigintType = bigint, numberType = number> = {
  r: bigintType
  s: bigintType
  v: numberType
}

/** RPC-formatted (Legacy) ECDSA signature. */
export type Signature_LegacyRpc = Signature_Legacy<Hex, Hex>

export type Signature_Tuple = readonly [yParity: Hex, r: Hex, s: Hex]
