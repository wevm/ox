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
})
