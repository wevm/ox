import * as Errors from '../../Errors.js'

/**
 * Thrown when an address is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0x123')
 * // @error: Address.InvalidAddressError: Address `0x123` is invalid.
 * ```
 */
export class InvalidAddressError<
  cause extends InvalidInputError | InvalidChecksumError =
  | InvalidInputError
  | InvalidChecksumError,
> extends Errors.BaseError<cause> {
  override readonly name = 'Address.InvalidAddressError'

  constructor({ address, cause }: { address: string; cause: cause }) {
    super(`Address "${address}" is invalid.`, {
      cause,
      docsPath: '/errors#invalidaddresserror',
    })
  }
}

/** Thrown when an address is not a 20 byte (40 hexadecimal character) value. */
export class InvalidInputError extends Errors.BaseError {
  override readonly name = 'Address.InvalidInputError'

  constructor() {
    super('Address is not a 20 byte (40 hexadecimal character) value.')
  }
}

/** Thrown when an address does not match its checksum counterpart. */
export class InvalidChecksumError extends Errors.BaseError {
  override readonly name = 'Address.InvalidChecksumError'

  constructor() {
    super('Address does not match its checksum counterpart.')
  }
}
