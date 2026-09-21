import { TxEnvelopeEip8141 } from 'ox'
import { expectTypeOf, test } from 'vite-plus/test'

test('preserves literals and serialized return types', () => {
  const envelope = TxEnvelopeEip8141.from({
    chainId: 1,
    frames: [{ gas: 50000n }],
    sender: '0x1111111111111111111111111111111111111111',
  })
  expectTypeOf(envelope.chainId).toEqualTypeOf<1>()
  expectTypeOf(envelope.frames[0].gas).toEqualTypeOf<50000n>()
  expectTypeOf(envelope.type).toEqualTypeOf<'eip8141'>()
  const serialized = TxEnvelopeEip8141.serialize(envelope)
  expectTypeOf(serialized).toEqualTypeOf<TxEnvelopeEip8141.Serialized>()
  expectTypeOf(
    TxEnvelopeEip8141.from(serialized),
  ).toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
})
