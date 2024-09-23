import { Mnemonic } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Mnemonic.validate(
      'buyer zoo end danger ice capable shrug naive twist relief mass bonus',
      Mnemonic.english,
    ),
  ).toBe(true)
  expect(
    Mnemonic.validate(
      'buyer zoo end danger ice capable shrug naive twist relief mass wagmi',
      Mnemonic.english,
    ),
  ).toBe(false)
})
