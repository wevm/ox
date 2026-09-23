import { TxEnvelopeEip8141 } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('default', () => {
  const envelope = TxEnvelopeEip8141.from({
    chainId: 1,
    frames: [{ executionGas: 50000n }],
    sender: '0x1111111111111111111111111111111111111111',
  })
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly chainId: 1
    readonly frames: readonly [{ readonly executionGas: 50000n }]
    readonly sender: '0x1111111111111111111111111111111111111111'
    readonly type: 'eip8141'
  }>()
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
  expectTypeOf(
    TxEnvelopeEip8141.serialize(envelope),
  ).toEqualTypeOf<TxEnvelopeEip8141.Serialized>()
})

test('serialized', () => {
  const envelope = TxEnvelopeEip8141.from(
    '0x06' as TxEnvelopeEip8141.Serialized,
  )
  expectTypeOf(envelope).toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
})

test('unsigned signature', () => {
  const envelope = TxEnvelopeEip8141.from({
    chainId: 1n,
    frames: [{}],
    sender: '0x1111111111111111111111111111111111111111',
    signatures: [{ scheme: 'secp256k1' }],
  })
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly chainId: 1n
    readonly frames: readonly [{}]
    readonly sender: '0x1111111111111111111111111111111111111111'
    readonly signatures: readonly [{ readonly scheme: 'secp256k1' }]
    readonly type: 'eip8141'
  }>()
  expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
})
