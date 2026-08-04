import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/**
 * Reason the interpreter stopped, mirroring evm2's `InstrStop`.
 *
 * `stop`, `return`, and `selfDestruct` are successful. Everything else is a
 * revert or an exceptional halt, which differ in whether gas is refunded.
 */
export type Stop = keyof typeof stops

/**
 * Stop reasons and the discriminants evm2 assigns them.
 *
 * The values are not contiguous: evm2 groups successes from 1, reverts from
 * 0x10, and halts from 0x20, so this map has to be explicit rather than derived
 * from position.
 */
export const stops = {
  stop: 1,
  return: 2,
  selfDestruct: 3,
  revert: 0x10,
  callTooDeep: 0x11,
  outOfFunds: 0x12,
  createInitCodeStartingEF00: 0x13,
  invalidEofInitCode: 0x14,
  invalidExtDelegateCallTarget: 0x15,
  outOfGas: 0x20,
  memoryOutOfGas: 0x21,
  memoryLimitOutOfGas: 0x22,
  precompileOutOfGas: 0x23,
  invalidOperandOutOfGas: 0x24,
  reentrancySentryOutOfGas: 0x25,
  callNotAllowedInsideStatic: 0x26,
  stateChangeDuringStaticCall: 0x27,
  invalidOpcode: 0x28,
  invalidJump: 0x29,
  notActivated: 0x2a,
  stackUnderflow: 0x2b,
  stackOverflow: 0x2c,
  outOfOffset: 0x2d,
  createCollision: 0x2e,
  overflowPayment: 0x2f,
  precompileError: 0x30,
  nonceOverflow: 0x31,
  createContractSizeLimit: 0x32,
  createContractStartingWithEF: 0x33,
  createInitCodeSizeLimit: 0x34,
  fatalPrecompileError: 0x35,
  fatalExternalError: 0x36,
  invalidImmediateEncoding: 0x37,
} as const

/** A log emitted during execution. */
export type Log = {
  /** Account that emitted the log. */
  address: Address.Address
  /** Unindexed data. */
  data: Hex.Hex
  /** Indexed topics. */
  topics: readonly Hex.Hex[]
}

/**
 * Outcome of executing a transaction.
 *
 * Every field is evm2's, with only snake-case to camel-case adaptation. A revert
 * or an exceptional halt is a successful execution that returns `status: false`,
 * not an error: errors are reserved for transactions evm2 refused to run and for
 * state the source could not supply.
 */
export type TxResult = {
  /** Address of the contract a successful create transaction deployed. */
  createdAddress?: Address.Address | undefined
  /** Host error code raised during execution, if any. */
  errorCode?: bigint | undefined
  /** EIP-7623 calldata floor gas. Zero when it does not apply. */
  floorGas: bigint
  /** Logs emitted during execution. */
  logs: readonly Log[]
  /** Returned data, or revert data when `status` is `false`. */
  output: Hex.Hex
  /** Gas refund, capped per EIP-3529, before the EIP-7623 floor applies. */
  refunded: bigint
  /** State gas consumed per EIP-8037. Zero when EIP-8037 is disabled. */
  stateGasSpent: bigint
  /** Whether execution succeeded. */
  status: boolean
  /** Why the interpreter stopped. */
  stop: Stop
  /** Total gas spent, regular plus state, before any refund. */
  totalGasSpent: bigint
}

/**
 * Returns the gas a receipt reports: `max(totalGasSpent - refunded, floorGas)`.
 *
 * This is the value a transaction is charged for, which is neither
 * `totalGasSpent` (pre-refund) nor a plain subtraction (the EIP-7623 floor can
 * absorb the refund).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, TxResult } from 'ox/evm'
 *
 * const result = Evm.callTx(evm, transaction)
 * TxResult.txGasUsed(result)
 * // @log: 21000n
 * ```
 *
 * @param result - Transaction result.
 * @returns Gas used, after refunds and the calldata floor.
 */
export function txGasUsed(result: TxResult): bigint {
  const spent = result.totalGasSpent - result.refunded
  return spent > result.floorGas ? spent : result.floorGas
}

/**
 * Returns the regular, non-state gas this transaction contributes to a block:
 * `max(totalGasSpent - stateGasSpent, floorGas)`.
 *
 * With {@link ox#TxResult.(stateGasSpent:function)} this is the EIP-8037 split a
 * caller adds to a block's separate counters. The EIP-7623 floor is not
 * discounted by state gas, so it binds against this component.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { TxResult } from 'ox/evm'
 *
 * const result = Evm.callTx(evm, transaction)
 * TxResult.regularGasSpent(result) +
 *   TxResult.stateGasSpent(result)
 * // @log: 21000n
 * ```
 *
 * @param result - Transaction result.
 * @returns Regular gas, before refunds.
 */
export function regularGasSpent(result: TxResult): bigint {
  const regular = result.totalGasSpent - result.stateGasSpent
  return regular > result.floorGas ? regular : result.floorGas
}

/**
 * Returns the EIP-8037 state gas this transaction contributes to a block.
 *
 * The counterpart to {@link ox#TxResult.(regularGasSpent:function)} in the
 * per-transaction block-gas split.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { TxResult } from 'ox/evm'
 *
 * const result = Evm.callTx(evm, transaction)
 * TxResult.stateGasSpent(result)
 * // @log: 0n
 * ```
 *
 * @param result - Transaction result.
 * @returns State gas.
 */
export function stateGasSpent(result: TxResult): bigint {
  return result.stateGasSpent
}
