import { ctr } from '@noble/ciphers/aes.js'
import { bls12_381 as bls } from '@noble/curves/bls12-381.js'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { p256 } from '@noble/curves/nist.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { scrypt, scryptAsync } from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { mnemonicToSeedSync } from '@scure/bip39'
import { Hex, type Engine } from 'ox'

type HdKeyFixture = Omit<
  Engine.HdKeyNode,
  'identifier' | 'privateKey' | 'publicKey' | 'versions'
> & {
  identifier: Hex.Hex
  privateKey: Hex.Hex
  publicKey: Hex.Hex
}

const hdKeyRoot = {
  depth: 0,
  identifier: '0x3442193e1bb70916e914552172cd4e2dbc9df811',
  index: 0,
  privateKey:
    '0xe8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
  privateExtendedKey:
    'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
  publicKey:
    '0x0439a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c23cbe7ded0e7ce6a594896b8f62888fdbc5c8821305e2ea42bf01e37300116281',
  publicExtendedKey:
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
} as const satisfies HdKeyFixture

const hdKeyChild = {
  depth: 1,
  identifier: '0x5c1bd648ed23aa5fd50ba52b2457c11e9e80a6a7',
  index: 0x8000_0000,
  privateKey:
    '0xedb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea',
  privateExtendedKey:
    'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
  publicKey:
    '0x045a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc567f717885be239daadce76b568958305183ad616ff74ed4dc219a74c26d35f839',
  publicExtendedKey:
    'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw',
} as const satisfies HdKeyFixture

function materializeHdKey(
  fixture: HdKeyFixture,
  versions: Engine.HdKeyVersions,
): Engine.HdKeyNode {
  return {
    ...fixture,
    identifier: Hex.toBytes(fixture.identifier),
    privateKey: Hex.toBytes(fixture.privateKey),
    publicKey: Hex.toBytes(fixture.publicKey),
    versions: { ...versions },
  }
}

type CompleteHdKey = {
  [key in keyof Engine.HdKey]-?: NonNullable<Engine.HdKey[key]>
}

/**
 * Complete portable-node test engine with no dependency on `@scure/bip32`.
 *
 * It returns fixed official BIP-32 vector nodes so tests can prove every
 * operation is routed without reaching the default provider.
 */
export const hdKey = {
  derive: (privateExtendedKey, path, versions) => {
    if (path === 'm')
      return materializeHdKey(
        privateExtendedKey === hdKeyChild.privateExtendedKey
          ? hdKeyChild
          : hdKeyRoot,
        versions,
      )
    return materializeHdKey(hdKeyChild, versions)
  },
  fromExtendedKey: (_extendedKey, versions) =>
    materializeHdKey(hdKeyChild, versions),
  fromSeed: (_seed, versions) => materializeHdKey(hdKeyRoot, versions),
} satisfies CompleteHdKey

/**
 * An engine whose every slot delegates to the same `@noble/*` implementation ox
 * uses by default.
 *
 * Installing it must not change a single result. That is what makes it useful:
 * it exercises every slot's byte conventions -- 65-byte recovered signatures,
 * uncompressed public keys, compressed shared secrets -- against the code that
 * consumes them. A contract that disagrees with what ox expects fails here
 * rather than silently only when a real engine is installed.
 */
