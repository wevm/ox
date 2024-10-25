import * as Hex from '../../Hex.js'
import * as Errors from '../../Errors.js'

/** Thrown when the size of a storage key is invalid. */
export class InvalidStorageKeySizeError extends Errors.BaseError {
  override readonly name = 'AccessList.InvalidStorageKeySizeError'
  constructor({ storageKey }: { storageKey: Hex.Hex }) {
    super(
      `Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Hex.size(storageKey)} bytes.`,
    )
  }
}
