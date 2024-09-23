import { Mnemonic } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Mnemonic.random(Mnemonic.english).split(' ')).toHaveLength(12)
})

test('options: strength', () => {
  expect(
    Mnemonic.random(Mnemonic.english, { strength: 256 }).split(' '),
  ).toHaveLength(24)
})
