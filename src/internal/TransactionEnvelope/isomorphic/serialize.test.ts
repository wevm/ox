// TODO: Add `eth_sendRawTransaction` tests.

import { TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'

test('error: unimplemented type', () => {
  expect(() =>
    // @ts-expect-error
    TransactionEnvelope.serialize({ type: '0x05' }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `0x05` is not implemented.]',
  )
})
