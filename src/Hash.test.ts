import { Hash } from 'ox'
import { expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Hash)).toMatchInlineSnapshot(`
    [
      "keccak256",
      "ripemd160",
      "sha256",
      "validate",
    ]
  `)
})
