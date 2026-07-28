/**
 * Engine slot contracts and the override registry.
 *
 * This module intentionally has **no imports**. It is pulled into the module
 * graph of every crypto module in ox, so it must not drag any dependency along
 * with it. That constraint is also why the contracts speak raw `Uint8Array`
 * rather than `Bytes.Bytes`/`Hex.Hex` -- coercion stays in the public module,
 * and the engine boundary is plain bytes in, plain bytes out.
 *
 * The registry holds **overrides only**. Defaults are never registered here,
 * because a registered default has to live on a complete slot object, and a
 * slot object is a single reachable value: esbuild cannot drop the properties
 * of one, so every default's `@noble/*` import survives into every bundle that
 * touches the slot. Measured on a keccak256-only bundle, that costs 5 kB gzip.
 * Instead each slot has a resolver module under `internal/` holding one binding
 * per primitive, and the fallback is chosen there, per primitive.
 *
 * @internal
 */

/**
 * Hash primitives. One-shot, synchronous, bytes in / bytes out.
 *
 * @internal
 */
export type Hash = {
  /** BLAKE3, 32-byte digest. */
  blake3?: ((input: Uint8Array) => Uint8Array) | undefined
  /** HMAC-SHA256. */
  hmacSha256?:
    | ((key: Uint8Array, message: Uint8Array) => Uint8Array)
    | undefined
  /** Keccak256 (not FIPS-202 SHA3-256). */
  keccak256?: ((input: Uint8Array) => Uint8Array) | undefined
  /** RIPEMD-160. */
  ripemd160?: ((input: Uint8Array) => Uint8Array) | undefined
  /** SHA-256. */
  sha256?: ((input: Uint8Array) => Uint8Array) | undefined
}

/**
 * Short-Weierstrass ECDSA. Shared by the `Secp256k1` and `P256` slots.
 *
 * Signatures are always low-S normalized and always returned in 65-byte
 * recovered form -- the contract mandates it, so an engine cannot silently opt
 * out.
 *
 * @internal
 */
