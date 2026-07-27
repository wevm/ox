import { secp256k1 } from '@noble/curves/secp256k1.js'
import {
  Address,
  BinaryStateTree,
  Bls,
  Bytes,
  Ed25519,
  Engine,
  Hash,
  Hex,
  Keystore,
  Mnemonic,
  P256,
  Secp256k1,
  X25519,
} from 'ox'
import { describe, expect, test, vi } from 'vp/test'
import {
  identity as identityEngine,
  sentinel as sentinelEngine,
} from '../../../test/engines.js'

const privateKey =
  '0x0000000000000000000000000000000000000000000000000000000000000001'
const otherPrivateKey =
  '0x0000000000000000000000000000000000000000000000000000000000000002'
const payload = '0xdeadbeef'
const mnemonic = 'test test test test test test test test test test test junk'

// Inserting a leaf then merkelizing is the only path that reaches blake3.
function merkelize() {
  const tree = BinaryStateTree.create()
  BinaryStateTree.insert(
    tree,
    new Uint8Array(32).fill(1),
    new Uint8Array(32).fill(2),
  )
  return BinaryStateTree.merkelize(tree)
}

describe('set', () => {
  test('behavior: empty engine is a no-op', () => {
    const before = Hash.keccak256(payload)
    Engine.set({})
    expect(Hash.keccak256(payload)).toEqual(before)
  })

  test('behavior: empty slot falls back to the default', () => {
    const before = Hash.keccak256(payload)
    Engine.set({ Hash: {} })
    expect(Hash.keccak256(payload)).toEqual(before)
  })

  test('behavior: identity engine changes nothing', () => {
    const expected = {
      blake3: merkelize(),
      blsPublicKey: Bls.getPublicKey({ privateKey }),
      blsSignature: Bls.sign({ payload, privateKey }),
      ed25519PublicKey: Ed25519.getPublicKey({ privateKey }),
      hmac256: Hash.hmac256('0xbeef', payload),
      keccak256: Hash.keccak256(payload),
      p256Signature: P256.sign({ payload, privateKey }),
      ripemd160: Hash.ripemd160(payload),
      secp256k1PublicKey: Secp256k1.getPublicKey({ privateKey }),
      secp256k1Signature: Secp256k1.sign({ payload, privateKey }),
      seed: Mnemonic.toSeed(mnemonic),
      sha256: Hash.sha256(payload),
      x25519SharedSecret: X25519.getSharedSecret({
        privateKey,
        publicKey: X25519.getPublicKey({ privateKey }),
      }),
    }

    Engine.set(identityEngine)

    expect({
      blake3: merkelize(),
      blsPublicKey: Bls.getPublicKey({ privateKey }),
      blsSignature: Bls.sign({ payload, privateKey }),
      ed25519PublicKey: Ed25519.getPublicKey({ privateKey }),
      hmac256: Hash.hmac256('0xbeef', payload),
      keccak256: Hash.keccak256(payload),
      p256Signature: P256.sign({ payload, privateKey }),
      ripemd160: Hash.ripemd160(payload),
      secp256k1PublicKey: Secp256k1.getPublicKey({ privateKey }),
      secp256k1Signature: Secp256k1.sign({ payload, privateKey }),
      seed: Mnemonic.toSeed(mnemonic),
      sha256: Hash.sha256(payload),
      x25519SharedSecret: X25519.getSharedSecret({
        privateKey,
        publicKey: X25519.getPublicKey({ privateKey }),
      }),
    }).toEqual(expected)
  })

  test('behavior: identity engine round-trips a keystore', () => {
    Engine.set(identityEngine)
    const [key, options] = Keystore.pbkdf2({ iterations: 1000, password: 'pw' })
    const encrypted = Keystore.encrypt(Bytes.from('0xdeadbeef'), key, options)
    expect(Keystore.decrypt(encrypted, key, { as: 'Hex' })).toEqual(
      '0xdeadbeef',
    )
  })

  test('behavior: merges across calls', () => {
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    Engine.set({ Hash: { sha256: () => new Uint8Array(32).fill(2) } })
    expect(Hash.keccak256(payload, { as: 'Bytes' })[0]).toBe(1)
    expect(Hash.sha256(payload, { as: 'Bytes' })[0]).toBe(2)
  })

  test('behavior: replaces a previously set function', () => {
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(3) } })
    expect(Hash.keccak256(payload, { as: 'Bytes' })[0]).toBe(3)
  })

  test('behavior: an undefined slot is removed', () => {
    const before = Hash.keccak256(payload)
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    Engine.set({ Hash: undefined })
    expect(Engine.get()).toEqual({})
    expect(Hash.keccak256(payload)).toEqual(before)
  })

  test('behavior: invalidates caches derived from a swapped primitive', () => {
    const address = '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
    const checksummed = Address.checksum(address)
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32) } })
    expect(Address.checksum(address)).not.toEqual(checksummed)
  })

  test('behavior: does not affect the `noble` escape hatches', () => {
    Engine.set({
      Secp256k1: { sign: () => new Uint8Array(65).fill(9) },
    })
    expect(
      Secp256k1.noble.sign(Bytes.from(payload), Bytes.from(privateKey), {
        format: 'recovered',
        lowS: true,
      }),
    ).not.toEqual(new Uint8Array(65).fill(9))
  })

  test('behavior: async slots resolve independently of sync slots', async () => {
    const scrypt = vi.fn(() => new Uint8Array(32).fill(1))
    Engine.set({ Keystore: { scrypt } })

    Keystore.scrypt({ n: 1024, password: 'pw', r: 1, p: 1 })
    expect(scrypt).toHaveBeenCalledTimes(1)

    await Keystore.scryptAsync({ n: 1024, password: 'pw', r: 1, p: 1 })
    expect(scrypt).toHaveBeenCalledTimes(1)
  })

  test('error: unknown slot', () => {
    expect(() =>
      Engine.set({ Keccak: {} } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Engine.UnknownSlotError: \`Keccak\` is not a valid engine slot.

      Valid slots: Bls, Ed25519, Hash, Keystore, Mnemonic, P256, Secp256k1, X25519]
    `,
    )
  })
})

