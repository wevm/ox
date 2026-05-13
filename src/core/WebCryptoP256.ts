import { p256 } from '@noble/curves/nist.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import {
  formatSignature,
  normalizePublicKey,
  normalizeSignature,
} from './internal/cryptoIo.js'
import type { Compute } from './internal/types.js'
import * as PublicKey from './PublicKey.js'
import * as Signature from './Signature.js'

/** secp256r1 / P-256 curve order. */
const N = p256.Point.CURVE().n

/**
 * Generates an ECDSA P256 key pair that includes:
 *
 * - a `privateKey` of type [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 *
 * - a `publicKey` of type {@link ox#PublicKey.PublicKey}
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 * ```
 *
 * @param options - Options for creating the key pair.
 * @returns The key pair.
 */
export async function createKeyPair(
  options: createKeyPair.Options = {},
): Promise<createKeyPair.ReturnType> {
  const { extractable = false } = options
  const keypair = await globalThis.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    extractable,
    ['sign', 'verify'],
  )
  const publicKey_raw = await globalThis.crypto.subtle.exportKey(
    'raw',
    keypair.publicKey,
  )
  const publicKey = PublicKey.fromBytes(new Uint8Array(publicKey_raw))
  return {
    privateKey: keypair.privateKey,
    publicKey,
  }
}

export declare namespace createKeyPair {
  type Options = {
    /** A boolean value indicating whether it will be possible to export the private key using `globalThis.crypto.subtle.exportKey()`. */
    extractable?: boolean | undefined
  }

  type ReturnType = Compute<{
    privateKey: CryptoKey
    publicKey: PublicKey.PublicKey
  }>

