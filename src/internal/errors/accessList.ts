import { size } from '../hex/size.js'
import type { Hex } from '../types/data.js'
import { BaseError } from './base.js'

export class InvalidStorageKeySizeError extends BaseError {
  override readonly name = 'InvalidStorageKeySizeError'
  constructor({ storageKey }: { storageKey: Hex }) {
    super(
      `Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${size(storageKey)} bytes.`,
    )
  }
}
