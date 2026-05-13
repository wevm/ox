import { p256 } from '@noble/curves/nist.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute } from './internal/types.js'
import * as PublicKey from './PublicKey.js'
import type * as Signature from './Signature.js'

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
 * // @log: {
 * // @log:   privateKey: CryptoKey {},
 * // @log:   publicKey: {
 * // @log:     x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:     y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log:     prefix: 4,
 * // @log:   },
 * // @log: }
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
  const publicKey = PublicKey.from(new Uint8Array(publicKey_raw))
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

  type ErrorType = PublicKey.from.ErrorType | Errors.GlobalErrorType
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
 * // @log: {
 * // @log:   privateKey: CryptoKey {},
 * // @log:   publicKey: {
 * // @log:     x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:     y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log:     prefix: 4,
 * // @log:   },
 * // @log: }
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
  const publicKey = PublicKey.from(new Uint8Array(publicKey_raw))
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

  type ErrorType = PublicKey.from.ErrorType | Errors.GlobalErrorType
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
    PublicKey.toBytes(publicKey),
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
    publicKey: PublicKey.PublicKey<boolean>
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
 * const signature = await WebCryptoP256.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   r: 151231...4423n,
 * // @log:   s: 516123...5512n,
 * // @log: }
 * ```
 *
 * @param options - Options for signing the payload.
 * @returns The P256 ECDSA {@link ox#Signature.Signature} (always low-S normalized).
 */
export async function sign(
  options: sign.Options,
): Promise<Signature.Signature<false>> {
  const { payload, privateKey } = options
  const signature = await globalThis.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    Bytes.from(payload),
  )
  const signature_bytes = Bytes.fromArray(new Uint8Array(signature))
  const r = Bytes.toBigInt(Bytes.slice(signature_bytes, 0, 32))
  let s = Bytes.toBigInt(Bytes.slice(signature_bytes, 32, 64))
  if (s > N / 2n) s = N - s
  return { r, s }
}

export declare namespace sign {
  type Options = {
    /** Payload to sign. */
    payload: Hex.Hex | Bytes.Bytes
    /** ECDSA private key. */
    privateKey: CryptoKey
  }

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
 * const verified = await WebCryptoP256.verify({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export async function verify(options: verify.Options): Promise<boolean> {
  const { lowS = true, payload, signature } = options

  // Reject high-S signatures if lowS is enabled.
  if (lowS && signature.s > N / 2n) return false

  const publicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    PublicKey.toBytes(options.publicKey),
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
    Bytes.concat(
      Bytes.fromNumber(signature.r, { size: 32 }),
      Bytes.fromNumber(signature.s, { size: 32 }),
    ),
    Bytes.from(payload),
  )
}

export declare namespace verify {
  type Options = {
    /** If set to `true`, only low-S signatures will be accepted. @default true */
    lowS?: boolean | undefined
    /** Public key that signed the payload. */
    publicKey: PublicKey.PublicKey<boolean>
    /** Signature of the payload. */
    signature: Signature.Signature<false>
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes.Bytes
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Imports an ECDSA P-256 public key once so that repeated verification calls
 * do not pay the cost of `crypto.subtle.importKey` on every call.
 *
 * @remarks
 * `crypto.subtle.importKey` is one of the slower Web Crypto steps. For batch
 * verification of many signatures against the same key, prepare the key once
 * with {@link ox#WebCryptoP256.(prepareVerifyKey:function)} and pass the
 * resulting `CryptoKey` to {@link ox#WebCryptoP256.(verifyPrepared:function)}.
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 * const verifier = await WebCryptoP256.prepareVerifyKey(publicKey) // [!code focus]
 *
 * const signature = await WebCryptoP256.sign({ payload: '0xdeadbeef', privateKey })
 * const verified = await WebCryptoP256.verifyPrepared({
 *   publicKey: verifier,
 *   signature,
 *   payload: '0xdeadbeef',
 * })
 * ```
 *
 * @param publicKey - The public key to import.
 * @returns A {@link CryptoKey} usable with {@link ox#WebCryptoP256.(verifyPrepared:function)}.
 */
export async function prepareVerifyKey(
  publicKey: PublicKey.PublicKey<boolean>,
): Promise<CryptoKey> {
  return await globalThis.crypto.subtle.importKey(
    'raw',
    PublicKey.toBytes(publicKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  )
}

export declare namespace prepareVerifyKey {
  type ErrorType = PublicKey.toBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a signature using a public key that was already imported with
 * {@link ox#WebCryptoP256.(prepareVerifyKey:function)}, skipping the
 * per-call `crypto.subtle.importKey` overhead.
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 * const verifier = await WebCryptoP256.prepareVerifyKey(publicKey)
 *
 * const signature = await WebCryptoP256.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = await WebCryptoP256.verifyPrepared({ // [!code focus]
 *   publicKey: verifier, // [!code focus]
 *   signature, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the prepared public key.
 */
export async function verifyPrepared(
  options: verifyPrepared.Options,
): Promise<boolean> {
  const { lowS = true, payload, publicKey, signature } = options

  if (lowS && signature.s > N / 2n) return false

  return await globalThis.crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    publicKey,
    Bytes.concat(
      Bytes.fromNumber(signature.r, { size: 32 }),
      Bytes.fromNumber(signature.s, { size: 32 }),
    ),
    Bytes.from(payload),
  )
}

export declare namespace verifyPrepared {
  type Options = {
    /** If set to `true`, only low-S signatures will be accepted. @default true */
    lowS?: boolean | undefined
    /** Imported public {@link CryptoKey} from {@link ox#WebCryptoP256.(prepareVerifyKey:function)}. */
    publicKey: CryptoKey
    /** Signature of the payload. */
    signature: Signature.Signature<false>
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
