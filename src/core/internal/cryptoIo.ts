import type * as Bytes from '../Bytes.js'
import type * as Hex from '../Hex.js'
import * as PublicKey from '../PublicKey.js'
import * as Signature from '../Signature.js'

/**
 * Coerces a serialized or structured signature input into a structured
 * {@link ox#Signature.Signature} object.
 *
 * Accepts the existing structured form (pass-through), a hex string, or a
 * `Uint8Array` (delegates to `Signature.fromHex` / `Signature.fromBytes`).
 *
 * @internal
 */
export function normalizeSignature<recovered extends boolean = boolean>(
  value:
    | Hex.Hex
    | Bytes.Bytes
    | Signature.Signature<recovered>
    | Signature.Signature<boolean>,
): Signature.Signature<recovered> {
  if (typeof value === 'string')
    return Signature.fromHex(value) as Signature.Signature<recovered>
  if (value instanceof Uint8Array)
    return Signature.fromBytes(value) as Signature.Signature<recovered>
  return value as Signature.Signature<recovered>
}

/**
 * Coerces a serialized or structured public key input into a structured
 * {@link ox#PublicKey.PublicKey}.
 *
 * @internal
 */
export function normalizePublicKey<compressed extends boolean = boolean>(
  value: Hex.Hex | Bytes.Bytes | PublicKey.PublicKey<compressed>,
): PublicKey.PublicKey<compressed> {
  if (typeof value === 'string')
    return PublicKey.fromHex(value) as PublicKey.PublicKey<compressed>
  if (value instanceof Uint8Array)
    return PublicKey.fromBytes(value) as PublicKey.PublicKey<compressed>
  return value
}

/**
 * Formats a structured {@link ox#Signature.Signature} as the requested
 * representation: the structured object (`'Object'`), serialized hex
 * (`'Hex'`), or serialized bytes (`'Bytes'`).
 *
 * @internal
 */
export function formatSignature(
  signature: Signature.Signature<boolean>,
  as: 'Hex' | 'Bytes' | 'Object',
): unknown {
  if (as === 'Hex') return Signature.toHex(signature)
  if (as === 'Bytes') return Signature.toBytes(signature)
  return signature
}

/**
 * Formats a structured {@link ox#PublicKey.PublicKey} as the requested
 * representation.
 *
 * @internal
 */
export function formatPublicKey(
  publicKey: PublicKey.PublicKey<boolean>,
  as: 'Hex' | 'Bytes' | 'Object',
): unknown {
  if (as === 'Hex') return PublicKey.toHex(publicKey)
  if (as === 'Bytes') return PublicKey.toBytes(publicKey)
  return publicKey
}
