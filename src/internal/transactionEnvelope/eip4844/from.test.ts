import { TransactionEnvelopeEip4844 } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
    })
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelope>()
    expect(envelope).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        ],
        "chainId": 1,
        "type": "eip4844",
      }
    `)
    const serialized = TransactionEnvelopeEip4844.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip4844.from(serialized)
    expect(envelope2).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeEip4844.TransactionEnvelope>()
    expect(envelope).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        ],
        "chainId": 1,
        "r": 0n,
        "s": 1n,
        "type": "eip4844",
        "yParity": 0,
      }
    `)
    const serialized = TransactionEnvelopeEip4844.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip4844.from(serialized)
    expect(envelope2).toEqual(envelope)
  }
})

test('options: signature', () => {
  const envelope = TransactionEnvelopeEip4844.from(
    {
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
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
      "blobVersionedHashes": [
        "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
      ],
      "chainId": 1,
      "r": 0n,
      "s": 1n,
      "type": "eip4844",
      "yParity": 0,
    }
  `)
  const serialized = TransactionEnvelopeEip4844.serialize(envelope)
  const envelope2 = TransactionEnvelopeEip4844.from(serialized)
  expect(envelope2).toEqual(envelope)
})
