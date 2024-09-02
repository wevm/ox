import { expect, test } from 'vitest'

import { ContractAddress_getCreateAddress } from './getCreateAddress.js'

test('gets contract address (CREATE)', () => {
  expect(
    ContractAddress_getCreateAddress({
      from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
      nonce: 0n,
    }),
  ).toMatchInlineSnapshot('"0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2"')
})
