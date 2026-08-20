import { secp256k1 } from '@noble/curves/secp256k1'
import * as Address from './Address.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Entropy from './internal/entropy.js'
import * as keyDerivation from './internal/keyDerivation.js'
import * as internal from './internal/mnemonic.js'
import type { OneOf } from './internal/types.js'
import type * as Mnemonic from './Mnemonic.js'
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

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | PublicKey.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Derives a valid secp256k1 private key from a BIP-39 mnemonic.
 *
 * This is equivalent to `Mnemonic.toPrivateKey`, and derives the
 * private key at `m/44'/60'/0'/0/0` by default.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = Secp256k1.fromMnemonic(
 *   'test test test test test test test test test test test junk'
 * )
 * ```
 *
 * @param mnemonic - BIP-39 mnemonic phrase.
 * @param options - Options.
 * @returns A valid secp256k1 private key.
 */
export function fromMnemonic<as extends 'Hex' | 'Bytes' = 'Hex'>(
  mnemonic: string,
  options: fromMnemonic.Options<as> = {},
): fromMnemonic.ReturnType<as> {
  const { as = 'Hex', passphrase, path } = options
  return internal.toPrivateKey(mnemonic, { as, passphrase, path }) as never
}

export declare namespace fromMnemonic {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Derivation path. @default `m/44'/60'/0'/0/0` */
    path?: string | undefined
    /** Optional BIP-39 passphrase. */
    passphrase?: string | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    Mnemonic.toPrivateKey.ReturnType<as>

  type ErrorType = Mnemonic.toPrivateKey.ErrorType
}

/**
 * Derives a valid secp256k1 private key from a seed.
 *
 * The seed must contain at least 32 bytes of cryptographically strong key
 * material. Do not pass a password directly; use a password KDF first.
 *
 * The permanent derivation contract uses the seed as the HMAC-SHA256
 * key. The HMAC message uses the `ox.secp256k1.fromSeed.v1` domain followed by
 * a 32-bit big-endian counter starting at zero. Invalid scalars are skipped.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = Secp256k1.fromSeed(
 *   '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
 * )
 * ```
 *
 * @param seed - Seed containing at least 32 bytes of cryptographically strong key material.
 * @param options - Options.
 * @returns A valid secp256k1 private key.
 */
export function fromSeed<as extends 'Hex' | 'Bytes' = 'Hex'>(
  seed: Hex.Hex | Bytes.Bytes,
  options: fromSeed.Options<as> = {},
): fromSeed.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = Bytes.from(seed)
  if (bytes.length < 32) throw new InvalidSeedSizeError({ size: bytes.length })

  const privateKey = keyDerivation.derive(bytes, fromSeedDomain, {
    validate: noble.utils.isValidPrivateKey,
  })
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
export function getPublicKey(
  options: getPublicKey.Options,
): PublicKey.PublicKey {
  const { privateKey } = options
  const point = secp256k1.ProjectivePoint.fromPrivateKey(
    Hex.from(privateKey).slice(2),
  )
  return PublicKey.from(point)
}

export declare namespace getPublicKey {
  type Options = {
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ErrorType =
    | Hex.from.ErrorType
    | PublicKey.from.ErrorType
    | Errors.GlobalErrorType
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
  const point = secp256k1.ProjectivePoint.fromHex(
    PublicKey.toHex(publicKey).slice(2),
  )
  const sharedPoint = point.multiply(
    secp256k1.utils.normPrivateKeyToScalar(Hex.from(privateKey).slice(2)),
  )
  const sharedSecret = sharedPoint.toRawBytes(true) // compressed format
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
     */
    publicKey: PublicKey.PublicKey<boolean>
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
  const bytes = secp256k1.utils.randomPrivateKey()
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
 * const address = Secp256k1.recoverAddress({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
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
    /** Signature of the payload. */
    signature: Signature.Signature
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
 * const publicKey = Secp256k1.recoverPublicKey({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function recoverPublicKey(
  options: recoverPublicKey.Options,
): PublicKey.PublicKey {
  const { payload, signature } = options
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const point = signature_.recoverPublicKey(Hex.from(payload).substring(2))
  return PublicKey.from(point)
}

export declare namespace recoverPublicKey {
  type Options = {
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /** Signature of the payload. */
    signature: Signature.Signature
  }

  type ErrorType =
    | PublicKey.from.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Signs the payload with the provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ECDSA {@link ox#Signature.Signature}.
 */
export function sign(options: sign.Options): Signature.Signature {
  const {
    extraEntropy = Entropy.extraEntropy,
    hash,
    payload,
    privateKey,
  } = options
  const { r, s, recovery } = secp256k1.sign(
    Bytes.from(payload),
    Bytes.from(privateKey),
    {
      extraEntropy:
        typeof extraEntropy === 'boolean'
          ? extraEntropy
          : Hex.from(extraEntropy).slice(2),
      lowS: true,
      ...(hash ? { prehash: true } : {}),
    },
  )
  return {
    r,
    s,
    yParity: recovery,
  }
}

export declare namespace sign {
  type Options = {
    /**
     * Extra entropy to add to the signing process. Setting to `false` will disable it.
     * @default true
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
 * const verified = Secp256k1.verify({ // [!code focus]
 *   address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
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
 * const verified = Secp256k1.verify({ // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided address.
 */
export function verify(options: verify.Options): boolean {
  const { hash, payload } = options
  if (options.address)
    return Address.isEqual(
      options.address,
      recoverAddress({ payload, signature: options.signature }),
    )
  return secp256k1.verify(
    options.signature,
    Bytes.from(payload),
    PublicKey.toBytes(options.publicKey),
    ...(hash ? [{ prehash: true, lowS: true }] : []),
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
        /** Signature of the payload. */
        signature: Signature.Signature
      }
    | {
        /** Public key that signed the payload. */
        publicKey: PublicKey.PublicKey<boolean>
        /** Signature of the payload. */
        signature: Signature.Signature<false>
      }
  >

  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when a seed contains fewer than 32 bytes. */
export class InvalidSeedSizeError extends Errors.BaseError {
  override readonly name = 'Secp256k1.InvalidSeedSizeError'

  constructor(options: InvalidSeedSizeError.Options) {
    super(
      `Seed must contain at least 32 bytes. Received ${options.size} bytes.`,
    )
  }
}

export declare namespace InvalidSeedSizeError {
  /** Options for `Secp256k1.InvalidSeedSizeError`. */
  type Options = {
    /** Received seed size. */
    size: number
  }
}

const fromSeedDomain = Bytes.fromString('ox.secp256k1.fromSeed.v1')
