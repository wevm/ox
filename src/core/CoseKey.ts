import * as Bytes from './Bytes.js'
import * as Cbor from './Cbor.js'
import * as Errors from './Errors.js'
import type * as Hex from './Hex.js'
import * as Cursor from './internal/cursor.js'
import * as PublicKey from './PublicKey.js'

/**
 * Converts a P256 {@link ox#PublicKey.PublicKey} to a CBOR-encoded COSE_Key.
 *
 * The COSE_Key uses integer map keys per [RFC 9053](https://datatracker.ietf.org/doc/html/rfc9053):
 * - `1` (kty): `2` (EC2)
 * - `3` (alg): `-7` (ES256)
 * - `-1` (crv): `1` (P-256)
 * - `-2` (x): x coordinate bytes
 * - `-3` (y): y coordinate bytes
 *
 * @example
 * ```ts twoslash
 * import { CoseKey, P256 } from 'ox'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const coseKey = CoseKey.fromPublicKey(publicKey)
 * ```
 *
 * @param publicKey - The P256 public key to convert.
 * @returns The CBOR-encoded COSE_Key as a Hex string.
 */
export function fromPublicKey(publicKey: PublicKey.PublicKey): Hex.Hex {
  const pkBytes = PublicKey.toBytes(publicKey)
  const x = pkBytes.slice(1, 33)
  const y = pkBytes.slice(33, 65)
  return Cbor.encode(
    new Map<number, unknown>([
      [1, 2], // kty: EC2
      [3, -7], // alg: ES256
      [-1, 1], // crv: P-256
      [-2, x], // x coordinate
      [-3, y], // y coordinate
    ]),
  )
}

export declare namespace fromPublicKey {
  type ErrorType =
    | PublicKey.toBytes.ErrorType
    | Cbor.encode.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a CBOR-encoded COSE_Key to a P256 {@link ox#PublicKey.PublicKey}.
 *
 * Accepts the COSE key as either a hex string or raw bytes. When the
 * `returnByteLength` or `returnDecoded` option is set, the function returns an
 * object containing the public key plus the consumed byte length and/or the
 * decoded CBOR map. This is useful for parsing CBOR streams (such as WebAuthn
 * `authenticatorData`) where the COSE key is followed by trailing data.
 *
 * @example
 * ```ts twoslash
 * import { CoseKey, P256 } from 'ox'
 *
 * const { publicKey } = P256.createKeyPair()
 * const coseKey = CoseKey.fromPublicKey(publicKey)
 *
 * const publicKey2 = CoseKey.toPublicKey(coseKey)
 * ```
 *
 * @example
 * ### With Byte Length
 *
 * ```ts twoslash
 * import { CoseKey, P256 } from 'ox'
 *
 * const { publicKey } = P256.createKeyPair()
 * const coseKey = CoseKey.fromPublicKey(publicKey)
 *
 * const { publicKey: pk, byteLength } = CoseKey.toPublicKey(coseKey, {
 *   returnByteLength: true,
 * })
 * ```
 *
 * @param coseKey - The CBOR-encoded COSE_Key as hex or bytes.
 * @param options - Decoding options.
 * @returns The P256 public key, optionally with byte length and decoded CBOR.
 */
export function toPublicKey<options extends toPublicKey.Options = {}>(
  coseKey: Hex.Hex | Uint8Array,
  options: options | toPublicKey.Options = {},
): toPublicKey.ReturnType<options> {
  const bytes = typeof coseKey === 'string' ? Bytes.fromHex(coseKey) : coseKey

  const cursor = Cursor.create(bytes)
  const decoded = Cbor.decode<Record<string, unknown>>(bytes)
  // After Cbor.decode, the cursor's position would advance, but Cbor.decode
  // creates its own cursor internally. Walk the bytes here to compute consumed
  // byte length without re-encoding (which loses optional COSE members).
  cursor.position = 0
  cborSkip(cursor)
  const byteLength = cursor.position

  // Validate COSE_Key header per RFC 9053 (kty=2 EC2, alg=-7 ES256, crv=1 P-256).
  if (decoded['1'] !== 2 || decoded['3'] !== -7 || decoded['-1'] !== 1)
    throw new InvalidCoseKeyError()

  const x = decoded['-2']
  const y = decoded['-3']

  if (
    !(x instanceof Uint8Array) ||
    x.length !== 32 ||
    !(y instanceof Uint8Array) ||
    y.length !== 32
  )
    throw new InvalidCoseKeyError()

  const raw = new Uint8Array(65)
  raw[0] = 0x04
  raw.set(x, 1)
  raw.set(y, 33)
  const publicKey = PublicKey.from(raw)

  if (!options.returnByteLength && !options.returnDecoded)
    return publicKey as toPublicKey.ReturnType<options>

  const result: toPublicKey.ResultObject = { publicKey }
  if (options.returnByteLength) result.byteLength = byteLength
  if (options.returnDecoded) result.decoded = decoded
  return result as toPublicKey.ReturnType<options>
}

export declare namespace toPublicKey {
  type Options = {
    /** Include the consumed byte length of the COSE key in the result. */
    returnByteLength?: boolean | undefined
    /** Include the decoded CBOR map in the result. */
    returnDecoded?: boolean | undefined
  }

  type ResultObject = {
    publicKey: PublicKey.PublicKey
    byteLength?: number
    decoded?: Record<string, unknown>
  }

  type ReturnType<options extends Options = {}> =
    options['returnByteLength'] extends true
      ? ResultObject
      : options['returnDecoded'] extends true
        ? ResultObject
        : PublicKey.PublicKey

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Cbor.decode.ErrorType
    | PublicKey.from.ErrorType
    | InvalidCoseKeyError
    | Errors.GlobalErrorType
}

/**
 * Walks one CBOR element on the cursor, advancing `cursor.position` past it.
 * Supports the major types used by COSE keys: unsigned int (0), negative int
 * (1), byte string (2), text string (3), array (4), map (5).
 *
 * @internal
 */
function cborSkip(cursor: Cursor.Cursor): void {
  const initialByte = cursor.readUint8()
  const majorType = initialByte >> 5
  const additionalInfo = initialByte & 0b00011111
  const length = cborReadLength(cursor, additionalInfo)

  switch (majorType) {
    case 0:
    case 1:
      // value already consumed by `cborReadLength`.
      return
    case 2:
    case 3:
      // skip `length` bytes of byte/text string content
      cursor.readBytes(length)
      return
    case 4:
      for (let i = 0; i < length; i++) cborSkip(cursor)
      return
    case 5:
      for (let i = 0; i < length; i++) {
        cborSkip(cursor)
        cborSkip(cursor)
      }
      return
    case 7:
      return
    default:
      throw new InvalidCoseKeyError()
  }
}

/** @internal */
function cborReadLength(cursor: Cursor.Cursor, ai: number): number {
  if (ai < 24) return ai
  if (ai === 24) return cursor.readUint8()
  if (ai === 25) return cursor.readUint16()
  if (ai === 26) return cursor.readUint32()
  throw new InvalidCoseKeyError()
}

/** Thrown when a COSE_Key does not contain valid P256 public key coordinates. */
export class InvalidCoseKeyError extends Errors.BaseError {
  override readonly name = 'CoseKey.InvalidCoseKeyError'

  constructor() {
    super('COSE_Key does not contain valid P256 public key coordinates.')
  }
}
