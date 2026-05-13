import * as Bytes from '../Bytes.js'
import type * as Hex from '../Hex.js'
import * as PublicKey from '../PublicKey.js'
import * as Signature from '../Signature.js'

/**
 * Coerces a serialized signature input into a canonical
 * {@link ox#Signature.Signature} (hex). Accepts a hex string, `Uint8Array`,
 * or a structured {@link ox#Signature.Parts} object.
 *
 * @internal
 */
export function normalizeSignature(
  value: Hex.Hex | Bytes.Bytes | Signature.Parts<boolean>,
): Signature.Signature<boolean> {
  if (typeof value === 'string') return Signature.fromHex(value)
  if (value instanceof Uint8Array) return Signature.fromBytes(value)
  return Signature.fromParts(value as Signature.Parts) as Signature.Signature
}

/**
 * Coerces a serialized public key input into a canonical
 * {@link ox#PublicKey.PublicKey} (hex). Accepts a hex string, `Uint8Array`,
 * or a structured {@link ox#PublicKey.Parts} object.
 *
 * @internal
 */
export function normalizePublicKey(
  value: Hex.Hex | Bytes.Bytes | PublicKey.Parts<boolean>,
): PublicKey.PublicKey<boolean> {
  if (typeof value === 'string') return PublicKey.fromHex(value)
  if (value instanceof Uint8Array) return PublicKey.fromBytes(value)
  // Cast through `any` so that the discriminated `Parts<true | false>` union
  // is accepted by `fromParts` whose generic narrows the input shape.
  return PublicKey.fromParts(value as PublicKey.Parts<false>)
}

/**
 * Formats a canonical {@link ox#Signature.Signature} as the requested
 * representation: serialized hex (`'Hex'`, default) or serialized bytes
 * (`'Bytes'`).
 *
 * @internal
 */
export function formatSignature(
  signature: Signature.Signature<boolean>,
  as: 'Hex' | 'Bytes',
): unknown {
  if (as === 'Bytes') return Signature.toBytes(signature)
  return signature
}

/**
 * Formats a canonical {@link ox#PublicKey.PublicKey} as the requested
 * representation: serialized hex (`'Hex'`, default) or serialized bytes
 * (`'Bytes'`).
 *
 * @internal
 */
export function formatPublicKey(
  publicKey: PublicKey.PublicKey<boolean>,
  as: 'Hex' | 'Bytes',
): unknown {
  if (as === 'Bytes') return PublicKey.toBytes(publicKey)
  return publicKey
}
