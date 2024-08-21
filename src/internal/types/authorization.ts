import type { Address } from 'abitype'
import type { Hex } from './data.js'
import type { Signature } from './signature.js'
import type { ComputeSignature } from './transactionEnvelope.js'
import type { Compute } from './utils.js'

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
  } & ComputeSignature<Signature, signed>
>

export type AuthorizationList<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = readonly Authorization<signed, bigintType, numberType>[]

export type AuthorizationSerialized = readonly [
  chainId: Hex,
  address: Hex,
  nonce: Hex,
  yParity: Hex,
  r: Hex,
  s: Hex,
]
export type AuthorizationListSerialized = readonly AuthorizationSerialized[]
