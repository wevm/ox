import type * as Address from '../../Address.js'
import type { Hex } from '../../Hex.js'
import type { Signature } from '../Signature/types.js'
import type { Compute, Undefined } from '../types.js'

/** Root type for an EIP-7702 Authorization. */
export type Authorization<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** Address of the contract to set as code for the Authority. */
    address: Address.Address
    /** Chain ID to authorize. */
    chainId: numberType
    /** Nonce of the Authority to authorize. */
    nonce: bigintType
  } & (signed extends true
    ? Signature<true, bigintType, numberType>
    : Undefined<Signature>)
>

/** RPC representation of an {@link ox#Authorization.Authorization}. */
export type Authorization_Rpc = Authorization<true, Hex, Hex>

/** List of {@link ox#Authorization.Authorization}. */
export type Authorization_List<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<readonly Authorization<signed, bigintType, numberType>[]>

/** RPC representation of an {@link ox#Authorization.List}. */
export type Authorization_ListRpc = Authorization_List<true, Hex, Hex>

/** Signed representation of a list of {@link ox#Authorization.Authorization}. */
export type Authorization_ListSigned<
  bigintType = bigint,
  numberType = number,
> = Authorization_List<true, bigintType, numberType>

/** Signed representation of an {@link ox#Authorization.Authorization}. */
export type Authorization_Signed<
  bigintType = bigint,
  numberType = number,
> = Authorization<true, bigintType, numberType>

/** Tuple representation of an {@link ox#Authorization.Authorization}. */
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

/** Tuple representation of a signed {@link ox#Authorization.Authorization}. */
export type Authorization_TupleSigned = Authorization_Tuple<true>

/** Tuple representation of a list of {@link ox#Authorization.Authorization}. */
export type Authorization_TupleList<signed extends boolean = boolean> =
  readonly Authorization_Tuple<signed>[]

/** Tuple representation of a list of signed {@link ox#Authorization.Authorization}. */
export type Authorization_TupleListSigned = Authorization_TupleList<true>
