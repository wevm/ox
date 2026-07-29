import { fc, test } from '@fast-check/vitest'
import { pbkdf2 as pbkdf2_noble } from '@noble/hashes/pbkdf2.js'
import { scrypt as scrypt_noble } from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { beforeAll, describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as WasmHash from '../Hash.js'
import * as WasmKeystore from '../Keystore.js'

let hash: WasmHash.engine.ReturnType
let keystore: WasmKeystore.engine.ReturnType

beforeAll(async () => {
  ;[hash, keystore] = await Promise.all([
    WasmHash.engine(),
    WasmKeystore.engine(),
  ])
})

const arbitraryPassword = fc.oneof(
  {
    arbitrary: fc
      .constantFrom(0, 1, 32, 63, 64, 65, 128, 129)
      .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
    weight: 3,
  },
  { arbitrary: fc.uint8Array({ maxLength: 200 }), weight: 2 },
)

const arbitrarySalt = fc.oneof(
  {
    arbitrary: fc
      .constantFrom(0, 1, 31, 32, 51, 52, 55, 56, 63, 64, 65, 136)
      .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
    weight: 3,
  },
  { arbitrary: fc.uint8Array({ maxLength: 200 }), weight: 2 },
)

const arbitraryDkLen = fc.oneof(
  {
    arbitrary: fc.constantFrom(1, 2, 31, 32, 33, 63, 64, 65, 96, 97),
    weight: 3,
  },
  { arbitrary: fc.integer({ max: 256, min: 1 }), weight: 2 },
)

function asSubview(input: Uint8Array) {
  const backing = new Uint8Array(input.length + 11).fill(0xa5)
  backing.set(input, 7)
  return { backing, view: backing.subarray(7, 7 + input.length) }
}

describe('pbkdf2Sha256', () => {
  test.prop(
    {
      c: fc.integer({ max: 20, min: 1 }),
      dkLen: arbitraryDkLen,
      password: arbitraryPassword,
      salt: arbitrarySalt,
    },
    { numRuns },
  )(
    'matches @noble/hashes for arbitrary inputs and output lengths',
    ({ c, dkLen, password, salt }) => {
      expect(keystore.pbkdf2Sha256(password, salt, { c, dkLen })).toEqual(
        pbkdf2_noble(sha256, password, salt, { c, dkLen }),
      )
    },
  )

  test.prop(
    {
      c: fc.integer({ max: 10, min: 1 }),
      dkLen: arbitraryDkLen,
      password: arbitraryPassword,
      salt: arbitrarySalt,
    },
    { numRuns },
  )(
    'handles subviews without mutating either backing buffer',
    ({ c, dkLen, password, salt }) => {
      const password_ = asSubview(password)
      const salt_ = asSubview(salt)
      const passwordSnapshot = password_.backing.slice()
      const saltSnapshot = salt_.backing.slice()

      expect(
        keystore.pbkdf2Sha256(password_.view, salt_.view, {
          c,
          dkLen,
        }),
      ).toEqual(pbkdf2_noble(sha256, password_.view, salt_.view, { c, dkLen }))
      expect(password_.backing).toEqual(passwordSnapshot)
      expect(salt_.backing).toEqual(saltSnapshot)
    },
  )

  test.prop(
    {
      dkLen: arbitraryDkLen,
      input: fc.uint8Array({ maxLength: 256 }),
    },
    { numRuns },
  )('shares memory safely with hash calls', ({ dkLen, input }) => {
    const derived = keystore.pbkdf2Sha256(input, input, {
      c: 2,
      dkLen,
    })
    const snapshot = derived.slice()
    expect(hash.sha256(input)).toEqual(sha256(input))
    expect(derived).toEqual(snapshot)
  })
})

describe('scrypt', () => {
  test.prop(
    {
      dkLen: arbitraryDkLen,
      logN: fc.integer({ max: 7, min: 1 }),
      p: fc.integer({ max: 3, min: 1 }),
      password: arbitraryPassword,
      r: fc.integer({ max: 4, min: 1 }),
      salt: arbitrarySalt,
    },
    { numRuns },
  )(
    'matches @noble/hashes for arbitrary parameters and inputs',
    ({ dkLen, logN, p, password, r, salt }) => {
      const options = { N: 2 ** logN, dkLen, p, r }
      expect(keystore.scrypt(password, salt, options)).toEqual(
        scrypt_noble(password, salt, options),
      )
    },
  )

  test.prop(
    {
      dkLen: arbitraryDkLen,
      logN: fc.integer({ max: 7, min: 1 }),
      p: fc.integer({ max: 3, min: 1 }),
      password: arbitraryPassword,
      r: fc.integer({ max: 4, min: 1 }),
      salt: arbitrarySalt,
    },
    { numRuns },
  )(
    'handles subviews without mutating either backing buffer',
    ({ dkLen, logN, p, password, r, salt }) => {
      const password_ = asSubview(password)
      const salt_ = asSubview(salt)
      const passwordSnapshot = password_.backing.slice()
      const saltSnapshot = salt_.backing.slice()
      const options = { N: 2 ** logN, dkLen, p, r }

      expect(keystore.scrypt(password_.view, salt_.view, options)).toEqual(
        scrypt_noble(password_.view, salt_.view, options),
      )
      expect(password_.backing).toEqual(passwordSnapshot)
      expect(salt_.backing).toEqual(saltSnapshot)
    },
  )
})
