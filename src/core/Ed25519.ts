import {
  ed25519,
  edwardsToMontgomeryPriv,
  edwardsToMontgomeryPub,
} from '@noble/curves/ed25519'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as keyDerivation from './internal/keyDerivation.js'
import * as Mnemonic from './Mnemonic.js'

/** Re-export of noble/curves Ed25519 utilities. */
export const noble = ed25519

/**
 * Creates a new Ed25519 key pair consisting of a private key and its corresponding public key.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const { privateKey, publicKey } = Ed25519.createKeyPair()
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
  const publicKey = getPublicKey({ privateKey, as })

  return {
    privateKey: privateKey as never,
    publicKey: publicKey as never,
  }
}

export declare namespace createKeyPair {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private and public keys.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> = {
    privateKey:
      | (as extends 'Bytes' ? Bytes.Bytes : never)
      | (as extends 'Hex' ? Hex.Hex : never)
    publicKey:
      | (as extends 'Bytes' ? Bytes.Bytes : never)
      | (as extends 'Hex' ? Hex.Hex : never)
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | randomPrivateKey.ErrorType
    | getPublicKey.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Derives an Ed25519 private key from a BIP-39 mnemonic.
 *
 * This is equivalent to passing `Mnemonic.toSeed(mnemonic, { passphrase })`
 * to `Ed25519.fromSeed`.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const privateKey = Ed25519.fromMnemonic(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @param mnemonic - BIP-39 mnemonic phrase.
 * @param options - Options.
 * @returns An Ed25519 private key.
 */
export function fromMnemonic<as extends 'Hex' | 'Bytes' = 'Hex'>(
  mnemonic: string,
  options: fromMnemonic.Options<as> = {},
): fromMnemonic.ReturnType<as> {
  const { passphrase } = options
  const seed = Mnemonic.toSeed(mnemonic, { passphrase })
  try {
    return fromSeed(seed, options)
  } finally {
    seed.fill(0)
  }
}

export declare namespace fromMnemonic {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Optional BIP-39 passphrase. */
    passphrase?: string | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> = fromSeed.ReturnType<as>

  type ErrorType = fromSeed.ErrorType
}

/**
 * Derives an Ed25519 private key from a seed.
 *
 * The seed must contain at least 32 bytes of cryptographically strong key
 * material. Do not pass a password directly; use a password KDF first.
 *
 * The permanent derivation contract uses the seed as the HMAC-SHA256
 * key. The HMAC message uses the `ox.ed25519.fromSeed.v1` domain followed by a
 * 32-bit big-endian counter set to zero.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const privateKey = Ed25519.fromSeed(
 *   '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
 * )
 * ```
 *
 * @param seed - Seed containing at least 32 bytes of cryptographically strong key material.
 * @param options - Options.
 * @returns An Ed25519 private key.
 */
export function fromSeed<as extends 'Hex' | 'Bytes' = 'Hex'>(
  seed: Hex.Hex | Bytes.Bytes,
  options: fromSeed.Options<as> = {},
): fromSeed.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = Bytes.from(seed)
  if (bytes.length < 32) throw new InvalidSeedSizeError({ size: bytes.length })

  const privateKey = keyDerivation.derive(bytes, fromSeedDomain)
  if (as === 'Hex') {
    const value = Hex.fromBytes(privateKey)
    privateKey.fill(0)
    return value as never
  }
  return privateKey as never
}

export declare namespace fromSeed {
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

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | keyDerivation.derive.ErrorType
    | InvalidSeedSizeError
    | Errors.GlobalErrorType
}

/**
 * Computes the Ed25519 public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const publicKey = Ed25519.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function getPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: getPublicKey.Options<as>,
): getPublicKey.ReturnType<as> {
  const { as = 'Hex', privateKey } = options
  const privateKeyBytes = Bytes.from(privateKey)
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes)
  if (as === 'Hex') return Hex.fromBytes(publicKeyBytes) as never
  return publicKeyBytes as never
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
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Generates a random Ed25519 private key.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const privateKey = Ed25519.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = ed25519.utils.randomPrivateKey()
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
 * Signs the payload with the provided private key and returns an Ed25519 signature.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const signature = Ed25519.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The Ed25519 signature.
 */
