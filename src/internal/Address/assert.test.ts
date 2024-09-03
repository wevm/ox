import { Address } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  Address.assert('0x0000000000000000000000000000000000000000')
  Address.assert('0xa0cf798816d4b9b9866b5330eea46a18382f251e')

  expect(() =>
    Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac" is invalid.

    Details: Address does not match its checksum counterpart.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)

  expect(() => Address.assert('x')).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "x" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)

  expect(() => Address.assert('0xa')).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xa" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)

  expect(() =>
    Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)

  expect(() =>
    Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)

  expect(() =>
    Address.assert('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})