describe('get', () => {
  test('default', () => {
    expect(Engine.get()).toEqual({})
  })

  test('behavior: returns only overrides', () => {
    const keccak256 = () => new Uint8Array(32)
    Engine.set({ Hash: { keccak256 } })
    expect(Engine.get()).toEqual({ Hash: { keccak256 } })
  })

  test('behavior: returns a copy', () => {
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    const engine = Engine.get()
    delete engine.Hash
    expect(Hash.keccak256(payload, { as: 'Bytes' })[0]).toBe(1)
  })
})

describe('reset', () => {
  test('behavior: resets every slot', () => {
    const before = Hash.keccak256(payload)
    Engine.set({
      Hash: { keccak256: () => new Uint8Array(32) },
      Secp256k1: { sign: () => new Uint8Array(65) },
    })
    Engine.reset()
    expect(Engine.get()).toEqual({})
    expect(Hash.keccak256(payload)).toEqual(before)
  })

  test('behavior: resets a single slot', () => {
    const sign = () => new Uint8Array(65)
    Engine.set({
      Hash: { keccak256: () => new Uint8Array(32) },
      Secp256k1: { sign },
    })
    Engine.reset('Hash')
    expect(Engine.get()).toEqual({ Secp256k1: { sign } })
  })
})

describe('with', () => {
  test('default', () => {
    const hash = Engine.with(
      { Hash: { keccak256: () => new Uint8Array(32) } },
      () => Hash.keccak256(payload),
    )
    expect(hash).toEqual(Hex.fromBytes(new Uint8Array(32)))
    expect(Engine.get()).toEqual({})
  })

  test('behavior: restores on throw', () => {
    expect(() =>
      Engine.with({ Hash: { keccak256: () => new Uint8Array(32) } }, () => {
        throw new Error('oh no')
      }),
    ).toThrow('oh no')
    expect(Engine.get()).toEqual({})
  })

  test('behavior: restores the previous engine, not the default', () => {
    const keccak256 = () => new Uint8Array(32).fill(1)
    Engine.set({ Hash: { keccak256 } })
    Engine.with({ Hash: { keccak256: () => new Uint8Array(32).fill(2) } }, () =>
      Hash.keccak256(payload),
    )
    expect(Hash.keccak256(payload, { as: 'Bytes' })[0]).toBe(1)
  })

  test('behavior: nests', () => {
    const outer = Engine.with(
      { Hash: { keccak256: () => new Uint8Array(32).fill(1) } },
      () =>
        Engine.with(
          { Hash: { keccak256: () => new Uint8Array(32).fill(2) } },
          () => Hash.keccak256(payload, { as: 'Bytes' })[0],
        ),
    )
    expect(outer).toBe(2)
    expect(Engine.get()).toEqual({})
  })

  test('error: async function', () => {
    expect(() =>
      Engine.with({}, async () => {}),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Engine.AsyncScopeError: \`Engine.with\` cannot be used with an asynchronous function.

      The engine is process-wide, so a scoped override cannot be held across an \`await\`.
      Use \`Engine.set\` instead.]
    `,
    )
    expect(Engine.get()).toEqual({})
  })
})

