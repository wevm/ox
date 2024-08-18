import { Address } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'

test('default', () => {
  const address = Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
  expectTypeOf(address).toEqualTypeOf<Address.Address>()
  expect(address).toMatchInlineSnapshot(
    `"0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"`,
  )
})

test('options: checksum', () => {
  expect(
    Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e', {
      checksum: false,
    }),
  ).toMatchInlineSnapshot(`"0xa0cf798816d4b9b9866b5330eea46a18382f251e"`)
})

test('error: invalid address input', () => {
  expect(() => Address.from('0xa')).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xa" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})

test('error: invalid address checksum', () => {
  expect(() =>
    Address.from('0xA0Cf798816D4b9b9866b5330Eea46a18382f251e'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xA0Cf798816D4b9b9866b5330Eea46a18382f251e" is invalid.

    Details: Address does not match its checksum counterpart.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})
