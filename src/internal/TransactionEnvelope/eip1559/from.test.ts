import { TransactionEnvelopeEip1559 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const envelope = TransactionEnvelopeEip1559.from({
      chainId: 1,
      maxFeePerGas: 69420n,
      to: '0x0000000000000000000000000000000000000000',
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "maxFeePerGas": 69420n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip1559",
      }
    `)
  }

  {
    const envelope = TransactionEnvelopeEip1559.from({
      chainId: 1,
      maxFeePerGas: 69420n,
      to: '0x0000000000000000000000000000000000000000',
    })
    const serialized = TransactionEnvelopeEip1559.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip1559.from(serialized)
    expect(envelope2).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelopeEip1559.from({
      chainId: 1,
      maxFeePerGas: 69420n,
      to: '0x0000000000000000000000000000000000000000',
      r: 0n,
      s: 1n,
      yParity: 0,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip1559.from(serialized)
    expect(envelope2).toEqual(envelope)
  }
})
