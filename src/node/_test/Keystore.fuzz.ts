import { ctr } from '@noble/ciphers/aes.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { fc, test } from '@fast-check/vitest'
import { expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as Keystore from '../Keystore.js'

const subview = (bytes: Uint8Array) => {
  const value = new Uint8Array(bytes.length + 4)
  value.set(bytes, 2)
  return value.subarray(2, bytes.length + 2)
}

const arbitraryKey = fc
  .oneof(
    fc.uint8Array({ maxLength: 16, minLength: 16 }),
    fc.uint8Array({ maxLength: 24, minLength: 24 }),
    fc.uint8Array({ maxLength: 32, minLength: 32 }),
  )
  .map(subview)

test.prop(
  {
    data: fc.uint8Array({ maxLength: 256 }).map(subview),
    iv: fc.uint8Array({ maxLength: 16, minLength: 16 }).map(subview),
    key: arbitraryKey,
  },
  { numRuns },
)('Node AES-CTR agrees with the default', async ({ data, iv, key }) => {
  const { aesCtrDecrypt, aesCtrEncrypt } = (await Keystore.create()).Keystore
  const expected = ctr(key, iv).encrypt(data)
  const encrypted = aesCtrEncrypt(key, iv, data)

  expect(encrypted).toEqual(expected)
  expect(aesCtrDecrypt(key, iv, encrypted)).toEqual(data)
})

test.prop(
  {
    c: fc.integer({ max: 32, min: 1 }),
    dkLen: fc.integer({ max: 96, min: 1 }),
    password: fc.uint8Array({ maxLength: 96 }).map(subview),
    salt: fc.uint8Array({ maxLength: 96 }).map(subview),
  },
  { numRuns },
)(
  'Node PBKDF2-HMAC-SHA256 agrees with the default',
  async ({ c, dkLen, password, salt }) => {
    const { pbkdf2Sha256, pbkdf2Sha256Async } = (await Keystore.create())
      .Keystore
    const expected = pbkdf2(sha256, password, salt, { c, dkLen })

    expect(pbkdf2Sha256(password, salt, { c, dkLen })).toEqual(expected)
    expect(await pbkdf2Sha256Async(password, salt, { c, dkLen })).toEqual(
      expected,
    )
  },
)
