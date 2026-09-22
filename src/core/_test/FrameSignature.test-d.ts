import { FrameSignature } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('from preserves literals and supplies defaults', () => {
  const entry = FrameSignature.from({ signature: '0xaabb' })
  expectTypeOf(entry.scheme).toEqualTypeOf<'arbitrary'>()
  expectTypeOf(entry.payload).toEqualTypeOf<'0x'>()
  expectTypeOf(entry.signature).toEqualTypeOf<'0xaabb'>()
  expectTypeOf(
    FrameSignature.toTuple(entry),
  ).toEqualTypeOf<FrameSignature.Tuple>()
  const numeric = FrameSignature.from({
    scheme: 1,
    signature: { r: 0x01n, s: 0x02n, yParity: 1 },
  })
  expectTypeOf(numeric.scheme).toEqualTypeOf<1>()
  expectTypeOf(numeric.signature.yParity).toEqualTypeOf<1>()
  const named = FrameSignature.from({ scheme: 'p256' })
  expectTypeOf(named.scheme).toEqualTypeOf<'p256'>()
})

test('accepts typed inputs', () => {
  const input = {} as FrameSignature.from.Input
  expectTypeOf(
    FrameSignature.from(input),
  ).toExtend<FrameSignature.FrameSignature>()
})

test('rejects invalid schemes and signature shapes', () => {
  const arbitrary = {
    scheme: 'arbitrary',
    signature: '0x',
    signer: '0x0000000000000000000000000000000000000000',
  } as const
  // @ts-expect-error Arbitrary entries cannot specify a signer.
  FrameSignature.from(arbitrary)
  // @ts-expect-error Scheme 3 is reserved.
  FrameSignature.from({ scheme: 3, signature: '0x' })
  // @ts-expect-error Named schemes form a strict union.
  FrameSignature.from({ scheme: 'unknown', signature: '0x' })
  // @ts-expect-error P-256 signatures require a public key.
  FrameSignature.from({ scheme: 'p256', signature: { r: 0x01n, s: 0x02n } })
  // @ts-expect-error Default arbitrary signatures require bytes.
  FrameSignature.from({ signature: { r: 0x01n, s: 0x02n, yParity: 1 } })
})

test('explicit undefined defaults remain narrow', () => {
  const entry = FrameSignature.from({
    payload: undefined,
    scheme: undefined,
    signature: '0x',
  })
  expectTypeOf(entry.scheme).toEqualTypeOf<'arbitrary'>()
  expectTypeOf(entry.payload).toEqualTypeOf<'0x'>()
})

test('from hex preserves signature literals and default metadata', () => {
  const entry = FrameSignature.from('0xaabb')
  expectTypeOf(entry).toEqualTypeOf<{
    payload: '0x'
    scheme: 'arbitrary'
    signature: '0xaabb'
  }>()
  // @ts-expect-error Signature bytes must be hex-prefixed.
  FrameSignature.from('aabb')
})

test('from preserves structured signature types', () => {
  const secp = FrameSignature.from({
    scheme: 'secp256k1',
    signature: {
      r: 0x01n,
      s: 0x02n,
      yParity: 1,
    },
  })
  expectTypeOf(secp.scheme).toEqualTypeOf<'secp256k1'>()
  expectTypeOf(secp.signature.yParity).toEqualTypeOf<1>()
  const p256 = FrameSignature.from({
    publicKey: { prefix: 4, x: 0x01n, y: 0x02n },
    scheme: 'p256',
    signature: { r: 0x01n, s: 0x02n },
  })
  expectTypeOf(p256.scheme).toEqualTypeOf<'p256'>()
  expectTypeOf(p256.signature.r).toEqualTypeOf<1n>()
  // @ts-expect-error P-256 requires a public key.
  FrameSignature.from({ scheme: 'p256', signature: { r: 0x01n, s: 0x02n } })
  FrameSignature.from({
    scheme: 'secp256k1',
    // @ts-expect-error secp256k1 requires recovery parity.
    signature: { r: 0x01n, s: 0x02n },
  })
})
