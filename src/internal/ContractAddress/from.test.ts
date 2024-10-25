import { ContractAddress } from 'ox'
import { expect, test } from 'vitest'

test('gets contract address (CREATE)', () => {
  expect(
    ContractAddress.from({
      from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
      nonce: 0n,
    }),
  ).toMatchInlineSnapshot(`"0xfba3912ca04dd458c843e2ee08967fc04f3579c2"`)
})
