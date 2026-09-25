import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Quantity from './internal/quantity.js'
import type * as Log from './Log.js'

/** Receipt for one frame. Frame logs contain only address, data, and topics. */
export type FrameReceipt<bigintType = bigint> = {
  /** Execution gas used before transaction-level refunds. */
  executionGasUsed: bigintType
  /** Total execution and state gas used. */
  gasUsed: bigintType
  /** Logs emitted by this frame. */
  logs: readonly Pick<Log.Log, 'address' | 'data' | 'topics'>[]
  /** Final state gas after refills and rollbacks. */
  stateGasUsed: bigintType
  /** Frame execution result. */
  status: Status
}

/** JSON-RPC receipt for one frame. */
export type Rpc = {
  /** Total execution and state gas used. */
  gasUsed: Hex.Hex
  /** Execution gas used. */
  executionGasUsed: Hex.Hex
  /** Logs emitted by this frame. */
  logs: readonly Pick<Log.Log, 'address' | 'data' | 'topics'>[]
  /** Final state gas used. */
  stateGasUsed: Hex.Hex
  /** Zero for failure, one for success, or two for a skipped frame. */
  status: RpcStatus
}

/** Frame execution status. */
export type Status = 'reverted' | 'skipped' | 'success'

/** Hex JSON-RPC frame execution status. */
export type RpcStatus = '0x0' | '0x1' | '0x2'

/** RPC status to status mapping. */
export const fromRpcStatus = {
  '0x0': 'reverted',
  '0x1': 'success',
  '0x2': 'skipped',
} as const

/** Status to RPC status mapping. */
export const toRpcStatus = {
  reverted: '0x0',
  skipped: '0x2',
  success: '0x1',
} as const

/**
 * Converts an RPC frame receipt to a {@link ox#FrameReceipt.FrameReceipt}.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { FrameReceipt } from 'ox'
 *
 * const receipt = FrameReceipt.fromRpc({
 *   executionGasUsed: '0x5208',
 *   gasUsed: '0x5208',
 *   logs: [],
 *   stateGasUsed: '0x0',
 *   status: '0x1'
 * })
 * ```
 *
 * @param receipt - The RPC frame receipt.
 * @returns The frame receipt with bigint gas and a named status.
 */
export function fromRpc(receipt: Rpc): FrameReceipt {
  return {
    executionGasUsed: Hex.toBigInt(receipt.executionGasUsed),
    gasUsed: Hex.toBigInt(receipt.gasUsed),
    logs: receipt.logs,
    stateGasUsed: Hex.toBigInt(receipt.stateGasUsed),
    status: fromRpcStatus[receipt.status],
  }
}

export declare namespace fromRpc {
  type ErrorType = Hex.toBigInt.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#FrameReceipt.FrameReceipt} to an RPC frame receipt.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { FrameReceipt } from 'ox'
 *
 * const receipt = FrameReceipt.fromRpc({
 *   executionGasUsed: '0x5208',
 *   gasUsed: '0x5208',
 *   logs: [],
 *   stateGasUsed: '0x0',
 *   status: '0x1'
 * })
 * const rpc = FrameReceipt.toRpc(receipt)
 * ```
 *
 * @param receipt - The frame receipt. Gas accepts hex, bigint, or number values.
 * @returns The RPC frame receipt with hex gas and a hex status.
 */
export function toRpc(receipt: toRpc.Input): Rpc {
  return {
    executionGasUsed: Quantity.fromNumberish(receipt.executionGasUsed),
    gasUsed: Quantity.fromNumberish(receipt.gasUsed),
    logs: receipt.logs,
    stateGasUsed: Quantity.fromNumberish(receipt.stateGasUsed),
    status: toRpcStatus[receipt.status],
  }
}

export declare namespace toRpc {
  type Input = FrameReceipt<Hex.Hex | bigint | number>

  type ErrorType = Hex.fromNumber.ErrorType | Errors.GlobalErrorType
}
