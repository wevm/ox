import { Mnemonic } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const privateKey = Mnemonic.toPrivateKey(
    'test test test test test test test test test test test junk',
  )
  expect(privateKey).toMatchInlineSnapshot(
    `"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"`,
  )
})

test('options: as: bytes', () => {
  const privateKey = Mnemonic.toPrivateKey(
    'test test test test test test test test test test test junk',
    { as: 'Bytes' },
  )
  expect(privateKey).toMatchInlineSnapshot(
    `
    Uint8Array [
      172,
      9,
      116,
      190,
      195,
      154,
      23,
      227,
      107,
      164,
      166,
      180,
      210,
      56,
      255,
      148,
      75,
      172,
      180,
      120,
      203,
      237,
      94,
      252,
      174,
      120,
      77,
      123,
      244,
      242,
      255,
      128,
    ]
  `,
  )
})