export type Ecdsa = {
  /** Derives an uncompressed (65-byte) public key. */
  getPublicKey?: ((privateKey: Uint8Array) => Uint8Array) | undefined
  /**
   * Computes a compressed (33-byte) ECDH shared secret.
   *
   * `publicKey` arrives in whichever SEC1 form the caller supplied, so an
   * implementation has to accept both the compressed 33-byte and uncompressed
   * 65-byte encodings.
   */
  getSharedSecret?:
    | ((privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array)
    | undefined
  /**
   * Recovers an uncompressed public key from a 65-byte `yParity || r || s`
   * signature, the same layout {@link Ecdsa.sign} returns.
   */
  recoverPublicKey?:
    | ((signature: Uint8Array, payload: Uint8Array) => Uint8Array)
    | undefined
  /** Generates a random private key. */
  randomSecretKey?: (() => Uint8Array) | undefined
  /** Signs a payload, returning 65 bytes of `yParity || r || s`. */
  sign?:
    | ((
        payload: Uint8Array,
        privateKey: Uint8Array,
        options: {
          /** Extra entropy for hedged signing, or `true` for random. */
          extraEntropy: boolean | Uint8Array
          /** Whether to hash the payload before signing. */
          prehash: boolean
        },
      ) => Uint8Array)
    | undefined
  /** Verifies a 64-byte compact (`r || s`) signature. */
  verify?:
    | ((
        signature: Uint8Array,
        payload: Uint8Array,
        publicKey: Uint8Array,
        options: {
          /** Whether to hash the payload before verifying. */
          prehash: boolean
        },
      ) => boolean)
    | undefined
}

/**
 * Edwards-curve signatures (Ed25519).
 *
 * @internal
 */
export type Eddsa = {
  /** Derives a 32-byte public key. */
  getPublicKey?: ((privateKey: Uint8Array) => Uint8Array) | undefined
  /** Generates a random private key. */
  randomSecretKey?: (() => Uint8Array) | undefined
  /** Signs a payload, returning a 64-byte signature. */
  sign?:
    | ((payload: Uint8Array, privateKey: Uint8Array) => Uint8Array)
    | undefined
  /** Converts an Ed25519 public key to its X25519 (Montgomery) form. */
  toMontgomery?: ((publicKey: Uint8Array) => Uint8Array) | undefined
  /** Converts an Ed25519 private key to its X25519 (Montgomery) form. */
  toMontgomerySecret?: ((privateKey: Uint8Array) => Uint8Array) | undefined
  /** Verifies a 64-byte signature. */
  verify?:
    | ((
        signature: Uint8Array,
        payload: Uint8Array,
        publicKey: Uint8Array,
      ) => boolean)
    | undefined
}

/**
 * Montgomery-curve key agreement (X25519).
 *
 * @internal
 */
export type Ecdh = {
  /** Derives a 32-byte public key. */
  getPublicKey?: ((privateKey: Uint8Array) => Uint8Array) | undefined
  /** Computes a 32-byte shared secret. */
  getSharedSecret?:
    | ((privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array)
    | undefined
  /** Generates a random private key. */
  randomSecretKey?: (() => Uint8Array) | undefined
}

/**
 * Key derivation and symmetric primitives used by keystores.
 *
 * The `*Async` functions resolve independently of their synchronous twins --
 * an engine that supplies only `scrypt` leaves `scryptAsync` on the default
 * implementation, because wrapping a long synchronous call in a promise is
 * worse than a genuinely yielding one.
 *
 * @internal
 */
export type Keystore = {
  /** AES-CTR decryption (key length selects AES-128/192/256). */
  aesCtrDecrypt?:
    | ((key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array)
    | undefined
  /** AES-CTR encryption (key length selects AES-128/192/256). */
  aesCtrEncrypt?:
    | ((key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array)
    | undefined
  /** PBKDF2-HMAC-SHA256. */
  pbkdf2Sha256?:
    | ((
        password: Uint8Array,
        salt: Uint8Array,
        options: { c: number; dkLen: number },
      ) => Uint8Array)
    | undefined
  /** Asynchronous PBKDF2-HMAC-SHA256. */
  pbkdf2Sha256Async?:
    | ((
        password: Uint8Array,
        salt: Uint8Array,
        options: { c: number; dkLen: number },
      ) => Promise<Uint8Array>)
    | undefined
  /** scrypt. */
  scrypt?:
    | ((
        password: Uint8Array,
        salt: Uint8Array,
        options: { N: number; dkLen: number; p: number; r: number },
      ) => Uint8Array)
    | undefined
  /** Asynchronous scrypt. */
  scryptAsync?:
    | ((
        password: Uint8Array,
        salt: Uint8Array,
        options: { N: number; dkLen: number; p: number; r: number },
      ) => Promise<Uint8Array>)
    | undefined
}

/**
 * BIP-39 seed derivation (PBKDF2-HMAC-SHA512, 2048 iterations).
 *
 * Mnemonic generation, validation, and the wordlists themselves are plain data
 * and string handling, so they are not part of the engine boundary.
 *
 * @internal
 */
export type Mnemonic = {
  /** Derives a 64-byte seed from a mnemonic phrase and optional passphrase. */
  toSeed?: ((mnemonic: string, passphrase?: string) => Uint8Array) | undefined
}

/**
 * BLS12-381 operations.
 *
 * Points cross this boundary in their compressed serialized form (48 bytes for
 * G1, 96 for G2), never as projective coordinate triples -- an engine backed by
 * a native library cannot be expected to reproduce another library's internal
 * point representation.
 *
 * @internal
 */
export type Bls = {
  /** Aggregates compressed points of the same group. */
  aggregate?:
    | ((points: readonly Uint8Array[], group: 'G1' | 'G2') => Uint8Array)
    | undefined
  /** Derives a compressed public key in the given group. */
  getPublicKey?:
    | ((privateKey: Uint8Array, group: 'G1' | 'G2') => Uint8Array)
    | undefined
  /** Generates a random private key. */
  randomSecretKey?: (() => Uint8Array) | undefined
  /** Signs a payload, returning a compressed point in the opposite group. */
  sign?:
    | ((
        payload: Uint8Array,
        privateKey: Uint8Array,
        options: {
          /** Domain separation tag for hash-to-curve. */
          dst?: Uint8Array | undefined
          /** Group of the signature. */
          group: 'G1' | 'G2'
        },
      ) => Uint8Array)
    | undefined
  /** Verifies a compressed signature against a compressed public key. */
  verify?:
    | ((
        signature: Uint8Array,
        payload: Uint8Array,
        publicKey: Uint8Array,
        options: {
          /** Domain separation tag for hash-to-curve. */
          dst?: Uint8Array | undefined
          /** Group of the signature. */
          signatureGroup: 'G1' | 'G2'
        },
      ) => boolean)
    | undefined
}

/**
 * Root engine type. Slots and functions are optional; omissions preserve
 * earlier overrides, or use Ox's default when none exists.
 *
 * @internal
 */
export type Engine = {
  /** Implementation for [`Bls`](/api/Bls). */
  Bls?: Bls | undefined
  /** Implementation for [`Ed25519`](/api/Ed25519). */
  Ed25519?: Eddsa | undefined
  /** Implementation for [`Hash`](/api/Hash). */
  Hash?: Hash | undefined
  /** Implementation for [`Keystore`](/api/Keystore). */
  Keystore?: Keystore | undefined
  /** Implementation for [`Mnemonic`](/api/Mnemonic). */
  Mnemonic?: Mnemonic | undefined
  /** Implementation for [`P256`](/api/P256). */
  P256?: Ecdsa | undefined
  /** Implementation for [`Secp256k1`](/api/Secp256k1). */
  Secp256k1?: Ecdsa | undefined
  /** Implementation for [`X25519`](/api/X25519). */
  X25519?: Ecdh | undefined
}

/**
 * A slot with every function present.
 *
 * Slots are optional all the way down so that an engine can fill in as little
 * as it likes. ox's own default implementations are held to the opposite
 * standard: they back every function ox routes, so they are declared against
 * this instead, and a default that goes missing or drifts from the contract
 * fails to compile.
 *
 * @internal
 */
export type Complete<slot> = { [key in keyof slot]-?: NonNullable<slot[key]> }

/**
 * Recognized slot names, in the order they appear on {@link Engine}.
 *
 * @internal
 */
export const slots = [
  'Bls',
  'Ed25519',
  'Hash',
  'Keystore',
  'Mnemonic',
  'P256',
  'Secp256k1',
  'X25519',
] as const satisfies readonly (keyof Engine)[]

/**
 * Recognized primitive names, per slot.
 *
 * An override stored under a name no resolver reads is invisible: the default
 * keeps running and nothing is reported, so a typo looks exactly like success.
 * That is worst for the callers who can least afford it -- someone installing a
 * policy-constrained or hardware-backed implementation silently gets ox's
 * default instead. {@link Engine.set} checks against this to make it loud.
 *
 * @internal
 */
export const primitives = {
  Bls: ['aggregate', 'getPublicKey', 'randomSecretKey', 'sign', 'verify'],
  Ed25519: [
    'getPublicKey',
    'randomSecretKey',
    'sign',
    'toMontgomery',
    'toMontgomerySecret',
    'verify',
  ],
  Hash: ['blake3', 'hmacSha256', 'keccak256', 'ripemd160', 'sha256'],
  Keystore: [
    'aesCtrDecrypt',
    'aesCtrEncrypt',
    'pbkdf2Sha256',
    'pbkdf2Sha256Async',
    'scrypt',
    'scryptAsync',
  ],
  Mnemonic: ['toSeed'],
  P256: [
    'getPublicKey',
    'getSharedSecret',
    'recoverPublicKey',
    'randomSecretKey',
    'sign',
    'verify',
  ],
  Secp256k1: [
    'getPublicKey',
    'getSharedSecret',
    'recoverPublicKey',
    'randomSecretKey',
    'sign',
    'verify',
  ],
  X25519: ['getPublicKey', 'getSharedSecret', 'randomSecretKey'],
} as const satisfies {
  [key in keyof Engine]-?: readonly (keyof Complete<NonNullable<Engine[key]>>)[]
}

/**
 * The installed overrides. Empty by default -- a bare object literal, so
 * bundlers treat it as side-effect free.
 *
 * @internal
 */
export const overrides: Engine = {}

/**
 * Merges overrides into the registry, one level deep. A slot set to `undefined`
 * is removed.
 *
 * @internal
 */
export function merge(value: Engine) {
  for (const key of Object.keys(value) as (keyof Engine)[]) {
    const slot = value[key]
    if (slot === undefined) {
      delete overrides[key]
      continue
    }
    // A member set to `undefined` clears that primitive. Spreading would keep
    // it as an own property: calls still fall through to the default, but
    // `get` would report an override that is not there.
    const merged: Record<string, unknown> = { ...overrides[key] }
    for (const [name, fn] of Object.entries(slot)) {
      if (fn === undefined) delete merged[name]
      else merged[name] = fn
    }
    // An empty slot stays: `set({ Hash: {} })` is a no-op a caller wrote
    // deliberately, and `get` has always reported it.
    overrides[key] = merged as never
  }
}

/**
 * Removes one slot, or every slot when `slot` is omitted.
 *
 * @internal
 */
export function reset(slot?: keyof Engine) {
  if (slot) delete overrides[slot]
  else
    for (const key of Object.keys(overrides) as (keyof Engine)[])
      delete overrides[key]
}
