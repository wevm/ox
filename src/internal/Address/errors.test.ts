import { expect, test } from 'vitest'
import {
  InvalidAddressChecksumError,
  InvalidAddressError,
  InvalidAddressInputError,
} from './errors.js'

test('InvalidAddressError', () => {
  {
    const error = new InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new InvalidAddressChecksumError(),
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
    const error = new InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new InvalidAddressInputError(),
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
