import { Errors } from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import { Hex_size } from '../Hex/size.js'

/** Thrown when the size of a storage key is invalid. */
export class AccessList_InvalidStorageKeySizeError extends Errors.BaseError {
  override readonly name = 'AccessList.InvalidStorageKeySizeError'
  constructor({ storageKey }: { storageKey: Hex.Hex }) {
    super(
      `Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Hex_size(storageKey)} bytes.`,
    )
  }
}
