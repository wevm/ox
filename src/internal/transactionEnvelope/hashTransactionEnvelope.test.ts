import { TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const envelope = TransactionEnvelope.from({
    chainId: 1,
    to: '0x0000000000000000000000000000000000000000',
    type: 'eip1559',
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x03ebe0b15f1ae8cc6d633445ba9b51d7dd5a6fe4b5c36f17b62b33c21421ada7"`,
  )
})
