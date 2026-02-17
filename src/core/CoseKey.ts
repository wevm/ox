import * as Cbor from './Cbor.js'
import * as Errors from './Errors.js'
import type * as Hex from './Hex.js'
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
 * @param coseKey - The CBOR-encoded COSE_Key.
 * @returns The P256 public key.
 */
export function toPublicKey(coseKey: Hex.Hex): PublicKey.PublicKey {
  const decoded = Cbor.decode<Record<string, unknown>>(coseKey)

  const x = decoded['-2']
  const y = decoded['-3']

  if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array))
    throw new InvalidCoseKeyError()

  return PublicKey.from(new Uint8Array([0x04, ...x, ...y]))
}

export declare namespace toPublicKey {
  type ErrorType =
    | Cbor.decode.ErrorType
    | PublicKey.from.ErrorType
    | InvalidCoseKeyError
    | Errors.GlobalErrorType
}

/** Thrown when a COSE_Key does not contain valid P256 public key coordinates. */
export class InvalidCoseKeyError extends Errors.BaseError {
  override readonly name = 'CoseKey.InvalidCoseKeyError'

  constructor() {
    super('COSE_Key does not contain valid P256 public key coordinates.')
  }
}
