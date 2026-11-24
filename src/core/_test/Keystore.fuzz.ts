import { fc, test } from '@fast-check/vitest'
import { scrypt } from '@noble/hashes/scrypt'
import { Bytes, Keystore } from 'ox'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

describe('Keystore.scrypt', () => {
  test.prop(
    {
      password: fc.string({ maxLength: 16 }),
      salt: fc.uint8Array({ minLength: 0, maxLength: 32 }),
      n: fc.constantFrom(2, 4, 16, 64),
      r: fc.integer({ min: 1, max: 8 }),
      p: fc.integer({ min: 1, max: 4 }),
      iv: fc.uint8Array({ minLength: 16, maxLength: 16 }),
    },
    // Each case derives three scrypt keys.
    { numRuns: Math.min(numRuns, 300) },
  )(
    'scrypt and scryptAsync derive the key noble does, and toKeyAsync reads it back',
    async ({ password, salt, n, r, p, iv }) => {
      const options = { password, salt, n, r, p, iv }
      const expected = Bytes.toHex(
        scrypt(password, salt, { N: n, r, p, dkLen: 32 }),
      )
      const [key, opts] = Keystore.scrypt(options)
      const [keyAsync, optsAsync] = await Keystore.scryptAsync(options)
      expect(key()).toBe(expected)
      expect(keyAsync()).toBe(expected)
      expect(optsAsync).toEqual(opts)
      const keystore = Keystore.encrypt(Bytes.random(32), key, opts)
      const read = await Keystore.toKeyAsync(keystore, { password })
      expect(typeof read === 'function' ? read() : read).toBe(expected)
    },
  )
})
