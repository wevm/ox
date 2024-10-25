import type * as Errors from '../../Errors.js'
import { fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import { fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import { createCursor } from '../cursor.js'
import type { Blobs } from './types.js'

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.to(blobs) // [!code focus]
 * // @log: '0xdeadbeef'
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type with second argument.
 *
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.to(blobs, 'Bytes')
 * // @log: Uint8Array [ 13, 174, 190, 239 ]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform.
 * @param to - The type to transform to.
 * @returns The originating data.
 */
export function Blobs_to<
  const blobs extends Blobs<Hex> | Blobs<Bytes>,
  to extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs_: blobs | Blobs<Hex> | Blobs<Bytes>,
  to_?: to | 'Hex' | 'Bytes' | undefined,
): Blobs_to.ReturnType<to> {
  const to = to_ ?? (typeof blobs_[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => fromHex(x as Hex))
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
  return (to === 'Hex' ? fromBytes(trimmedData) : trimmedData) as never
}

export declare namespace Blobs_to {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | fromBytes.ErrorType
    | fromHex.ErrorType
    | createCursor.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Blobs_to.parseError = (error: unknown) => error as Blobs_to.ErrorType

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.toHex(blobs) // [!code focus]
 * // @log: '0xdeadbeef'
 * ```
 */
export function Blobs_toHex(
  blobs: Blobs<Hex> | Blobs<Bytes>,
): Blobs_toHex.ReturnType {
  return Blobs_to(blobs, 'Hex')
}

export declare namespace Blobs_toHex {
  type ReturnType = Blobs_to.ReturnType<'Hex'>
  type ErrorType = Blobs_to.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Blobs_toHex.parseError = (error: unknown) => error as Blobs_toHex.ErrorType

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.toBytes(blobs) // [!code focus]
 * // @log: Uint8Array [ 13, 174, 190, 239 ]
 * ```
 */
export function Blobs_toBytes(
  blobs: Blobs<Hex> | Blobs<Bytes>,
): Blobs_toBytes.ReturnType {
  return Blobs_to(blobs, 'Bytes')
}

export declare namespace Blobs_toBytes {
  type ReturnType = Blobs_to.ReturnType<'Bytes'>
  type ErrorType = Blobs_to.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Blobs_toBytes.parseError = (error: unknown) => error as Blobs_toBytes.ErrorType
