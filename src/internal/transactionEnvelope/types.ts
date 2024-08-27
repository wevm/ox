import type { Address } from 'abitype'
import type { Hex } from '../hex/types.js'

export type TransactionEnvelope_Base<type extends string = string> = {
  /** Contract code or a hashed method call with encoded args */
  data?: Hex | undefined
  /** @alias `data` – added for JSON-RPC backwards compatibility. */
  input?: Hex | undefined
  /** Gas provided for transaction execution */
  gas?: bigint | undefined
  /** Unique number identifying this transaction */
  nonce?: bigint | undefined
  /** Transaction recipient */
  to?: Address | undefined
  /** Transaction type */
  type: type
  /** Value in wei sent with this transaction */
  value?: bigint | undefined
}
