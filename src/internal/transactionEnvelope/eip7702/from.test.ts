import { TransactionEnvelopeEip7702 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "authorizationList": [],
        "chainId": 1,
        "type": "eip7702",
      }
    `)
    const serialized = TransactionEnvelopeEip7702.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip7702.from(serialized)
    expect(envelope2).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "authorizationList": [],
        "chainId": 1,
        "r": 0n,
        "s": 1n,
        "type": "eip7702",
        "yParity": 0,
      }
    `)
    const serialized = TransactionEnvelopeEip7702.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip7702.from(serialized)
    expect(envelope2).toEqual(envelope)
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip7702.from(
    {
      authorizationList: [],
      chainId: 1,
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
      "authorizationList": [],
      "chainId": 1,
      "r": 0n,
      "s": 1n,
      "type": "eip7702",
      "yParity": 0,
    }
  `)
  const serialized = TransactionEnvelopeEip7702.serialize(envelope)
  const envelope2 = TransactionEnvelopeEip7702.from(serialized)
  expect(envelope2).toEqual(envelope)
})
