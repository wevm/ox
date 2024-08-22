import { hexToBytes } from '../bytes/toBytes.js'
import { createCursor } from '../cursor.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'hex' | 'bytes'

/**
 * Transforms Ox-shaped {@link Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from({ data: '0xdeadbeef' })

 * const data = Blobs.to({ blobs })
 * // '0xdeadbeef'
 * ```
 */
export function fromBlobs<
  const blobs extends Blobs<Hex> | Blobs<Bytes>,
  to extends To =
    | (blobs extends Blobs<Hex> ? 'hex' : never)
    | (blobs extends Blobs<Bytes> ? 'bytes' : never),
>(parameters: fromBlobs.Parameters<blobs, to>): fromBlobs.ReturnType<to> {
  const to =
    parameters.to ?? (typeof parameters.blobs[0] === 'string' ? 'hex' : 'bytes')
  const blobs = (
    typeof parameters.blobs[0] === 'string'
      ? parameters.blobs.map((x) => hexToBytes(x as Hex))
      : parameters.blobs
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
  return (to === 'hex' ? bytesToHex(trimmedData) : trimmedData) as never
}

export declare namespace fromBlobs {
  type Parameters<
    blobs extends Blobs<Hex> | Blobs<Bytes> = Blobs<Hex> | Blobs<Bytes>,
    to extends To | undefined = undefined,
  > = {
    /** Blobs to transform to data. */
    blobs: blobs | Blobs<Hex> | Blobs<Bytes>
    to?: to | To | undefined
  }

  type ReturnType<to extends To> =
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'hex' ? Hex : never)

  type ErrorType =
    | bytesToHex.ErrorType
    | hexToBytes.ErrorType
    | createCursor.ErrorType
    | GlobalErrorType
}

fromBlobs.parseError = (error: unknown) => error as fromBlobs.ErrorType
