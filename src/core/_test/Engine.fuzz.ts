import { fc, test } from '@fast-check/vitest'
import {
  Bls,
  Ed25519,
  Engine,
  Hash,
  Keystore,
  Mnemonic,
  P256,
  Secp256k1,
  X25519,
} from 'ox'
import { afterEach, describe, expect } from 'vp/test'
import { identity, sentinel } from '../../../test/engines.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const arbitraryBytes = fc.uint8Array({ maxLength: 256, minLength: 0 })
/**
 * A 32-byte scalar that is a valid private key on every curve ox uses.
 *
 * Built compositionally rather than by filtering, so no candidate is ever
 * rejected: a leading byte in `[0x01, 0x72]` is clear of zero and below every
 * order in play. BLS12-381 sets the ceiling, not the 256-bit curves -- its
 * scalar field is `0x73eda753…`, so anything above `0x72` reduces rather than
 * being used as given, which would quietly narrow what the fuzz explores.
 */
const arbitraryPrivateKey = fc
  .tuple(
    fc.integer({ max: 0x72, min: 0x01 }),
    fc.uint8Array({ maxLength: 31, minLength: 31 }),
  )
  .map(([first, rest]) => Uint8Array.of(first, ...rest))

afterEach(() => {
  Engine.reset()
})

/**
 * Each entry runs one routed call site. `run` must be deterministic given its
 * inputs, so that the same call before and after installing an engine can be
 * compared directly.
 */
const callSites = [
  {
    name: 'Hash.blake3',
    run: (bytes: Uint8Array) => Hash.blake3(bytes),
  },
  {
    name: 'Hash.keccak256',
    run: (bytes: Uint8Array) => Hash.keccak256(bytes),
  },
  {
    name: 'Hash.sha256',
    run: (bytes: Uint8Array) => Hash.sha256(bytes),
  },
  {
    name: 'Hash.ripemd160',
    run: (bytes: Uint8Array) => Hash.ripemd160(bytes),
  },
  {
    name: 'Hash.hmac256',
    run: (bytes: Uint8Array) => Hash.hmac256(new Uint8Array(32).fill(7), bytes),
  },
] as const

describe('identity engine', () => {
  test.prop({ bytes: arbitraryBytes }, { numRuns })(
    'leaves every hash call site unchanged',
    ({ bytes }) => {
      const before = callSites.map((site) => site.run(bytes))
      Engine.set(identity)
      expect(callSites.map((site) => site.run(bytes))).toEqual(before)
    },
  )

  test.prop(
    { payload: arbitraryBytes, privateKey: arbitraryPrivateKey },
    {
      numRuns,
    },
  )('leaves secp256k1 unchanged', ({ payload, privateKey }) => {
    const before = {
      publicKey: Secp256k1.getPublicKey({ privateKey }),
      signature: Secp256k1.sign({ payload, privateKey }),
    }
    const recovered = Secp256k1.recoverPublicKey({
      payload,
      signature: before.signature,
    })

    Engine.set(identity)

    expect(Secp256k1.getPublicKey({ privateKey })).toEqual(before.publicKey)
    expect(Secp256k1.sign({ payload, privateKey })).toEqual(before.signature)
    expect(
      Secp256k1.recoverPublicKey({ payload, signature: before.signature }),
    ).toEqual(recovered)
    expect(
      Secp256k1.verify({
        payload,
        publicKey: before.publicKey,
        signature: before.signature,
      }),
    ).toBe(true)
  })

  test.prop(
    { payload: arbitraryBytes, privateKey: arbitraryPrivateKey },
    {
      numRuns,
    },
  )('leaves P256 unchanged', ({ payload, privateKey }) => {
    const publicKey = P256.getPublicKey({ privateKey })
    const signature = P256.sign({ payload, privateKey })

    Engine.set(identity)

    expect(P256.getPublicKey({ privateKey })).toEqual(publicKey)
    expect(P256.sign({ payload, privateKey })).toEqual(signature)
    expect(P256.verify({ payload, publicKey, signature })).toBe(true)
  })

  test.prop(
    { payload: arbitraryBytes, privateKey: arbitraryPrivateKey },
    { numRuns },
  )('leaves Ed25519 and X25519 unchanged', ({ payload, privateKey }) => {
    const before = {
      ed25519PublicKey: Ed25519.getPublicKey({ privateKey }),
      signature: Ed25519.sign({ payload, privateKey }),
      x25519PublicKey: X25519.getPublicKey({ privateKey }),
    }
    const sharedSecret = X25519.getSharedSecret({
      privateKey,
      publicKey: before.x25519PublicKey,
    })

    Engine.set(identity)

    expect(Ed25519.getPublicKey({ privateKey })).toEqual(
      before.ed25519PublicKey,
    )
    expect(Ed25519.sign({ payload, privateKey })).toEqual(before.signature)
    expect(X25519.getPublicKey({ privateKey })).toEqual(before.x25519PublicKey)
    expect(
      X25519.getSharedSecret({
        privateKey,
        publicKey: before.x25519PublicKey,
      }),
    ).toEqual(sharedSecret)
  })

  test.prop({ password: fc.string({ maxLength: 64 }) }, { numRuns: 10 })(
    'leaves Keystore key derivation unchanged',
    ({ password }) => {
      // The smallest parameters ox accepts -- these run per { numRuns } case, and
      // scrypt's real defaults take seconds. `iv` is pinned because it defaults
      // to random, and the returned key is a thunk, so compare derived material
      // rather than the returned tuple.
      const options = {
        iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
        password,
        salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      } as const
      const before = {
        pbkdf2: Keystore.pbkdf2({ ...options, iterations: 1000 })[0](),
        scrypt: Keystore.scrypt({ ...options, n: 1024, p: 1, r: 1 })[0](),
      }

      Engine.set(identity)

      expect(Keystore.pbkdf2({ ...options, iterations: 1000 })[0]()).toEqual(
        before.pbkdf2,
      )
      expect(Keystore.scrypt({ ...options, n: 1024, p: 1, r: 1 })[0]()).toEqual(
        before.scrypt,
      )
    },
  )

  test.prop(
    { payload: arbitraryBytes, privateKey: arbitraryPrivateKey },
    { numRuns: Math.min(numRuns, 10) },
  )('leaves Bls unchanged', ({ payload, privateKey }) => {
    const before = {
      publicKey: Bls.getPublicKey({ privateKey }),
      signature: Bls.sign({ payload, privateKey }),
    }

    Engine.set(identity)

    expect(Bls.getPublicKey({ privateKey })).toEqual(before.publicKey)
    expect(Bls.sign({ payload, privateKey })).toEqual(before.signature)
    expect(
      Bls.verify({
        payload,
        publicKey: before.publicKey,
        signature: before.signature,
      }),
    ).toBe(true)
  })

  test.prop({ passphrase: fc.string({ maxLength: 32 }) }, { numRuns })(
    'leaves Mnemonic.toSeed unchanged',
    ({ passphrase }) => {
      const mnemonic =
        'test test test test test test test test test test test junk'
      const before = Mnemonic.toSeed(mnemonic, { passphrase })
      Engine.set(identity)
      expect(Mnemonic.toSeed(mnemonic, { passphrase })).toEqual(before)
    },
  )
})

