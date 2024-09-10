import { Bytes_fromHex } from '../Bytes/from.js'
import { Bytes_size } from '../Bytes/size.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { createCursor } from '../cursor.js'
import {
  Blobs_bytesPerBlob,
  Blobs_bytesPerFieldElement,
  Blobs_fieldElementsPerBlob,
  Blobs_maxBytesPerTransaction,
} from './constants.js'
import { Blobs_BlobSizeTooLargeError, Blobs_EmptyBlobError } from './errors.js'

/**
 * Transforms arbitrary data to {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * ```
 *
 * @example
 * ### Creating Blobs from a UTF-8 String
 *
 * An example of creating Blobs from a UTF-8 string using {@link ox#Hex.from}:
 *
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from(Hex.from('Hello world!'))
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Blobs with the `as` option.
 *
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef', { as: 'Bytes' })
 * //    ^?
 *
 *
 * ```
 *
 * @param data - The data to convert to {@link ox#Blobs.Blobs}.
 * @param options -
 * @returns The {@link ox#Blobs.Blobs}.
 */
export function Blobs_from<
  const data extends Hex | Bytes,
  as extends 'Hex' | 'Bytes' =
    | (data extends Hex ? 'Hex' : never)
    | (data extends Bytes ? 'Bytes' : never),
>(
  data: data | Hex | Bytes,
  options: Blobs_from.Options<as> = {},
): Blobs_from.ReturnType<as> {
  const as = options.as ?? (typeof data === 'string' ? 'Hex' : 'Bytes')
  const data_ = (typeof data === 'string' ? Bytes_fromHex(data) : data) as Bytes

  const size_ = Bytes_size(data_)
  if (!size_) throw new Blobs_EmptyBlobError()
  if (size_ > Blobs_maxBytesPerTransaction)
    throw new Blobs_BlobSizeTooLargeError({
      maxSize: Blobs_maxBytesPerTransaction,
      size: size_,
    })

  const blobs = []

  let active = true
  let position = 0
  while (active) {
    const blob = createCursor(new Uint8Array(Blobs_bytesPerBlob))

    let size = 0
    while (size < Blobs_fieldElementsPerBlob) {
      const bytes = data_.slice(
        position,
        position + (Blobs_bytesPerFieldElement - 1),
      )

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
      : blobs.map((x) => Hex_fromBytes(x.bytes))
  ) as never
}

export declare namespace Blobs_from {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)

  type ErrorType =
    | Blobs_BlobSizeTooLargeError
    | Blobs_EmptyBlobError
    | Bytes_fromHex.ErrorType
    | Hex_fromBytes.ErrorType
    | createCursor.ErrorType
    | Bytes_size.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Blobs_from.parseError = (error: unknown) => error as Blobs_from.ErrorType