  type ErrorType = PublicKey.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Generates an ECDH P256 key pair for key agreement that includes:
 *
 * - a `privateKey` of type [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 * - a `publicKey` of type {@link ox#PublicKey.PublicKey}
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPairECDH()
 * ```
 *
 * @param options - Options for creating the key pair.
 * @returns The key pair.
 */
export async function createKeyPairECDH(
  options: createKeyPairECDH.Options = {},
): Promise<createKeyPairECDH.ReturnType> {
  const { extractable = false } = options
  const keypair = await globalThis.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    extractable,
    ['deriveKey', 'deriveBits'],
  )
  const publicKey_raw = await globalThis.crypto.subtle.exportKey(
    'raw',
    keypair.publicKey,
  )
  const publicKey = PublicKey.fromBytes(new Uint8Array(publicKey_raw))
  return {
    privateKey: keypair.privateKey,
    publicKey,
  }
}

export declare namespace createKeyPairECDH {
  type Options = {
    /** A boolean value indicating whether it will be possible to export the private key using `globalThis.crypto.subtle.exportKey()`. */
    extractable?: boolean | undefined
  }

  type ReturnType = Compute<{
    privateKey: CryptoKey
    publicKey: PublicKey.PublicKey
  }>

  type ErrorType = PublicKey.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes a shared secret using ECDH (Elliptic Curve Diffie-Hellman) between a private key and a public key using Web Crypto APIs.
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { privateKey: privateKeyA } = await WebCryptoP256.createKeyPairECDH()
 * const { publicKey: publicKeyB } = await WebCryptoP256.createKeyPairECDH()
 *
 * const sharedSecret = await WebCryptoP256.getSharedSecret({
 *   privateKey: privateKeyA,
 *   publicKey: publicKeyB
 * })
 * ```
 *
 * @param options - The options to compute the shared secret.
 * @returns The computed shared secret.
 */
export async function getSharedSecret<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: getSharedSecret.Options<as>,
): Promise<getSharedSecret.ReturnType<as>> {
  const { as = 'Hex', privateKey, publicKey } = options

  if (privateKey.algorithm.name === 'ECDSA') {
    throw new InvalidPrivateKeyAlgorithmError()
  }

  const publicKeyCrypto = await globalThis.crypto.subtle.importKey(
    'raw',
    PublicKey.toBytes(normalizePublicKey(publicKey)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )

  const sharedSecretBuffer = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKeyCrypto,
    },
    privateKey,
    256, // 32 bytes * 8 bits/byte
  )

  const sharedSecret = new Uint8Array(sharedSecretBuffer)
  if (as === 'Hex') return Hex.fromBytes(sharedSecret) as never
  return sharedSecret as never
}

export declare namespace getSharedSecret {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned shared secret.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /**
     * Private key to use for the shared secret computation (must be a CryptoKey for ECDH).
     */
    privateKey: CryptoKey
    /**
     * Public key to use for the shared secret computation.
     */
    publicKey: Hex.Hex | Bytes.Bytes | PublicKey.Parts<boolean>
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | PublicKey.toBytes.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Signs a payload with the provided `CryptoKey` private key and returns a P256 signature.
 *
 * @remarks
 * Web Crypto may emit ECDSA signatures with `s` in the upper half of the curve
 * order. ox always normalizes the result to a low-S signature so it round-trips
 * with {@link ox#WebCryptoP256.(verify:function)} and other ox ECDSA verifiers.
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { privateKey } = await WebCryptoP256.createKeyPair()
 *
 * const signature = await WebCryptoP256.sign({
 *   payload: '0xdeadbeef',
 *   privateKey,
 * })
 * // @log: '0x1512314423...5161235512'
 * ```
 *
 * @param options - Options for signing the payload.
 * @returns The P256 ECDSA {@link ox#Signature.Signature} (always low-S normalized).
 */
export async function sign<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: sign.Options<as>,
): Promise<sign.ReturnType<as>> {
  const { as = 'Hex', payload, privateKey } = options
  const signature = await globalThis.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    Bytes.from(payload),
  )
  const signature_bytes = Bytes.fromArray(new Uint8Array(signature))
  // Fixed-width 32-byte big-endian r and s.
  const r = Bytes.toBigInt(Bytes.slice(signature_bytes, 0, 32))
  let s = Bytes.toBigInt(Bytes.slice(signature_bytes, 32, 64))
  if (s > N / 2n) s = N - s
  const sig = Signature.fromParts<false>({ r, s })
  return formatSignature(sig, as) as never
}

export declare namespace sign {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned signature.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Payload to sign. */
    payload: Hex.Hex | Bytes.Bytes
    /** ECDSA private key. */
    privateKey: CryptoKey
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Signature.Signature<false> : never)

  type ErrorType = Bytes.fromArray.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 *
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
 * const signature = await WebCryptoP256.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = await WebCryptoP256.verify({
 *   payload: '0xdeadbeef',
 *   publicKey,
 *   signature,
 * })
 * // @log: true
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export async function verify(options: verify.Options): Promise<boolean> {
  const { lowS = true, payload } = options
  const signature = normalizeSignature(options.signature)
  const compact = Bytes.fromHex(signature.slice(0, 130) as Hex.Hex)

  // Reject high-S signatures if lowS is enabled.
  if (lowS) {
    const s = Bytes.toBigInt(Bytes.slice(compact, 32, 64))
    if (s > N / 2n) return false
  }

  const publicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    PublicKey.toBytes(normalizePublicKey(options.publicKey)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  )

  return await globalThis.crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    publicKey,
    compact,
    Bytes.from(payload),
  )
}

export declare namespace verify {
  type Options = {
    /** If set to `true`, only low-S signatures will be accepted. @default true */
    lowS?: boolean | undefined
    /**
     * Public key that signed the payload.
     *
     * Accepts a canonical {@link ox#PublicKey.PublicKey} (hex), a `Uint8Array`
     * (SEC1 encoding), or a structured {@link ox#PublicKey.Parts}.
     */
    publicKey: Hex.Hex | Bytes.Bytes | PublicKey.Parts<boolean>
    /**
     * Signature of the payload.
     *
     * Accepts a canonical {@link ox#Signature.Signature} (hex), a
     * `Uint8Array`, or a structured {@link ox#Signature.Parts}.
     */
    signature: Hex.Hex | Bytes.Bytes | Signature.Parts<false>
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Thrown when an ECDSA private key is supplied to {@link ox#WebCryptoP256.(getSharedSecret:function)}.
 * Only ECDH private keys are valid for shared secret derivation.
 */
export class InvalidPrivateKeyAlgorithmError extends Errors.BaseError {
  override readonly name = 'WebCryptoP256.InvalidPrivateKeyAlgorithmError'

  constructor() {
    super(
      'privateKey is not compatible with ECDH. Please use `createKeyPairECDH` to create an ECDH key.',
    )
  }
}
