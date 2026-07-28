import { fc, test } from '@fast-check/vitest'
import { pbkdf2 as pbkdf2_noble } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { beforeAll, describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as WasmHash from '../Hash.js'
import * as WasmKeystore from '../Keystore.js'

let hash: WasmHash.create.ReturnType
let keystore: WasmKeystore.create.ReturnType

beforeAll(async () => {
  ;[hash, keystore] = await Promise.all([
    WasmHash.create(),
    WasmKeystore.create(),
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
      expect(
        keystore.Keystore.pbkdf2Sha256(password, salt, { c, dkLen }),
      ).toEqual(pbkdf2_noble(sha256, password, salt, { c, dkLen }))
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
        keystore.Keystore.pbkdf2Sha256(password_.view, salt_.view, {
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
    const derived = keystore.Keystore.pbkdf2Sha256(input, input, {
      c: 2,
      dkLen,
    })
    const snapshot = derived.slice()
    expect(hash.Hash.sha256(input)).toEqual(sha256(input))
    expect(derived).toEqual(snapshot)
  })
})
