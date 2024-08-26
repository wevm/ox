import { BaseError } from '../errors/base.js'

export class InvalidAddressError<
  cause extends InvalidAddressInputError | InvalidAddressChecksumError =
    | InvalidAddressInputError
    | InvalidAddressChecksumError,
> extends BaseError<cause> {
  override readonly name = 'InvalidAddressError'

  constructor({ address, cause }: { address: string; cause: cause }) {
    super(`Address "${address}" is invalid.`, {
      cause,
      docsPath: '/errors#invalidaddresserror',
    })
  }
}

export class InvalidAddressInputError extends BaseError {
  override readonly name = 'InvalidAddressInputError'

  constructor() {
    super('Address is not a 20 byte (40 hexadecimal character) value.')
  }
}

export class InvalidAddressChecksumError extends BaseError {
  override readonly name = 'InvalidAddressChecksumError'

  constructor() {
    super('Address does not match its checksum counterpart.')
  }
}
