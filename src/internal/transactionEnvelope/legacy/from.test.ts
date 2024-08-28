import { TransactionEnvelopeLegacy } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeLegacy.from({})
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
    expect(envelope).toMatchInlineSnapshot(`
      {
        "type": "legacy",
      }
    `)
  }

  {
    const envelope = TransactionEnvelopeLegacy.from({
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(envelope)
    expect(TransactionEnvelopeLegacy.from(serialized)).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelopeLegacy.from({
      chainId: 1,
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      r: 0n,
      s: 1n,
      v: 37,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(envelope)
    const envelope2 = TransactionEnvelopeLegacy.from(serialized)
    expect(envelope2).toEqual(envelope)
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeLegacy.from(
    {
      to: '0x0000000000000000000000000000000000000000',
      value: 69n,
      type: 'legacy',
    },
    {
      signature: {
        r: 0n,
        s: 1n,
        yParity: 0,
      },
    },
  )
  expect(envelope).toMatchInlineSnapshot(`
    {
      "r": 0n,
      "s": 1n,
      "to": "0x0000000000000000000000000000000000000000",
      "type": "legacy",
      "v": 27,
      "value": 69n,
    }
  `)
  const serialized = TransactionEnvelopeLegacy.serialize(envelope)
  const envelope2 = TransactionEnvelopeLegacy.from(serialized)
  expect(envelope2).toEqual(envelope)
  const envelope3 = TransactionEnvelopeLegacy.from(serialized, {
    signature: {
      r: 1n,
      s: 0n,
      yParity: 1,
    },
  })
  expect(envelope3).toEqual({ ...envelope, r: 1n, s: 0n, v: 28 })
})
