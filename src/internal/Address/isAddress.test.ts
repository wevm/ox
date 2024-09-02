import { Address } from 'ox'
import { expect, test } from 'vitest'

test('checks if address is valid', () => {
  expect(
    Address.isAddress('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
  ).toBeFalsy()
  expect(Address.isAddress('x')).toBeFalsy()
  expect(Address.isAddress('0xa')).toBeFalsy()
  expect(
    Address.isAddress('0xa0cf798816d4b9b9866b5330eea46a18382f251e'),
  ).toBeTruthy()
  expect(
    Address.isAddress('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
  ).toBeFalsy()
  expect(
    Address.isAddress('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'),
  ).toBeFalsy()
  expect(
    Address.isAddress('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
  ).toBeFalsy()
})
