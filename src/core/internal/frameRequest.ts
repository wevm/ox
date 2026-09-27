import * as Frame from '../Frame.js'
import type { Compute, PartialBy } from './types.js'

/** @internal */
export type Rpc = Compute<
  PartialBy<Frame.Rpc, Exclude<keyof Frame.Rpc, 'mode'>>
>

/** @internal */
export function fromRpc(frame: Rpc): Frame.Frame {
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

/** @internal */
export function toRpc(frame: Frame.toRpc.Input): Rpc {
  const { executionGas, stateGas, ...rest } = Frame.toRpc(frame)
  return {
    ...rest,
    ...(frame.executionGas === undefined ? {} : { executionGas }),
    ...(frame.stateGas === undefined ? {} : { stateGas }),
  }
}
