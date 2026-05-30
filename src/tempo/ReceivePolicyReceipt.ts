import * as AbiEvent from '../core/AbiEvent.js'
import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import type * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/** Reason an inbound transfer or mint was blocked by a receive policy. */
export type BlockedReason = 'none' | 'tokenFilter' | 'receivePolicy'

/** Kind of inbound operation that was blocked. */
export type Kind = 'transfer' | 'mint'

/**
 * A decoded TIP-1028 receive-policy claim receipt.
 *
 * When an inbound transfer or mint violates the recipient's receive policy, the
 * funds are redirected to the `ReceivePolicyGuard` and a `ClaimReceiptV1`
 * witness is emitted. The witness is required to later `claim` or `burn` the
 * blocked funds.
 */
export type ReceivePolicyReceipt = Compute<{
  /** Receipt layout version. */
  version: number
  /** TIP-20 token holding the blocked funds. */
  token: Address.Address
  /** Recovery authority captured when the operation was blocked. */
  recoveryAuthority: Address.Address
  /** Original sender (transfer) or issuer (mint). */
  originator: Address.Address
  /** Addressed recipient (may be a virtual address). */
  recipient: Address.Address
  /** Block timestamp when the operation was blocked. */
  blockedAt: bigint
  /** Guard nonce assigned when the operation was blocked. */
  blockedNonce: bigint
  /** Reason the operation was blocked. */
  blockedReason: BlockedReason
  /** Whether the blocked operation was a transfer or mint. */
  kind: Kind
  /** Application memo. */
  memo: Hex.Hex
}>

/** @internal */
const blockedReasons = ['none', 'tokenFilter', 'receivePolicy'] as const

/** @internal */
const kinds = ['transfer', 'mint'] as const

/** @internal ABI parameters for the `ClaimReceiptV1` witness. */
const parameters = [
  {
    type: 'tuple',
    components: [
      { name: 'version', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'recoveryAuthority', type: 'address' },
      { name: 'originator', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'blockedAt', type: 'uint64' },
      { name: 'blockedNonce', type: 'uint64' },
      { name: 'blockedReason', type: 'uint8' },
      { name: 'kind', type: 'uint8' },
      { name: 'memo', type: 'bytes32' },
    ],
  },
] as const

/** @internal `TransferBlocked` event emitted by the `ReceivePolicyGuard`. */
const transferBlocked = AbiEvent.from(
  'event TransferBlocked(address indexed token, address indexed receiver, uint64 indexed blockedNonce, uint256 amount, uint8 receiptVersion, bytes receipt)',
)

/**
 * Decodes an ABI-encoded `ClaimReceiptV1` witness into a
 * {@link ox#ReceivePolicyReceipt.ReceivePolicyReceipt}.
 *
 * [TIP-1028](https://docs.tempo.xyz/protocol/tips/tip-1028)
 *
 * @example
 * ```ts twoslash
 * import { ReceivePolicyReceipt } from 'ox/tempo'
 *
 * const receipt = ReceivePolicyReceipt.decode('0x...')
 * ```
 *
 * @param receipt - The ABI-encoded `ClaimReceiptV1` witness.
 * @returns The decoded receive-policy receipt.
 */
export function decode(receipt: Hex.Hex): ReceivePolicyReceipt {
  const [decoded] = AbiParameters.decode(parameters, receipt)
  return {
    version: decoded.version,
    token: decoded.token,
    recoveryAuthority: decoded.recoveryAuthority,
    originator: decoded.originator,
    recipient: decoded.recipient,
    blockedAt: decoded.blockedAt,
    blockedNonce: decoded.blockedNonce,
    blockedReason: blockedReasons[decoded.blockedReason] ?? 'none',
    kind: kinds[decoded.kind] ?? 'transfer',
    memo: decoded.memo,
  }
}

export declare namespace decode {
  type ErrorType = AbiParameters.decode.ErrorType | Errors.GlobalErrorType
}

/**
 * Normalizes a receive-policy receipt from either an ABI-encoded
 * `ClaimReceiptV1` witness or an already-decoded receipt.
 *
 * [TIP-1028](https://docs.tempo.xyz/protocol/tips/tip-1028)
 *
 * @example
 * ```ts twoslash
 * import { ReceivePolicyReceipt } from 'ox/tempo'
 *
 * // From an encoded witness.
 * const a = ReceivePolicyReceipt.from('0x...')
 *
 * // From a decoded receipt (passthrough).
 * const b = ReceivePolicyReceipt.from(a)
 * ```
 *
 * @param value - The ABI-encoded witness or a decoded receipt.
 * @returns The decoded receive-policy receipt.
 */
export function from(
  value: Hex.Hex | ReceivePolicyReceipt,
): ReceivePolicyReceipt {
  if (typeof value === 'string') return decode(value)
  return value
}

export declare namespace from {
  type ErrorType = decode.ErrorType | Errors.GlobalErrorType
}

/**
 * Extracts every receive-policy receipt from a transaction receipt's logs.
 *
 * A single transaction may block multiple inbound transfers (e.g. a batched
 * transfer to several recipients), so this returns an array – one entry per
 * `TransferBlocked` log, in log order. Returns an empty array when no transfers
 * were blocked.
 *
 * [TIP-1028](https://docs.tempo.xyz/protocol/tips/tip-1028)
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { ReceivePolicyReceipt } from 'ox/tempo'
 *
 * const receipts = ReceivePolicyReceipt.fromTransactionReceipt(receipt)
 * // @log: [{ token: '0x…', originator: '0x…', kind: 'transfer', … }]
 * ```
 *
 * @param receipt - The transaction receipt (or any object with `logs`).
 * @returns The decoded receive-policy receipts, one per blocked transfer.
 */
export function fromTransactionReceipt(
  receipt: fromTransactionReceipt.Receipt,
): readonly ReceivePolicyReceipt[] {
  const selector = AbiEvent.getSelector(transferBlocked)
  const receipts: ReceivePolicyReceipt[] = []
  for (const log of receipt.logs ?? []) {
    if (log.topics[0] !== selector) continue
    const { receipt: witness } = AbiEvent.decode(transferBlocked, log)
    receipts.push(decode(witness))
  }
  return receipts
}

export declare namespace fromTransactionReceipt {
  type Receipt = {
    /** Logs emitted by the transaction. */
    logs?: readonly AbiEvent.decode.Log[] | undefined
  }

  type ErrorType =
    | AbiEvent.decode.ErrorType
    | AbiEvent.getSelector.ErrorType
    | decode.ErrorType
    | Errors.GlobalErrorType
}
