import type * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import type * as Hex from '../core/Hex.js'
import type * as TxEnvelope from '../core/TxEnvelope.js'

/**
 * A transaction to execute, with the account that pays for it.
 *
 * Supply the fields directly, or the encoded transaction under `serialized`
 * when replaying one off the wire.
 *
 * `from` is authoritative. evm2 takes the sender alongside a signature-stripped
 * envelope rather than recovering it, so a signature the envelope carries is
 * never read and never checked against `from`.
 */
export type Tx = Tx.Fields | Tx.Serialized

export declare namespace Tx {
  /**
   * Transaction fields, plus the sender.
   *
   * The envelope type is inferred from the fee fields present, exactly as
   * {@link ox#TxEnvelope.(from:function)} infers it.
   */
  type Fields = Envelope & {
    /** Account the transaction executes as. */
    from: Address.Address
  }

  /** An already-encoded transaction, plus its sender. */
  type Serialized = {
    /** Account the transaction executes as. */
    from: Address.Address
    /** EIP-2718 encoded transaction. */
    serialized: Bytes.Bytes | Hex.Hex
  }
}

/**
 * Mirrors the loose input {@link ox#TxEnvelope.(from:function)} accepts. That
 * type is not exported, so it is restated rather than imported.
 */
type Envelope =
  | TxEnvelope.TxEnvelope
  | {
      readonly [key: string]: unknown
      readonly type?: string | undefined
    }
