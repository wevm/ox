import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'
import type { Compute, Undefined } from '../types.js'

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
  } & (signed extends true
    ? Signature<true, bigintType, numberType>
    : Undefined<Signature>)
>

export type Authorization_Rpc = Authorization<true, Hex, Hex>

export type Authorization_List<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<readonly Authorization<signed, bigintType, numberType>[]>

export type Authorization_ListRpc = Authorization_List<true, Hex, Hex>

export type Authorization_ListSigned<
  bigintType = bigint,
  numberType = number,
> = Authorization_List<true, bigintType, numberType>

export type Authorization_Signed<
  bigintType = bigint,
  numberType = number,
> = Authorization<true, bigintType, numberType>

export type Authorization_Tuple<signed extends boolean = boolean> =
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

export type Authorization_TupleSigned = Authorization_Tuple<true>

export type Authorization_TupleList<signed extends boolean = boolean> =
  readonly Authorization_Tuple<signed>[]

export type Authorization_TupleListSigned = Authorization_TupleList<true>
