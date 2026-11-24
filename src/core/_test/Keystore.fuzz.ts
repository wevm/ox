import { fc, test } from '@fast-check/vitest'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as keystore from '../internal/keystore.js'

describe('pbkdf2Sha256Async', () => {
  test.prop(
    {
      c: fc.integer({ max: 20, min: 1 }),
      dkLen: fc.integer({ max: 97, min: 1 }),
      password: fc.uint8Array({ maxLength: 80 }),
      salt: fc.uint8Array({ maxLength: 80 }),
    },
    { numRuns },
  )('derives the key noble derives', async ({ c, dkLen, password, salt }) => {
    expect(
      await keystore.pbkdf2Sha256Async(password, salt, { c, dkLen }),
    ).toEqual(pbkdf2(sha256, password, salt, { c, dkLen }))
  })
})
