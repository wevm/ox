import { BaseError } from '../errors/base.js'
import { Hex_size } from '../hex/size.js'
import type { Hex } from '../hex/types.js'

export class InvalidStorageKeySizeError extends BaseError {
  override readonly name = 'InvalidStorageKeySizeError'
  constructor({ storageKey }: { storageKey: Hex }) {
    super(
      `Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Hex_size(storageKey)} bytes.`,
    )
  }
}
