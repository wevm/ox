import { p256 as noble_p256 } from '@noble/curves/nist.js'
import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import {
  formatPublicKey,
  formatSignature,
  normalizePublicKey,
  normalizeSignature,
} from './internal/cryptoIo.js'
import * as Entropy from './internal/entropy.js'
import {
  fromRecoveredBytes,
  toCompactBytes,
  toRecoveredBytes,
} from './internal/signature.js'
import * as PublicKey from './PublicKey.js'
import type * as Signature from './Signature.js'

/** Re-export of noble/curves P256 utilities. */
export const noble = noble_p256

/**
 * Creates a new P256 ECDSA key pair consisting of a private key and its corresponding public key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const { privateKey, publicKey } = P256.createKeyPair()
 * ```
 *
 * @param options - The options to generate the key pair.
 * @returns The generated key pair containing both private and public keys.
 */
export function createKeyPair<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: createKeyPair.Options<as> = {},
): createKeyPair.ReturnType<as> {
  const { as = 'Hex' } = options
  const privateKey = randomPrivateKey({ as })
  const publicKey = getPublicKey({ privateKey })

  return {
    privateKey: privateKey as never,
    publicKey,
  }
}

export declare namespace createKeyPair {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> = {
    privateKey:
      | (as extends 'Bytes' ? Bytes.Bytes : never)
      | (as extends 'Hex' ? Hex.Hex : never)
    publicKey: PublicKey.PublicKey
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | PublicKey.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the P256 ECDSA public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const publicKey = P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<as extends 'Hex' | 'Bytes' | 'Object' = 'Object'>(
  options: getPublicKey.Options<as>,
): getPublicKey.ReturnType<as> {
  const { as = 'Object', privateKey } = options
  const bytes = noble_p256.getPublicKey(Bytes.from(privateKey), false)
  const publicKey = PublicKey.fromBytes(bytes)
  return formatPublicKey(publicKey, as) as never
}

export declare namespace getPublicKey {
  type Options<as extends 'Hex' | 'Bytes' | 'Object' = 'Object'> = {
    /**
     * Format of the returned public key.
     * @default 'Object'
     */
    as?: as | 'Hex' | 'Bytes' | 'Object' | undefined
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes' | 'Object'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Object' ? PublicKey.PublicKey : never)

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes a shared secret using ECDH (Elliptic Curve Diffie-Hellman) between a private key and a public key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const { privateKey: privateKeyA } = P256.createKeyPair()
 * const { publicKey: publicKeyB } = P256.createKeyPair()
 *
 * const sharedSecret = P256.getSharedSecret({
 *   privateKey: privateKeyA,
 *   publicKey: publicKeyB
 * })
 * ```
 *
 * @param options - The options to compute the shared secret.
 * @returns The computed shared secret.
 */
export function getSharedSecret<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: getSharedSecret.Options<as>,
): getSharedSecret.ReturnType<as> {
  const { as = 'Hex', privateKey, publicKey } = options
  const sharedSecret = noble_p256.getSharedSecret(
    Bytes.from(privateKey),
    PublicKey.toBytes(normalizePublicKey(publicKey)),
    true, // compressed
  )
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
     * Private key to use for the shared secret computation.
     */
    privateKey: Hex.Hex | Bytes.Bytes
    /**
     * Public key to use for the shared secret computation.
     *
     * Accepts a structured {@link ox#PublicKey.PublicKey}, a serialized hex
     * string, or a `Uint8Array` (SEC1 encoding).
     */
    publicKey: Hex.Hex | Bytes.Bytes | PublicKey.PublicKey<boolean>
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | PublicKey.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Generates a random P256 ECDSA private key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = noble_p256.utils.randomSecretKey()
  if (as === 'Hex') return Hex.fromBytes(bytes) as never
  return bytes as never
}

export declare namespace randomPrivateKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({
 *   payload: '0xdeadbeef',
 *   privateKey: '0x...'
 * })
 *
 * const publicKey = P256.recoverPublicKey({
 *   // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function recoverPublicKey<
  as extends 'Hex' | 'Bytes' | 'Object' = 'Object',
>(options: recoverPublicKey.Options<as>): recoverPublicKey.ReturnType<as> {
  const { as = 'Object', payload, signature } = options
  const sigBytes = toRecoveredBytes(normalizeSignature<true>(signature))
  const point = noble_p256.Signature.fromBytes(
    sigBytes,
    'recovered',
  ).recoverPublicKey(Bytes.from(payload))
  const publicKey = PublicKey.fromBytes(point.toBytes(false))
  return formatPublicKey(publicKey, as) as never
}

export declare namespace recoverPublicKey {
  type Options<as extends 'Hex' | 'Bytes' | 'Object' = 'Object'> = {
    /**
     * Format of the returned public key.
     * @default 'Object'
     */
    as?: as | 'Hex' | 'Bytes' | 'Object' | undefined
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Signature of the payload.
     *
     * Accepts a structured {@link ox#Signature.Signature}, a serialized hex
     * string, or a `Uint8Array` (65-byte recovered).
     */
    signature: Hex.Hex | Bytes.Bytes | Signature.Signature
  }

  type ReturnType<as extends 'Hex' | 'Bytes' | 'Object'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Object' ? PublicKey.PublicKey : never)

  type ErrorType =
    | PublicKey.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Signs the payload with the provided private key and returns a P256 signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({
 *   // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function sign<as extends 'Hex' | 'Bytes' | 'Object' = 'Object'>(
  options: sign.Options<as>,
): sign.ReturnType<as> {
  const {
    as = 'Object',
    extraEntropy = Entropy.extraEntropy,
    hash,
    payload,
    privateKey,
  } = options
  const sigBytes = noble_p256.sign(
    Bytes.from(payload),
    Bytes.from(privateKey),
    {
      extraEntropy:
        typeof extraEntropy === 'boolean'
          ? extraEntropy
          : Bytes.from(extraEntropy),
      lowS: true,
      prehash: hash === true,
      format: 'recovered',
    },
  )
  const signature = fromRecoveredBytes(sigBytes)
  return formatSignature(signature, as) as never
}

export declare namespace sign {
  type Options<as extends 'Hex' | 'Bytes' | 'Object' = 'Object'> = {
    /**
     * Format of the returned signature.
     * @default 'Object'
     */
    as?: as | 'Hex' | 'Bytes' | 'Object' | undefined
    /**
     * Extra entropy to add to the signing process. Setting to `true` enables hedged
     * (RFC 6979 + extra randomness) signing.
     * @default false
     */
    extraEntropy?: boolean | Hex.Hex | Bytes.Bytes | undefined
    /**
     * If set to `true`, the payload will be hashed (sha256) before being signed.
     */
    hash?: boolean | undefined
    /**
     * Payload to sign.
     */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * ECDSA private key.
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes' | 'Object'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Object' ? Signature.Signature : never)

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const { privateKey, publicKey } = P256.createKeyPair()
 * const signature = P256.sign({
 *   payload: '0xdeadbeef',
 *   privateKey
 * })
 *
 * const verified = P256.verify({
 *   // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function verify(options: verify.Options): boolean {
  const { hash, payload, publicKey, signature } = options
  return noble_p256.verify(
    toCompactBytes(normalizeSignature(signature)),
    Bytes.from(payload),
    PublicKey.toBytes(normalizePublicKey(publicKey)),
    { lowS: true, prehash: hash === true },
  )
}

export declare namespace verify {
  type Options = {
    /** If set to `true`, the payload will be hashed (sha256) before being verified. */
    hash?: boolean | undefined
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Public key that signed the payload.
     *
     * Accepts a structured {@link ox#PublicKey.PublicKey}, a serialized hex
     * string, or a `Uint8Array` (SEC1 encoding).
     */
    publicKey: Hex.Hex | Bytes.Bytes | PublicKey.PublicKey<boolean>
    /**
     * Signature of the payload.
     *
     * Accepts a structured {@link ox#Signature.Signature}, a serialized hex
     * string, or a `Uint8Array`.
     */
    signature: Hex.Hex | Bytes.Bytes | Signature.Signature<boolean>
  }

  type ErrorType = Errors.GlobalErrorType
}
