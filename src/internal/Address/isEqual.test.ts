import { Address } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Address.isEqual(
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
      '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
    ),
  ).toBeTruthy()
  expect(
    Address.isEqual(
      '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
      '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    ),
  ).toBeTruthy()
  expect(
    Address.isEqual(
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
    ),
  ).toBeTruthy()
  expect(
    Address.isEqual(
      '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
      '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f',
    ),
  ).toBeFalsy()
})

test('error: invalid address', () => {
  expect(() =>
    Address.isEqual(
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az',
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
  expect(() =>
    Address.isEqual(
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
      '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff',
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})
