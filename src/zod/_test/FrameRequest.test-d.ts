import type { FrameRequest } from 'ox'
import { z } from 'ox/zod'
import { expectTypeOf, test } from 'vp/test'

test('public frame request codecs preserve input and output types', () => {
  expectTypeOf<
    z.input<typeof z.FrameRequest.FrameRequest>
  >().toEqualTypeOf<FrameRequest.Rpc>()
  expectTypeOf<
    z.output<typeof z.FrameRequest.FrameRequest>
  >().toEqualTypeOf<FrameRequest.FrameRequest>()
  expectTypeOf<
    z.output<typeof z.FrameRequest.FrameRequestToRpc>
  >().toEqualTypeOf<FrameRequest.toRpc.Input>()
})
