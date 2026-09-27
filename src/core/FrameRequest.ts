import * as Frame from './Frame.js'
import type { Compute, PartialBy } from './internal/types.js'

/** A frame request whose omitted gas limits are estimated by the node. */
export type FrameRequest<bigintType = bigint> = Frame.Frame<bigintType>

/** JSON-RPC frame request. Only the execution mode is required. */
export type Rpc = Compute<
  PartialBy<Frame.Rpc, Exclude<keyof Frame.Rpc, 'mode'>>
>

/**
 * Converts an RPC frame request, preserving omitted gas limits for node estimation.
 *
 * @example
 * ```ts twoslash
 * import { FrameRequest } from 'ox'
 *
 * const frame = FrameRequest.fromRpc({ mode: '0x2', stateGas: '0x0' })
 * ```
 *
 * @param frame - The RPC frame request.
 * @returns The decoded request with omitted gas limits preserved.
 */
export function fromRpc(frame: Rpc): FrameRequest {
  const { executionGas, stateGas, ...rest } = Frame.fromRpc({
    ...frame,
    data: frame.data ?? '0x',
    executionGas: frame.executionGas ?? '0x0',
    flags: frame.flags ?? '0x0',
    stateGas: frame.stateGas ?? '0x0',
    value: frame.value ?? '0x0',
  })
  return {
    ...rest,
    ...(frame.executionGas === undefined ? {} : { executionGas }),
    ...(frame.stateGas === undefined ? {} : { stateGas }),
  }
}

export declare namespace fromRpc {
  type ErrorType = Frame.fromRpc.ErrorType
}

/**
 * Converts a frame request to RPC fields without filling omitted gas limits.
 *
 * Explicit zero limits remain zero. Omitted mode, flags, value, and data use frame defaults.
 *
 * @example
 * ```ts twoslash
 * import { FrameRequest } from 'ox'
 *
 * const frame = FrameRequest.toRpc({ mode: 'sender', stateGas: 0n })
 * ```
 *
 * @param frame - The frame request. Gas and value accept hex, bigint, or number values.
 * @returns The RPC request with omitted gas limits preserved.
 */
export function toRpc(frame: toRpc.Input): Rpc {
  const { executionGas, stateGas, ...rest } = Frame.toRpc(frame)
  return {
    ...rest,
    ...(frame.executionGas === undefined ? {} : { executionGas }),
    ...(frame.stateGas === undefined ? {} : { stateGas }),
  }
}

export declare namespace toRpc {
  type Input = Frame.toRpc.Input
  type ErrorType = Frame.toRpc.ErrorType
}
