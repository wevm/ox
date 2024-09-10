import type { Hex } from '../Hex/types.js'
import { Kzg_versionedHashVersion } from '../Kzg/constants.js'

import { BaseError } from '../Errors/base.js'

export class Blobs_BlobSizeTooLargeError extends BaseError {
  override readonly name = 'Blobs.BlobSizeTooLargeError'
  constructor({ maxSize, size }: { maxSize: number; size: number }) {
    super('Blob size is too large.', {
      metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size} bytes`],
    })
  }
}

export class Blobs_EmptyBlobError extends BaseError {
  override readonly name = 'Blobs.EmptyBlobError'
  constructor() {
    super('Blob data must not be empty.')
  }
}

export class Blobs_EmptyBlobVersionedHashesError extends BaseError {
  override readonly name = 'Blobs.EmptyBlobVersionedHashesError'
  constructor() {
    super('Blob versioned hashes must not be empty.')
  }
}

export class Blobs_InvalidVersionedHashSizeError extends BaseError {
  override readonly name = 'Blobs.InvalidVersionedHashSizeError'
  constructor({
    hash,
    size,
  }: {
    hash: Hex
    size: number
  }) {
    super(`Versioned hash "${hash}" size is invalid.`, {
      metaMessages: ['Expected: 32', `Received: ${size}`],
    })
  }
}

export class Blobs_InvalidVersionedHashVersionError extends BaseError {
  override readonly name = 'Blobs.InvalidVersionedHashVersionError'
  constructor({
    hash,
    version,
  }: {
    hash: Hex
    version: number
  }) {
    super(`Versioned hash "${hash}" version is invalid.`, {
      metaMessages: [
        `Expected: ${Kzg_versionedHashVersion}`,
        `Received: ${version}`,
      ],
    })
  }
}