export function sign<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: sign.Options<as>,
): sign.ReturnType<as> {
  const { as = 'Hex', payload, privateKey } = options
  const payloadBytes = Bytes.from(payload)
  const privateKeyBytes = Bytes.from(privateKey)
  const signatureBytes = ed25519.sign(payloadBytes, privateKeyBytes)
  if (as === 'Hex') return Hex.fromBytes(signatureBytes) as never
  return signatureBytes as never
}

export declare namespace sign {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned signature.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /**
     * Payload to sign.
     */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * Ed25519 private key.
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519 } from 'ox'
 *
 * const { privateKey, publicKey } = Ed25519.createKeyPair()
 * const signature = Ed25519.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = Ed25519.verify({ // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function verify(options: verify.Options): boolean {
  const { payload, publicKey, signature } = options
  const payloadBytes = Bytes.from(payload)
  const publicKeyBytes = Bytes.from(publicKey)
  const signatureBytes = Bytes.from(signature)
  return ed25519.verify(signatureBytes, payloadBytes, publicKeyBytes)
}

export declare namespace verify {
  type Options = {
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /** Public key that signed the payload. */
    publicKey: Hex.Hex | Bytes.Bytes
    /** Signature of the payload. */
    signature: Hex.Hex | Bytes.Bytes
  }

  type ErrorType = Bytes.from.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts an Ed25519 public key to an X25519 public key.
 *
 * This is useful for performing X25519 Diffie-Hellman key exchange
 * using an Ed25519 signing key pair.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519, X25519 } from 'ox'
 *
 * const { privateKey, publicKey } = Ed25519.createKeyPair()
 *
 * const x25519PublicKey = Ed25519.toX25519PublicKey({ publicKey })
 * ```
 *
 * @param options - The options.
 * @returns The X25519 public key.
 */
export function toX25519PublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: toX25519PublicKey.Options<as>,
): toX25519PublicKey.ReturnType<as> {
  const { as = 'Hex', publicKey } = options
  const publicKeyBytes = Bytes.from(publicKey)
  const x25519PublicKeyBytes = edwardsToMontgomeryPub(publicKeyBytes)
  if (as === 'Hex') return Hex.fromBytes(x25519PublicKeyBytes) as never
  return x25519PublicKeyBytes as never
}

export declare namespace toX25519PublicKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Ed25519 public key to convert. */
    publicKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts an Ed25519 private key to an X25519 private key.
 *
 * This is useful for performing X25519 Diffie-Hellman key exchange
 * using an Ed25519 signing key pair.
 *
 * @example
 * ```ts twoslash
 * import { Ed25519, X25519 } from 'ox'
 *
 * const { privateKey, publicKey } = Ed25519.createKeyPair()
 *
 * const x25519PrivateKey = Ed25519.toX25519PrivateKey({ privateKey })
 * ```
 *
 * @param options - The options.
 * @returns The X25519 private key.
 */
export function toX25519PrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: toX25519PrivateKey.Options<as>,
): toX25519PrivateKey.ReturnType<as> {
  const { as = 'Hex', privateKey } = options
  const privateKeyBytes = Bytes.from(privateKey)
  const x25519PrivateKeyBytes = edwardsToMontgomeryPriv(privateKeyBytes)
  if (as === 'Hex') return Hex.fromBytes(x25519PrivateKeyBytes) as never
  return x25519PrivateKeyBytes as never
}

export declare namespace toX25519PrivateKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Ed25519 private key to convert. */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a seed contains fewer than 32 bytes. */
export class InvalidSeedSizeError extends Errors.BaseError {
  override readonly name = 'Ed25519.InvalidSeedSizeError'

  constructor(options: InvalidSeedSizeError.Options) {
    super(
      `Seed must contain at least 32 bytes. Received ${options.size} bytes.`,
    )
  }
}

export declare namespace InvalidSeedSizeError {
  /** Options for `Ed25519.InvalidSeedSizeError`. */
  type Options = {
    /** Received seed size. */
    size: number
  }
}

const fromSeedDomain = Bytes.fromString('ox.ed25519.fromSeed.v1')
