import { BaseError } from '../Errors/base.js'

export class Address_InvalidAddressError<
  cause extends Address_InvalidInputError | Address_InvalidChecksumError =
    | Address_InvalidInputError
    | Address_InvalidChecksumError,
> extends BaseError<cause> {
  override readonly name = 'Address.InvalidAddressError'

  constructor({ address, cause }: { address: string; cause: cause }) {
    super(`Address "${address}" is invalid.`, {
      cause,
      docsPath: '/errors#invalidaddresserror',
    })
  }
}

export class Address_InvalidInputError extends BaseError {
  override readonly name = 'Address.InvalidInputError'

  constructor() {
    super('Address is not a 20 byte (40 hexadecimal character) value.')
  }
}

export class Address_InvalidChecksumError extends BaseError {
  override readonly name = 'Address.InvalidChecksumError'

  constructor() {
    super('Address does not match its checksum counterpart.')
  }
}
