// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md#parameters

/** Blob limit per transaction. */
const Blobs_blobsPerTransaction = 6

/** The number of bytes in a BLS scalar field element. */
export const Blobs_bytesPerFieldElement = 32

/** The number of field elements in a blob. */
export const Blobs_fieldElementsPerBlob = 4096

/** The number of bytes in a blob. */
export const Blobs_bytesPerBlob =
  Blobs_bytesPerFieldElement * Blobs_fieldElementsPerBlob

/** Blob bytes limit per transaction. */
export const Blobs_maxBytesPerTransaction =
  Blobs_bytesPerBlob * Blobs_blobsPerTransaction -
  // terminator byte (0x80).
  1 -
  // zero byte (0x00) appended to each field element.
  1 * Blobs_fieldElementsPerBlob * Blobs_blobsPerTransaction
