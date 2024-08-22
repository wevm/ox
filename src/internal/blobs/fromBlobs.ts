import { hexToBytes } from '../bytes/toBytes.js'
import { createCursor } from '../cursor.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'Hex' | 'Bytes'

/**
 * Transforms Ox-shaped {@link Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.to(blobs)
 * // '0xdeadbeef'
 * ```
 */
export function fromBlobs<
  const blobs extends Blobs<Hex> | Blobs<Bytes>,
  to extends To =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs_: blobs | Blobs<Hex> | Blobs<Bytes>,
  to_?: to | To | undefined,
): fromBlobs.ReturnType<to> {
  const to = to_ ?? (typeof blobs_[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => hexToBytes(x as Hex))
      : blobs_
  ) as Bytes[]

  const length = blobs.reduce((length, blob) => length + blob.length, 0)
  const data = createCursor(new Uint8Array(length))
  let active = true

  for (const blob of blobs) {
    const cursor = createCursor(blob)
    while (active && cursor.position < blob.length) {
      // First byte will be a zero 0x00 byte – we can skip.
      cursor.incrementPosition(1)

      let consume = 31
      if (blob.length - cursor.position < 31)
        consume = blob.length - cursor.position

      for (const _ in Array.from({ length: consume })) {
        const byte = cursor.readByte()
        const isTerminator =
          byte === 0x80 && !cursor.inspectBytes(cursor.remaining).includes(0x80)
        if (isTerminator) {
          active = false
          break
        }
        data.pushByte(byte)
      }
    }
  }

  const trimmedData = data.bytes.slice(0, data.position)
  return (to === 'Hex' ? bytesToHex(trimmedData) : trimmedData) as never
}

export declare namespace fromBlobs {
  type ReturnType<to extends To = 'Hex'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | bytesToHex.ErrorType
    | hexToBytes.ErrorType
    | createCursor.ErrorType
    | GlobalErrorType
}

fromBlobs.parseError = (error: unknown) => error as fromBlobs.ErrorType

/**
 * Transforms Ox-shaped {@link Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')

 * const data = Blobs.toHex(blobs)
 * // '0xdeadbeef'
 * ```
 */
export function blobsToHex(
  blobs: Blobs<Hex> | Blobs<Bytes>,
): blobsToHex.ReturnType {
  return fromBlobs(blobs, 'Hex')
}

export declare namespace blobsToHex {
  type ReturnType = fromBlobs.ReturnType<'Hex'>
  type ErrorType = fromBlobs.ErrorType | GlobalErrorType
}

blobsToHex.parseError = (error: unknown) => error as blobsToHex.ErrorType

/**
 * Transforms Ox-shaped {@link Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')

 * const data = Blobs.toBytes(blobs)
 * // Uint8Array [ 13, 174, 190, 239 ]
 * ```
 */
export function blobsToBytes(
  blobs: Blobs<Hex> | Blobs<Bytes>,
): blobsToBytes.ReturnType {
  return fromBlobs(blobs, 'Bytes')
}

export declare namespace blobsToBytes {
  type ReturnType = fromBlobs.ReturnType<'Bytes'>
  type ErrorType = fromBlobs.ErrorType | GlobalErrorType
}

blobsToBytes.parseError = (error: unknown) => error as blobsToBytes.ErrorType