describe('interception', () => {
  const cases = [
    [
      'Hash.keccak256',
      { Hash: { keccak256: () => new Uint8Array(32).fill(1) } },
      () => Hash.keccak256(payload, { as: 'Bytes' }),
    ],
    [
      'Hash.sha256',
      { Hash: { sha256: () => new Uint8Array(32).fill(1) } },
      () => Hash.sha256(payload, { as: 'Bytes' }),
    ],
    [
      'Hash.ripemd160',
      { Hash: { ripemd160: () => new Uint8Array(32).fill(1) } },
      () => Hash.ripemd160(payload, { as: 'Bytes' }),
    ],
    [
      'Hash.hmac256',
      { Hash: { hmacSha256: () => new Uint8Array(32).fill(1) } },
      () => Hash.hmac256('0xbeef', payload, { as: 'Bytes' }),
    ],
    [
      'BinaryStateTree.merkelize',
      { Hash: { blake3: () => new Uint8Array(32).fill(1) } },
      () => merkelize(),
    ],
    [
      'Secp256k1.getPublicKey',
      {
        Secp256k1: {
          getPublicKey: () =>
            secp256k1.getPublicKey(Bytes.from(otherPrivateKey), false),
        },
      },
      () => Secp256k1.getPublicKey({ privateKey }),
    ],
    [
      'Secp256k1.getSharedSecret',
      { Secp256k1: { getSharedSecret: () => new Uint8Array(32).fill(1) } },
      () =>
        Secp256k1.getSharedSecret({
          as: 'Bytes',
          privateKey,
          publicKey: Secp256k1.getPublicKey({ privateKey }),
        }),
    ],
    [
      'Secp256k1.randomPrivateKey',
      { Secp256k1: { randomSecretKey: () => new Uint8Array(32).fill(1) } },
      () => Secp256k1.randomPrivateKey({ as: 'Bytes' }),
    ],
    [
      'Secp256k1.sign',
      { Secp256k1: { sign: () => new Uint8Array(65).fill(1) } },
      () => Secp256k1.sign({ payload, privateKey }),
    ],
    [
      'Secp256k1.verify',
      { Secp256k1: { verify: () => false } },
      () =>
        Secp256k1.verify({
          payload,
          publicKey: Secp256k1.getPublicKey({ privateKey }),
          signature: Secp256k1.sign({ payload, privateKey }),
        }),
    ],
    [
      'Secp256k1.recoverPublicKey',
      {
        Secp256k1: {
          recoverPublicKey: () =>
            secp256k1.getPublicKey(Bytes.from(otherPrivateKey), false),
        },
      },
      () =>
        Secp256k1.recoverPublicKey({
          payload,
          signature: Secp256k1.sign({ payload, privateKey }),
        }),
    ],
    [
      'P256.sign',
      { P256: { sign: () => new Uint8Array(65).fill(1) } },
      () => P256.sign({ payload, privateKey }),
    ],
    [
      'P256.verify',
      { P256: { verify: () => false } },
      () =>
        P256.verify({
          payload,
          publicKey: P256.getPublicKey({ privateKey }),
          signature: P256.sign({ payload, privateKey }),
        }),
    ],
    [
      'Ed25519.sign',
      { Ed25519: { sign: () => new Uint8Array(64).fill(1) } },
      () => Ed25519.sign({ payload, privateKey }),
    ],
    [
      'Ed25519.verify',
      { Ed25519: { verify: () => false } },
      () =>
        Ed25519.verify({
          payload,
          publicKey: Ed25519.getPublicKey({ privateKey }),
          signature: Ed25519.sign({ payload, privateKey }),
        }),
    ],
    [
      'X25519.getSharedSecret',
      { X25519: { getSharedSecret: () => new Uint8Array(32).fill(1) } },
      () =>
        X25519.getSharedSecret({
          as: 'Bytes',
          privateKey,
          publicKey: X25519.getPublicKey({ privateKey }),
        }),
    ],
    [
      'Mnemonic.toSeed',
      { Mnemonic: { toSeed: () => new Uint8Array(64).fill(1) } },
      () => Mnemonic.toSeed(mnemonic),
    ],
  ] as const satisfies readonly (readonly [
    string,
    Engine.Engine,
    () => unknown,
  ])[]

  test.each(cases)('%s routes through the engine', (_name, engine, invoke) => {
    const before = invoke()
    Engine.set(engine)
    expect(invoke()).not.toEqual(before)
  })
})

