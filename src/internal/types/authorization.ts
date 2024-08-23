import type { Address } from 'abitype'
import type { Hex } from './data.js'
import type { Signature } from './signature.js'
import type { Compute, Undefined } from './utils.js'

export type Authorization<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** Address of the contract to set as code for the Authority. */
    contractAddress: Address
    /** Chain ID to authorize. */
    chainId: numberType
    /** Nonce of the Authority to authorize. */
    nonce: bigintType
  } & (signed extends true ? Signature : Undefined<Signature>)
>
export type AuthorizationList<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = readonly Authorization<signed, bigintType, numberType>[]

export type AuthorizationTuple<signed extends boolean = boolean> =
  signed extends true
    ? readonly [
        chainId: Hex,
        address: Hex,
        nonce: Hex,
        yParity: Hex,
        r: Hex,
        s: Hex,
      ]
    : readonly [chainId: Hex, address: Hex, nonce: Hex]
export type AuthorizationTupleList<signed extends boolean = boolean> =
  readonly AuthorizationTuple<signed>[]
