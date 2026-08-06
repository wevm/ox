import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import * as Hash from '../core/Hash.js'
import type * as Hex from '../core/Hex.js'

/**
 * Derives the sender tag that identifies the indexed parent-chain
 * `WithdrawalProcessed` event for a Zone withdrawal.
 *
 * The `transactionHash` is the Zone transaction containing the
 * `ZoneOutbox.requestWithdrawal` call. The protocol defines a user withdrawal
 * sender tag as
 * `keccak256(abi.encodePacked(sender, transactionHash, fallbackNonce))`.
 * Internal deposit bounce-backs use the canonical zero-sender tag derived from
 * `address(0)` and `bytes32(0)` without a fallback nonce.
 *
 * [Authenticated Withdrawals Specification](https://github.com/tempoxyz/zones/blob/main/specs/spec.md#authenticated-withdrawals)
 *
 * @example
 * ```ts twoslash
 * import { WithdrawalSenderTag } from 'ox/tempo'
 *
 * const senderTag = WithdrawalSenderTag.from({
 *   fallbackNonce: 19n,
 *   sender: '0x1234567890abcdef1234567890abcdef12345678',
 *   transactionHash:
 *     '0xabababababababababababababababababababababababababababababababab'
 * })
 * ```
 *
 * @param value - Withdrawal sender, Zone transaction hash, and fallback nonce.
 * @returns The sender tag.
 */
export function from(value: from.Value): Hex.Hex {
  const { fallbackNonce, sender, transactionHash } = value
  if (
    sender === '0x0000000000000000000000000000000000000000' &&
    fallbackNonce === 0n
  )
    return Hash.keccak256(
      AbiParameters.encodePacked(
        ['address', 'bytes32'],
        [
          sender,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ],
      ),
    )
  return Hash.keccak256(
    AbiParameters.encodePacked(
      ['address', 'bytes32', 'uint64'],
      [sender, transactionHash, fallbackNonce],
    ),
  )
}

export declare namespace from {
  export type Value = {
    /** Public nonce assigned to the withdrawal's private fallback recipient. */
    fallbackNonce: bigint
    /** Address that requested the withdrawal. */
    sender: Address.Address
    /** Hash of the Zone transaction containing `ZoneOutbox.requestWithdrawal`. */
    transactionHash: Hex.Hex
  }
}
