import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'

/** Root type for an EIP-7702 Authorization. */
export type Authorization<bigintType = bigint, numberType = number> = {
  /** Address of the contract to set as code for the Authority. */
  address: Address
  /** Chain ID to authorize. */
  chainId: numberType
  /** Nonce of the Authority to authorize. */
  nonce: bigintType
  /** ECDSA r value. */
  r?: bigintType | undefined
  /** ECDSA s value. */
  s?: bigintType | undefined
  /** ECDSA yParity value. */
  yParity?: numberType | undefined
}

/** RPC representation of an {@link ox#Authorization.Authorization}. */
export type Rpc = Signed<Hex, Hex>

/** List of {@link ox#Authorization.Authorization}. */
export type List<
  bigintType = bigint,
  numberType = number,
> = readonly Authorization<bigintType, numberType>[]

/** RPC representation of an {@link ox#Authorization.List}. */
export type ListRpc = ListSigned<Hex, Hex>

/** Signed representation of a list of {@link ox#Authorization.Authorization}. */
export type ListSigned<
  bigintType = bigint,
  numberType = number,
> = readonly Signed<bigintType, numberType>[]

/** Signed representation of an {@link ox#Authorization.Authorization}. */
export type Signed<bigintType = bigint, numberType = number> = {
  /** Address of the contract to set as code for the Authority. */
  address: Address
  /** Chain ID to authorize. */
  chainId: numberType
  /** Nonce of the Authority to authorize. */
  nonce: bigintType
  /** ECDSA r value. */
  r: bigintType
  /** ECDSA s value. */
  s: bigintType
  /** ECDSA yParity value. */
  yParity: numberType
}

/** Tuple representation of an {@link ox#Authorization.Authorization}. */
export type Tuple = [
  chainId: Hex,
  address: Hex,
  nonce: Hex,
  yParity?: Hex | undefined,
  r?: Hex | undefined,
  s?: Hex | undefined,
]

/** Tuple representation of a signed {@link ox#Authorization.Authorization}. */
export type TupleSigned = readonly [
  chainId: Hex,
  address: Hex,
  nonce: Hex,
  yParity: Hex,
  r: Hex,
  s: Hex,
]

/** Tuple representation of a list of {@link ox#Authorization.Authorization}. */
export type TupleList = readonly Tuple[]

/** Tuple representation of a list of signed {@link ox#Authorization.Authorization}. */
export type TupleListSigned = readonly TupleSigned[]
