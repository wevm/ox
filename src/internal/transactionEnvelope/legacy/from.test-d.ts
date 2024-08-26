import { TransactionEnvelopeLegacy } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeLegacy.from({
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly type: 'legacy'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelopeLegacy.from(
      '0x123' as TransactionEnvelopeLegacy.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelopeLegacy.from({
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: 0n,
      s: 1n,
      v: 37,
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly to: '0x0000000000000000000000000000000000000000'
      readonly value: 69n
      readonly r: 0n
      readonly s: 1n
      readonly v: 37
      readonly type: 'legacy'
    }>()
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeLegacy.from(
    {
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    },
    {
      signature: {
        r: 0n,
        s: 1n,
        yParity: 0,
      },
    },
  )
  expectTypeOf(envelope).toEqualTypeOf<{
    readonly to: '0x0000000000000000000000000000000000000000'
    readonly value: 69n
    readonly r: 0n
    readonly s: 1n
    readonly v: 27
    readonly type: 'legacy'
  }>()
  expectTypeOf(
    envelope,
  ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
})
