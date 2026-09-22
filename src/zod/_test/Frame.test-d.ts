import type {
  Frame,
  FrameReceipt,
  FrameSignature,
  Transaction,
  TxEnvelopeEip8141,
} from 'ox'
import { z } from 'ox/zod'
import { expectTypeOf, test } from 'vp/test'

test('frame codecs preserve core types', () => {
  expectTypeOf<z.output<typeof z.Frame.Frame>>().toEqualTypeOf<Frame.Frame>()
  expectTypeOf<z.input<typeof z.Frame.Frame>>().toEqualTypeOf<Frame.Rpc>()
  expectTypeOf<
    z.output<typeof z.FrameSignature.FrameSignature>
  >().toEqualTypeOf<FrameSignature.FrameSignature>()
  expectTypeOf<
    z.input<typeof z.FrameSignature.FrameSignature>
  >().toEqualTypeOf<FrameSignature.Rpc>()
  expectTypeOf<
    z.output<typeof z.TxEnvelopeEip8141.TxEnvelopeEip8141>
  >().toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
  expectTypeOf<
    z.input<typeof z.TxEnvelopeEip8141.TxEnvelopeEip8141>
  >().toEqualTypeOf<TxEnvelopeEip8141.Rpc>()
  expectTypeOf<
    z.output<typeof z.Transaction.Eip8141>
  >().toEqualTypeOf<Transaction.Eip8141>()
  expectTypeOf<
    z.input<typeof z.Transaction.Eip8141>
  >().toEqualTypeOf<Transaction.Eip8141Rpc>()
  expectTypeOf<z.output<typeof z.Transaction.PendingEip8141>>().toEqualTypeOf<
    Transaction.Eip8141<true>
  >()
  expectTypeOf<
    z.output<typeof z.FrameReceipt.FrameReceipt>
  >().toEqualTypeOf<FrameReceipt.FrameReceipt>()
  expectTypeOf<
    z.input<typeof z.FrameReceipt.FrameReceipt>
  >().toEqualTypeOf<FrameReceipt.Rpc>()
})
