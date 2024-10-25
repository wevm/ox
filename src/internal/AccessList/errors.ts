import { BaseError } from '../Errors/base.js'
import { size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

/** Thrown when the size of a storage key is invalid. */
export class AccessList_InvalidStorageKeySizeError extends BaseError {
  override readonly name = 'AccessList.InvalidStorageKeySizeError'
  constructor({ storageKey }: { storageKey: Hex }) {
    super(
      `Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${size(storageKey)} bytes.`,
    )
  }
}
