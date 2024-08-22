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
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Compute } from '../types/utils.js'

type To = 'hex' | 'bytes'

/**
 * Transforms arbitrary data to {@link Blobs}.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from({ data: Hex.from('hello world') })
 * ```
 */
export function toBlobs<
  const data extends Hex | Bytes,
  to extends To =
    | (data extends Hex ? 'hex' : never)
    | (data extends Bytes ? 'bytes' : never),
>(parameters: toBlobs.Parameters<data, to>): toBlobs.ReturnType<to> {
  const to =
    parameters.to ?? (typeof parameters.data === 'string' ? 'hex' : 'bytes')
  const data = (
    typeof parameters.data === 'string'
      ? hexToBytes(parameters.data)
      : parameters.data
  ) as Bytes

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
    to === 'bytes'
      ? blobs.map((x) => x.bytes)
      : blobs.map((x) => bytesToHex(x.bytes))
  ) as never
}

export declare namespace toBlobs {
  type Parameters<
    data extends Hex | Bytes = Hex | Bytes,
    to extends To | undefined = undefined,
  > = {
    /** Data to transform to a blob. */
    data: data | Hex | Bytes
    /** Return type. */
    to?: to | To | undefined
  }

  type ReturnType<to extends To = To> = Compute<
    to extends 'bytes' ? Blobs<Bytes> : Blobs<Hex>
  >

  type ErrorType =
    | BlobSizeTooLargeError
    | EmptyBlobError
    | hexToBytes.ErrorType
    | bytesToHex.ErrorType
    | createCursor.ErrorType
    | size.ErrorType
    | GlobalErrorType
}

toBlobs.parseError = (error: unknown) => error as toBlobs.ErrorType
