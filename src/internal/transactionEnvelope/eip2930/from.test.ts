import { TransactionEnvelopeEip2930 } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip2930.from({
      accessList: [],
      chainId: 1,
      gasPrice: 69420n,
    })
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip2930.TransactionEnvelope>()
    expect(envelope).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "chainId": 1,
        "gasPrice": 69420n,
        "type": "eip2930",
      }
    `)
  }

  {
    const envelope = TransactionEnvelopeEip2930.from({
      chainId: 1,
      gasPrice: 69420n,
    })
    const serialized = TransactionEnvelopeEip2930.serialize(envelope)
    expect(TransactionEnvelopeEip2930.from(serialized)).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelopeEip2930.from({
      chainId: 1,
      gasPrice: 69420n,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    const serialized = TransactionEnvelopeEip2930.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip2930.from(serialized)
    expect(envelope2).toEqual(envelope)
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip2930.from(
    {
      chainId: 1,
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
  expect(envelope).toMatchInlineSnapshot(`
    {
      "chainId": 1,
      "r": 0n,
      "s": 1n,
      "to": "0x0000000000000000000000000000000000000000",
      "type": "eip2930",
      "value": 69n,
      "yParity": 0,
    }
  `)
  const serialized = TransactionEnvelopeEip2930.serialize(envelope)
  const envelope2 = TransactionEnvelopeEip2930.from(serialized)
  expect(envelope2).toEqual(envelope)
})
