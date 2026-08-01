import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Entropy from './internal/entropy.js'
import * as engine from './internal/mlDsa44.js'

/** Re-export of noble/post-quantum ML-DSA-44 utilities. */
export const noble = ml_dsa44

/** Size of an ML-DSA-44 private key (seed) in bytes. */
export const privateKeySize = 32

/** Size of an ML-DSA-44 public key in bytes. */
export const publicKeySize = 1312

/** Size of an ML-DSA-44 signature in bytes. */
export const signatureSize = 2420

/**
 * Creates a new ML-DSA-44 key pair consisting of a private key and its
 * corresponding public key.
 *
 * The private key is the 32-byte seed (`ξ`) from FIPS 204 key generation —
 * the canonical interchange form of an ML-DSA private key. The 1,312-byte
 * public key is deterministically expanded from it.
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox'
 *
 * const { privateKey, publicKey } = MlDsa44.createKeyPair()
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
    | randomPrivateKey.ErrorType
    | getPublicKey.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the ML-DSA-44 public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox'
 *
 * const publicKey = MlDsa44.getPublicKey({
 *   privateKey: '0x...'
 * })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed 1,312-byte public key.
 */
export function getPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: getPublicKey.Options<as>,
): getPublicKey.ReturnType<as> {
  const { as = 'Hex', privateKey } = options
  const privateKeyBytes = Bytes.from(privateKey)
  const publicKeyBytes = engine.getPublicKey(privateKeyBytes)
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
     * Private key (32-byte seed) to compute the public key from.
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
 * Generates a random ML-DSA-44 private key (32-byte seed).
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox'
 *
 * const privateKey = MlDsa44.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = engine.randomSecretKey()
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
 * Signs the payload with the provided private key and returns an ML-DSA-44
 * signature (2,420 bytes).
 *
 * Signing is deterministic by default. Set `extraEntropy` to `true` (or to 32
 * bytes of entropy) for the hedged variant of FIPS 204, which protects against
 * fault attacks and randomness-reuse pitfalls at the cost of reproducibility.
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox'
 *
 * const signature = MlDsa44.sign({
 *   // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey: '0x...' // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The signing options.
 * @returns The ML-DSA-44 signature.
 */
export function sign<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: sign.Options<as>,
): sign.ReturnType<as> {
  const {
    as = 'Hex',
    extraEntropy = Entropy.extraEntropy,
    payload,
    privateKey,
  } = options
  const context = toContextBytes(options.context)
  const signatureBytes = engine.sign(
    Bytes.from(payload),
    Bytes.from(privateKey),
    {
      context,
      extraEntropy:
        typeof extraEntropy === 'boolean'
          ? extraEntropy
          : Bytes.from(extraEntropy),
    },
  )
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
     * Context string for domain separation, at most 255 bytes.
     * @default empty
     */
    context?: Hex.Hex | Bytes.Bytes | undefined
    /**
     * Extra entropy to add to the signing process. Setting to `true` enables
     * hedged signing with 32 fresh random bytes; 32 bytes may be supplied
     * directly instead.
     * @default false
     */
    extraEntropy?: boolean | Hex.Hex | Bytes.Bytes | undefined
    /**
     * Payload to sign.
     */
    payload: Hex.Hex | Bytes.Bytes
    /**
     * ML-DSA-44 private key (32-byte seed).
     */
    privateKey: Hex.Hex | Bytes.Bytes
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | InvalidContextSizeError
    | Errors.GlobalErrorType
}

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 * ```ts twoslash
 * import { MlDsa44 } from 'ox'
 *
 * const { privateKey, publicKey } = MlDsa44.createKeyPair()
 * const signature = MlDsa44.sign({
 *   payload: '0xdeadbeef',
 *   privateKey
 * })
 *
 * const verified = MlDsa44.verify({
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
  const { payload, publicKey, signature } = options
  const context = toContextBytes(options.context)
  return engine.verify(
    Bytes.from(signature),
    Bytes.from(payload),
    Bytes.from(publicKey),
    { context },
  )
}

export declare namespace verify {
  type Options = {
    /**
     * Context string for domain separation, at most 255 bytes.
     * @default empty
     */
    context?: Hex.Hex | Bytes.Bytes | undefined
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
    /** Public key that signed the payload. */
    publicKey: Hex.Hex | Bytes.Bytes
    /** Signature of the payload. */
    signature: Hex.Hex | Bytes.Bytes
  }

  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidContextSizeError
    | Errors.GlobalErrorType
}

/** Thrown when a context string exceeds the 255-byte FIPS 204 limit. */
export class InvalidContextSizeError extends Errors.BaseError {
  override readonly name = 'MlDsa44.InvalidContextSizeError'

  constructor(options: InvalidContextSizeError.Options) {
    super(`Context must be at most 255 bytes. Received ${options.size} bytes.`)
  }
}

export declare namespace InvalidContextSizeError {
  /** Options for {@link ox#MlDsa44.InvalidContextSizeError}. */
  type Options = {
    /** Received context size. */
    size: number
  }
}

function toContextBytes(
  context: Hex.Hex | Bytes.Bytes | undefined,
): Bytes.Bytes | undefined {
  if (context === undefined) return undefined
  const bytes = Bytes.from(context)
  if (bytes.length > 255)
    throw new InvalidContextSizeError({ size: bytes.length })
  return bytes
}
