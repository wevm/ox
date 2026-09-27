import { FrameRequest } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('public frame request types', () => {
  const rpc = { mode: '0x2' } as const satisfies FrameRequest.Rpc
  const request = FrameRequest.fromRpc(rpc)
  expectTypeOf(request).toEqualTypeOf<FrameRequest.FrameRequest>()
  expectTypeOf(FrameRequest.toRpc(request)).toEqualTypeOf<FrameRequest.Rpc>()
  const input = {
    executionGas: '0x1',
    stateGas: 0,
  } as const satisfies FrameRequest.toRpc.Input
  expectTypeOf(FrameRequest.toRpc(input)).toEqualTypeOf<FrameRequest.Rpc>()
  expectTypeOf<FrameRequest.fromRpc.ErrorType>().not.toBeNever()
  expectTypeOf<FrameRequest.toRpc.ErrorType>().not.toBeNever()
})
