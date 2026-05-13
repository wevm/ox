import { secp256k1 } from '@noble/curves/secp256k1.js'
import * as Address from './Address.js'
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
import type { OneOf } from './internal/types.js'
import * as PublicKey from './PublicKey.js'
import type * as Signature from './Signature.js'

/** Re-export of noble/curves secp256k1 utilities. */
export const noble = secp256k1

/**
 * Creates a new secp256k1 ECDSA key pair consisting of a private key and its corresponding public key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const { privateKey, publicKey } = Secp256k1.createKeyPair()
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

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the secp256k1 ECDSA public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const publicKey = Secp256k1.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: getPublicKey.Options<as>,
): getPublicKey.ReturnType<as> {
  const { as = 'Hex', privateKey } = options
  const bytes = secp256k1.getPublicKey(Bytes.from(privateKey), false)
  const publicKey = PublicKey.fromBytes(bytes)
  return formatPublicKey(publicKey, as) as never
}

export declare namespace getPublicKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? PublicKey.PublicKey : never)

  type ErrorType = Hex.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes a shared secret using ECDH (Elliptic Curve Diffie-Hellman) between a private key and a public key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const { privateKey: privateKeyA } = Secp256k1.createKeyPair()
 * const { publicKey: publicKeyB } = Secp256k1.createKeyPair()
 *
 * const sharedSecret = Secp256k1.getSharedSecret({
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
  const sharedSecret = secp256k1.getSharedSecret(
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
     * Accepts a canonical {@link ox#PublicKey.PublicKey} (hex), a `Uint8Array`
     * (SEC1 encoding), or a structured {@link ox#PublicKey.Parts}.
     */
    publicKey: Hex.Hex | Bytes.Bytes | PublicKey.Parts<boolean>
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Hex.from.ErrorType
    | PublicKey.toHex.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Generates a random ECDSA private key on the secp256k1 curve.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = secp256k1.utils.randomSecretKey()
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
 * Recovers the signing address from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const address = Secp256k1.recoverAddress({
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered address.
 */
export function recoverAddress(
  options: recoverAddress.Options,
): recoverAddress.ReturnType {
  return Address.fromPublicKey(recoverPublicKey(options))
}

export declare namespace recoverAddress {
  type Options = {
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Signature of the payload.
     *
     * Accepts a canonical {@link ox#Signature.Signature} (hex), a
     * `Uint8Array` (65-byte recovered), or a structured
     * {@link ox#Signature.Parts}.
     */
    signature: Hex.Hex | Bytes.Bytes | Signature.Parts<boolean>
  }

  type ReturnType = Address.Address

  type ErrorType =
    | Address.fromPublicKey.ErrorType
    | recoverPublicKey.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const publicKey = Secp256k1.recoverPublicKey({
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function recoverPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: recoverPublicKey.Options<as>,
): recoverPublicKey.ReturnType<as> {
  const { as = 'Hex', payload, signature } = options
  const ourBytes = toRecoveredBytes(normalizeSignature(signature))
  // `@noble/curves` v2 expects the recovered signature as `recid || r || s`.
  // Convert from our canonical `r || s || yParity` layout.
  const sigBytes = new Uint8Array(65)
  sigBytes[0] = ourBytes[64]!
  sigBytes.set(ourBytes.subarray(0, 64), 1)
  const point = secp256k1.Signature.fromBytes(
    sigBytes,
    'recovered',
  ).recoverPublicKey(Bytes.from(payload))
  const publicKey = PublicKey.fromBytes(point.toBytes(false))
  return formatPublicKey(publicKey, as) as never
}

export declare namespace recoverPublicKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Signature of the payload.
     *
     * Accepts a canonical {@link ox#Signature.Signature} (hex), a
     * `Uint8Array` (65-byte recovered), or a structured
     * {@link ox#Signature.Parts}.
     */
    signature: Hex.Hex | Bytes.Bytes | Signature.Parts<boolean>
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? PublicKey.PublicKey : never)

  type ErrorType = Hex.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Signs the payload with the provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({
 *   payload: '0xdeadbeef',
 *   privateKey: '0x...'
 * })
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function sign<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: sign.Options<as>,
): sign.ReturnType<as> {
  const {
    as = 'Hex',
    extraEntropy = Entropy.extraEntropy,
    hash,
    payload,
    privateKey,
  } = options
  const sigBytes = secp256k1.sign(Bytes.from(payload), Bytes.from(privateKey), {
    extraEntropy:
      typeof extraEntropy === 'boolean'
        ? extraEntropy
        : Bytes.from(extraEntropy),
    lowS: true,
    prehash: hash === true,
    format: 'recovered',
  })
  // `@noble/curves` v2 emits the recovered signature as `recid || r || s`.
  // Convert to canonical `r || s || yParity` for `fromRecoveredBytes`.
  const recoveredBytes = new Uint8Array(65)
  recoveredBytes.set(sigBytes.subarray(1, 65), 0)
  recoveredBytes[64] = sigBytes[0]!
  const signature = fromRecoveredBytes(recoveredBytes)
  return formatSignature(signature, as) as never
}

export declare namespace sign {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned signature.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /**
     * Extra entropy to add to the signing process. Setting to `true` enables hedged
     * (RFC 6979 + extra randomness) signing.
     * @default false
     */
    extraEntropy?: boolean | Hex.Hex | Bytes.Bytes | undefined
    /**
     *  If set to `true`, the payload will be hashed (sha256) before being signed.
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

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Signature.Signature : never)

  type ErrorType = Bytes.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided address.
 *
 * @example
 * ### Verify with Ethereum Address
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const verified = Secp256k1.verify({
 *   address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 *
 * @example
 * ### Verify with Public Key
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = '0x...'
 * const publicKey = Secp256k1.getPublicKey({ privateKey })
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = Secp256k1.verify({
 *   publicKey,
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided address.
 */
export function verify(options: verify.Options): boolean {
  const { address, hash, payload, publicKey, signature } = options
  if (address)
    return Address.isEqual(address, recoverAddress({ payload, signature }))
  const sig = normalizeSignature(signature)
  return secp256k1.verify(
    toCompactBytes(sig),
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
  } & OneOf<
    | {
        /** Address that signed the payload. */
        address: Address.Address
        /**
         * Signature of the payload.
         *
         * Accepts a canonical {@link ox#Signature.Signature} (hex), a
         * `Uint8Array`, or a structured {@link ox#Signature.Parts}.
         */
        signature: Hex.Hex | Bytes.Bytes | Signature.Parts<boolean>
      }
    | {
        /**
         * Public key that signed the payload.
         *
         * Accepts a canonical {@link ox#PublicKey.PublicKey} (hex), a
         * `Uint8Array` (SEC1 encoding), or a structured
         * {@link ox#PublicKey.Parts}.
         */
        publicKey: Hex.Hex | Bytes.Bytes | PublicKey.Parts<boolean>
        /**
         * Signature of the payload.
         *
         * Accepts a canonical {@link ox#Signature.Signature} (hex), a
         * `Uint8Array`, or a structured {@link ox#Signature.Parts}.
         */
        signature: Hex.Hex | Bytes.Bytes | Signature.Parts<boolean>
      }
  >

  type ErrorType = Errors.GlobalErrorType
}
