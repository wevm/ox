import { hexToBytes } from '../bytes/toBytes.js'
import {
  bytesPerBlob,
  bytesPerFieldElement,
  fieldElementsPerBlob,
  maxBytesPerTransaction,
} from '../constants/blob.js'
import { createCursor } from '../cursor.js'
import { size } from '../data/size.js'
import { BlobSizeTooLargeError, EmptyBlobError } from '../errors/blob.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Transforms arbitrary data to {@link Types#Blobs}.
 *
 * @example
 * ```ts
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * ```
 *
 * @alias ox!Blobs.toBlobs:function(1)
 */
export function toBlobs<
  const data extends Hex | Bytes,
  as extends 'Hex' | 'Bytes' =
    | (data extends Hex ? 'Hex' : never)
    | (data extends Bytes ? 'Bytes' : never),
>(
  data_: data | Hex | Bytes,
  options: toBlobs.Options<as> = {},
): toBlobs.ReturnType<as> {
  const as = options.as ?? (typeof data_ === 'string' ? 'Hex' : 'Bytes')
  const data = (typeof data_ === 'string' ? hexToBytes(data_) : data_) as Bytes

  const size_ = size(data)
  if (!size_) throw new EmptyBlobError()
  if (size_ > maxBytesPerTransaction)
    throw new BlobSizeTooLargeError({
      maxSize: maxBytesPerTransaction,
      size: size_,
    })

  const blobs = []

  let active = true
  let position = 0
  while (active) {
    const blob = createCursor(new Uint8Array(bytesPerBlob))

    let size = 0
    while (size < fieldElementsPerBlob) {
      const bytes = data.slice(position, position + (bytesPerFieldElement - 1))

      // Push a zero byte so the field element doesn't overflow the BLS modulus.
      blob.pushByte(0x00)

      // Push the current segment of data bytes.
      blob.pushBytes(bytes)

      // If we detect that the current segment of data bytes is less than 31 bytes,
      // we can stop processing and push a terminator byte to indicate the end of the blob.
      if (bytes.length < 31) {
        blob.pushByte(0x80)
        active = false
        break
      }

      size++
      position += 31
    }

    blobs.push(blob)
  }

  return (
    as === 'Bytes'
      ? blobs.map((x) => x.bytes)
      : blobs.map((x) => bytesToHex(x.bytes))
  ) as never
}

export declare namespace toBlobs {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)

  type ErrorType =
    | BlobSizeTooLargeError
    | EmptyBlobError
    | hexToBytes.ErrorType
    | bytesToHex.ErrorType
    | createCursor.ErrorType
    | size.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
toBlobs.parseError = (error: unknown) => error as toBlobs.ErrorType
