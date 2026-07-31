import * as AbiParameters from '../core/AbiParameters.js'
import * as Address from '../core/Address.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'

/**
 * Derives the sender tag that identifies the indexed parent-chain
 * `WithdrawalProcessed` event for a Zone withdrawal.
 *
 * The `transactionHash` is the Zone transaction containing the
 * `ZoneOutbox.requestWithdrawal` call. The protocol defines the sender tag as
 * `keccak256(abi.encodePacked(sender, transactionHash))`.
 *
 * [Authenticated Withdrawals Specification](https://github.com/tempoxyz/zones/blob/main/specs/spec.md#authenticated-withdrawals)
 *
 * @example
 * ```ts twoslash
 * import { WithdrawalSenderTag } from 'ox/tempo'
 *
 * const senderTag = WithdrawalSenderTag.from({
 *   sender: '0x1234567890abcdef1234567890abcdef12345678',
 *   transactionHash:
 *     '0xabababababababababababababababababababababababababababababababab'
 * })
 * ```
 *
 * @param value - Withdrawal sender and Zone transaction hash.
 * @returns The sender tag.
 */
export function from(value: from.Value): Hex.Hex {
  const { sender, transactionHash } = value
  return Hash.keccak256(
    AbiParameters.encodePacked(
      ['address', 'bytes32'],
      [sender, transactionHash],
    ),
  )
}

export declare namespace from {
  export type Value = {
    /** Address that requested the withdrawal. */
    sender: Address.Address
    /** Hash of the Zone transaction containing `ZoneOutbox.requestWithdrawal`. */
    transactionHash: Hex.Hex
  }
}