describe('sentinel engine', () => {
  test.prop({ bytes: arbitraryBytes }, { numRuns })(
    'is consulted by every hash call site',
    ({ bytes }) => {
      // The inverse of the identity property: if a result survives a wrong
      // implementation, the call site never reached the engine at all.
      const before = callSites.map((site) => site.run(bytes))
      Engine.set(sentinel)
      const after = callSites.map((site) => site.run(bytes))
      for (const [index, site] of callSites.entries())
        expect(after[index], site.name).not.toEqual(before[index])
    },
  )
})

describe('with', () => {
  test.prop(
    { bytes: arbitraryBytes, depth: fc.integer({ max: 6, min: 1 }) },
    { numRuns },
  )('restores the engine at every nesting depth', ({ bytes, depth }) => {
    const expected = Hash.keccak256(bytes)

    function nest(level: number): void {
      if (level === 0) return
      Engine.with(
        { Hash: { keccak256: () => new Uint8Array(32).fill(level) } },
        () => {
          expect(Hash.keccak256(bytes, { as: 'Bytes' })[0]).toBe(level)
          nest(level - 1)
          // Unwinding must restore *this* level, not the default.
          expect(Hash.keccak256(bytes, { as: 'Bytes' })[0]).toBe(level)
        },
      )
    }

    nest(depth)
    expect(Engine.get()).toEqual({})
    expect(Hash.keccak256(bytes)).toEqual(expected)
  })

  test.prop({ bytes: arbitraryBytes }, { numRuns })(
    'restores the engine when the callback throws',
    ({ bytes }) => {
      const expected = Hash.keccak256(bytes)
      expect(() =>
        Engine.with({ Hash: { keccak256: () => new Uint8Array(32) } }, () => {
          throw new Error('boom')
        }),
      ).toThrow('boom')
      expect(Hash.keccak256(bytes)).toEqual(expected)
    },
  )
})

describe('merge', () => {
  const slotNames = ['Hash', 'Secp256k1', 'P256', 'Ed25519', 'X25519'] as const

  test.prop(
    {
      slots: fc.array(fc.constantFrom(...slotNames), {
        maxLength: 8,
        minLength: 1,
      }),
    },
    { numRuns },
  )('accumulates slots across calls in any order', ({ slots }) => {
    for (const slot of slots) Engine.set({ [slot]: {} })
    expect(Object.keys(Engine.get()).sort()).toEqual([...new Set(slots)].sort())
  })

  test.prop(
    {
      slots: fc.array(fc.constantFrom(...slotNames), {
        maxLength: 8,
        minLength: 1,
      }),
    },
    { numRuns },
  )('reset clears whatever was accumulated', ({ slots }) => {
    for (const slot of slots) Engine.set({ [slot]: {} })
    Engine.reset()
    expect(Engine.get()).toEqual({})
  })
})
