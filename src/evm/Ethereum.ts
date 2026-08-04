import type * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import type * as Hex from '../core/Hex.js'

/**
 * A transaction with its sender already recovered.
 *
 * evm2 takes the signer alongside a signature-stripped envelope rather than
 * recovering it during execution, so the sender is supplied here.
 */
export type RecoveredTx = {
  /** EIP-2718 encoded transaction. */
  envelope: Hex.Hex | Bytes.Bytes
  /** Sender the signature recovers to. */
  signer: Address.Address
}
