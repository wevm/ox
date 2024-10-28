import type { Hex } from '../Hex/types.js'
import { Kzg_versionedHashVersion } from '../Kzg/constants.js'

import { Errors } from '../../Errors.js'

/** Thrown when the blob size is too large. */
export class Blobs_BlobSizeTooLargeError extends Errors.BaseError {
  override readonly name = 'Blobs.BlobSizeTooLargeError'
  constructor({ maxSize, size }: { maxSize: number; size: number }) {
    super('Blob size is too large.', {
      metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size} bytes`],
    })
  }
}

/** Thrown when the blob is empty. */
export class Blobs_EmptyBlobError extends Errors.BaseError {
  override readonly name = 'Blobs.EmptyBlobError'
  constructor() {
    super('Blob data must not be empty.')
  }
}

/** Thrown when the blob versioned hashes are empty. */
export class Blobs_EmptyBlobVersionedHashesError extends Errors.BaseError {
  override readonly name = 'Blobs.EmptyBlobVersionedHashesError'
  constructor() {
    super('Blob versioned hashes must not be empty.')
  }
}

/** Thrown when the blob versioned hash size is invalid. */
export class Blobs_InvalidVersionedHashSizeError extends Errors.BaseError {
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

/** Thrown when the blob versioned hash version is invalid. */
export class Blobs_InvalidVersionedHashVersionError extends Errors.BaseError {
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