describe('Bls', () => {
  test('behavior: identity engine verifies its own signature', () => {
    Engine.set(identityEngine)
    const publicKey = Bls.getPublicKey({ privateKey })
    const signature = Bls.sign({ payload, privateKey })
    expect(Bls.verify({ payload, publicKey, signature })).toBe(true)
  })

  test('behavior: aggregate is routed through the engine', () => {
    const publicKeys = [
      Bls.getPublicKey({ privateKey }),
      Bls.getPublicKey({ privateKey: otherPrivateKey }),
    ]
    const before = Bls.aggregate(publicKeys)
    Engine.set(sentinelEngine)
    expect(Bls.aggregate(publicKeys)).not.toEqual(before)
  })

  test('behavior: getPublicKey is routed through the engine', () => {
    const before = Bls.getPublicKey({ privateKey })
    Engine.set(sentinelEngine)
    expect(Bls.getPublicKey({ privateKey })).not.toEqual(before)
  })

  test('behavior: sign is routed through the engine', () => {
    const before = Bls.sign({ payload, privateKey })
    Engine.set(sentinelEngine)
    expect(Bls.sign({ payload, privateKey })).not.toEqual(before)
  })

  test('behavior: verify is routed through the engine', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    const signature = Bls.sign({ payload, privateKey })
    expect(Bls.verify({ payload, publicKey, signature })).toBe(true)
    Engine.set(sentinelEngine)
    expect(Bls.verify({ payload, publicKey, signature })).toBe(false)
  })

  test('behavior: long-key:short-sig routes through the engine', () => {
    Engine.set(identityEngine)
    const size = 'long-key:short-sig'
    const publicKey = Bls.getPublicKey({ privateKey, size })
    const signature = Bls.sign({ payload, privateKey, size })
    expect(Bls.verify({ payload, publicKey, signature })).toBe(true)
  })
})

describe('merge semantics', () => {
  test('behavior: a primitive cleared to undefined stops being reported', () => {
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    expect(Object.keys(Engine.get().Hash ?? {})).toMatchInlineSnapshot(`
      [
        "keccak256",
      ]
    `)

    Engine.set({ Hash: { keccak256: undefined } })
    // Calls already fell through to the default; the point is that `get` no
    // longer claims an override that is not there.
    expect(Object.keys(Engine.get().Hash ?? {})).toMatchInlineSnapshot('[]')
    expect(Hash.keccak256(payload)).toEqual(
      Hash.keccak256(payload, { as: 'Hex' }),
    )
  })

  test('behavior: the returned engine cannot mutate the registry', () => {
    Engine.set({ Hash: { keccak256: () => new Uint8Array(32).fill(1) } })
    const snapshot = Engine.get()

    snapshot.Hash!.keccak256 = () => new Uint8Array(32).fill(2)

    // Writing through the snapshot would change what ox calls without going
    // through `set`, so without clearing the caches derived from it.
    expect(Hash.keccak256(payload, { as: 'Bytes' })[0]).toBe(1)
  })
})
