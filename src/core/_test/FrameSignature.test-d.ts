import { FrameSignature } from 'ox'
import { expectTypeOf, test } from 'vite-plus/test'

test('from preserves literals and tuple types', () => {
  const entry = FrameSignature.from({
    scheme: 0,
    msg: '0x',
    signature: '0xaabb',
  })
  expectTypeOf(entry.scheme).toEqualTypeOf<0>()
  expectTypeOf(entry.signature).toEqualTypeOf<'0xaabb'>()
  expectTypeOf(
    FrameSignature.toTuple(entry),
  ).toEqualTypeOf<FrameSignature.Tuple>()
})

test('fromSecp256k1 preserves the scheme discriminant', () => {
  const entry = FrameSignature.fromSecp256k1({
    r: '0x01',
    s: '0x02',
    yParity: 1,
  })
  expectTypeOf(entry.scheme).toEqualTypeOf<1>()
})

test('rejects signer metadata on arbitrary entries', () => {
  const entry = {
    scheme: 0,
    msg: '0x',
    signature: '0x',
    signer: '0x0000000000000000000000000000000000000000',
  } as const
  // @ts-expect-error Arbitrary entries cannot specify a signer.
  FrameSignature.from(entry)
  // @ts-expect-error Scheme 3 is reserved.
  FrameSignature.from({ scheme: 3, msg: '0x', signature: '0x' })
})