export const identity: Engine.Engine = {
  Bls: {
    aggregate: (points, group) => {
      if (group === 'G1') {
        let point = bls.G1.Point.ZERO
        for (const value of points)
          point = point.add(bls.G1.Point.fromBytes(value))
        return point.toBytes()
      }
      let point = bls.G2.Point.ZERO
      for (const value of points)
        point = point.add(bls.G2.Point.fromBytes(value))
      return point.toBytes()
    },
    getPublicKey: (privateKey, group) => {
      const curve = group === 'G1' ? bls.G1 : bls.G2
      return curve.Point.BASE.multiply(
        curve.Point.Fn.fromBytes(privateKey),
      ).toBytes()
    },
    randomSecretKey: () => bls.utils.randomSecretKey(),
    sign: (payload, privateKey, { dst, group }) => {
      const signatureCurve = group === 'G1' ? bls.G1 : bls.G2
      const privateKeyCurve = group === 'G1' ? bls.G2 : bls.G1
      return signatureCurve
        .hashToCurve(payload, dst ? { DST: dst } : undefined)
        .multiply(privateKeyCurve.Point.Fn.fromBytes(privateKey))
        .toBytes()
    },
    verify: (signature, payload, publicKey, { dst, signatureGroup }) => {
      const shortSignature = signatureGroup === 'G1'
      const curve = shortSignature ? bls.G1 : bls.G2
      const pairing = (() => {
        if (shortSignature) {
          const signaturePoint = bls.G1.Point.fromBytes(signature)
          const publicKeyPoint = bls.G2.Point.fromBytes(publicKey)
          const payloadPoint = curve.hashToCurve(
            payload,
            dst ? { DST: dst } : undefined,
          )
          return bls.pairingBatch([
            {
              g1: payloadPoint as InstanceType<typeof bls.G1.Point>,
              g2: publicKeyPoint,
            },
            {
              g1: signaturePoint,
              g2: bls.G2.Point.BASE.negate(),
            },
          ])
        }
        const signaturePoint = bls.G2.Point.fromBytes(signature)
        const publicKeyPoint = bls.G1.Point.fromBytes(publicKey)
        const payloadPoint = curve.hashToCurve(
          payload,
          dst ? { DST: dst } : undefined,
        )
        return bls.pairingBatch([
          {
            g1: publicKeyPoint.negate(),
            g2: payloadPoint as InstanceType<typeof bls.G2.Point>,
          },
          { g1: bls.G1.Point.BASE, g2: signaturePoint },
        ])
      })()
      return bls.fields.Fp12.eql(pairing, bls.fields.Fp12.ONE)
    },
  },
  Ed25519: {
    getPublicKey: (privateKey) => ed25519.getPublicKey(privateKey),
    randomSecretKey: () => ed25519.utils.randomSecretKey(),
    sign: (payload, privateKey) => ed25519.sign(payload, privateKey),
    toMontgomery: (publicKey) => ed25519.utils.toMontgomery(publicKey),
    toMontgomerySecret: (privateKey) =>
      ed25519.utils.toMontgomerySecret(privateKey),
    verify: (signature, payload, publicKey) =>
      ed25519.verify(signature, payload, publicKey),
  },
  Hash: {
    blake3: (input) => blake3(input),
    hmacSha256: (key, message) => hmac(sha256, key, message),
    keccak256: (input) => keccak_256(input),
    ripemd160: (input) => ripemd160(input),
    sha256: (input) => sha256(input),
  },
  Keystore: {
    aesCtrDecrypt: (key, iv, data) => ctr(key, iv).decrypt(data),
    aesCtrEncrypt: (key, iv, data) => ctr(key, iv).encrypt(data),
    pbkdf2Sha256: (password, salt, options) =>
      pbkdf2(sha256, password, salt, options),
    pbkdf2Sha256Async: (password, salt, options) =>
      pbkdf2Async(sha256, password, salt, options),
    scrypt: (password, salt, options) => scrypt(password, salt, options),
    scryptAsync: (password, salt, options) =>
      scryptAsync(password, salt, options),
  },
  Mnemonic: {
    toSeed: (mnemonic, passphrase) => mnemonicToSeedSync(mnemonic, passphrase),
  },
  P256: {
    getPublicKey: (privateKey) => p256.getPublicKey(privateKey, false),
    getSharedSecret: (privateKey, publicKey) =>
      p256.getSharedSecret(privateKey, publicKey, true),
    randomSecretKey: () => p256.utils.randomSecretKey(),
    recoverPublicKey: (signature, payload) =>
      p256.Signature.fromBytes(signature, 'recovered')
        .recoverPublicKey(payload)
        .toBytes(false),
    sign: (payload, privateKey, options) =>
      p256.sign(payload, privateKey, {
        ...options,
        format: 'recovered',
        lowS: true,
      }),
    verify: (signature, payload, publicKey, options) =>
      p256.verify(signature, payload, publicKey, { ...options, lowS: true }),
  },
  Secp256k1: {
    getPublicKey: (privateKey) => secp256k1.getPublicKey(privateKey, false),
    getSharedSecret: (privateKey, publicKey) =>
      secp256k1.getSharedSecret(privateKey, publicKey, true),
    randomSecretKey: () => secp256k1.utils.randomSecretKey(),
    recoverPublicKey: (signature, payload) =>
      secp256k1.Signature.fromBytes(signature, 'recovered')
        .recoverPublicKey(payload)
        .toBytes(false),
    sign: (payload, privateKey, options) =>
      secp256k1.sign(payload, privateKey, {
        ...options,
        format: 'recovered',
        lowS: true,
      }),
    verify: (signature, payload, publicKey, options) =>
      secp256k1.verify(signature, payload, publicKey, {
        ...options,
        lowS: true,
      }),
  },
  X25519: {
    getPublicKey: (privateKey) => x25519.getPublicKey(privateKey),
    getSharedSecret: (privateKey, publicKey) =>
      x25519.getSharedSecret(privateKey, publicKey),
    randomSecretKey: () => x25519.utils.randomSecretKey(),
  },
}

/** Valid BLS point that no test key derives to. */
function blsSentinelPoint(group: 'G1' | 'G2') {
  const curve = group === 'G1' ? bls.G1 : bls.G2
  return curve.Point.BASE.multiply(0xdeadbeefn).toBytes()
}

/**
 * An engine whose every slot returns a fixed, wrong answer.
 *
 * Used to prove a call site actually consults the engine. If a result is
 * unchanged after installing this, ox reached its default implementation
 * directly and that slot is not wired up.
 */
export const sentinel: Engine.Engine = {
  // Points must deserialize, so the sentinel is a valid point rather than a
  // fill pattern. The scalar is arbitrary but large enough not to collide with
  // the small private keys tests use.
  Bls: {
    aggregate: (_, group) => blsSentinelPoint(group),
    getPublicKey: (_, group) => blsSentinelPoint(group),
    sign: (_payload, _privateKey, { group }) => blsSentinelPoint(group),
    verify: () => false,
  },
  Ed25519: {
    getPublicKey: () => new Uint8Array(32).fill(0xe1),
    sign: () => new Uint8Array(64).fill(0xe2),
    verify: () => false,
  },
  Hash: {
    blake3: () => new Uint8Array(32).fill(0xb1),
    hmacSha256: () => new Uint8Array(32).fill(0xb2),
    keccak256: () => new Uint8Array(32).fill(0xb3),
    ripemd160: () => new Uint8Array(20).fill(0xb4),
    sha256: () => new Uint8Array(32).fill(0xb5),
  },
  Keystore: {
    pbkdf2Sha256: () => new Uint8Array(32).fill(0xc1),
    scrypt: () => new Uint8Array(32).fill(0xc2),
  },
  Mnemonic: {
    toSeed: () => new Uint8Array(64).fill(0xd1),
  },
  X25519: {
    getPublicKey: () => new Uint8Array(32).fill(0xf1),
    getSharedSecret: () => new Uint8Array(32).fill(0xf2),
  },
}
