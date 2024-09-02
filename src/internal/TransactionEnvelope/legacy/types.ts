import type { Hex } from '../../Hex/types.js'
import type { Branded, Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeLegacy<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeLegacy_Type,
> = Compute<
  TransactionEnvelope_Base<type, signed, bigintType, numberType> & {
    /** EIP-155 Chain ID. */
    chainId?: numberType | undefined
    /** Base fee per gas. */
    gasPrice?: bigintType | undefined
  }
>

export type TransactionEnvelopeLegacy_Rpc<signed extends boolean = boolean> =
  TransactionEnvelopeLegacy<signed, Hex, Hex, '0x0'>

export type TransactionEnvelopeLegacy_Serialized = Branded<
  `0x${string}`,
  'legacy'
>

export type TransactionEnvelopeLegacy_Signed = TransactionEnvelopeLegacy<true>

export type TransactionEnvelopeLegacy_Type = 'legacy'
