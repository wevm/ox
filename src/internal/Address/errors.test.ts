import { expect, test } from 'vitest'
import {
  Address_InvalidAddressError,
  Address_InvalidChecksumError,
  Address_InvalidInputError,
} from './errors.js'

test('InvalidAddressError', () => {
  {
    const error = new Address_InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new Address_InvalidChecksumError(),
    })
    expect(error.message).toMatchInlineSnapshot(
      `
      "Address "0x1234567890123456789012345678901234567890" is invalid.

      Details: Address does not match its checksum counterpart.
      See: https://oxlib.sh/errors#invalidaddresserror"
    `,
    )
  }

  {
    const error = new Address_InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new Address_InvalidInputError(),
    })
    expect(error.message).toMatchInlineSnapshot(
      `
      "Address "0x1234567890123456789012345678901234567890" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror"
    `,
    )
  }
})
