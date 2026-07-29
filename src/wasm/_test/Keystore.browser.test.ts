import { pbkdf2 as pbkdf2_noble } from '@noble/hashes/pbkdf2.js'
import { scrypt as scrypt_noble } from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { describe, expect, test } from 'vp/test'
import * as Bytes from '../../core/Bytes.js'
import * as Engine from '../../core/Engine.js'
import * as Keystore from '../../core/Keystore.js'
import * as WasmKeystore from '../Keystore.js'

describe('engine', () => {
  test('behavior: derives arbitrary-length keys in a real browser', async () => {
    const engine = await WasmKeystore.engine()
    const password = Bytes.fromString('testpassword')
    const salt = new Uint8Array(52).fill(0xa5)

    expect(engine.pbkdf2Sha256(password, salt, { c: 3, dkLen: 65 })).toEqual(
      pbkdf2_noble(sha256, password, salt, { c: 3, dkLen: 65 }),
    )
    expect(
      engine.scrypt(password, salt, { N: 1024, dkLen: 65, p: 2, r: 1 }),
    ).toEqual(scrypt_noble(password, salt, { N: 1024, dkLen: 65, p: 2, r: 1 }))
  })

  test('behavior: ox uses synchronous WASM PBKDF2 once installed', async () => {
    const engine = await WasmKeystore.engine()
    await Engine.install({ Keystore: engine })
    try {
      const salt = new Uint8Array(32).fill(7)
      const [key] = Keystore.pbkdf2({
        iterations: 1_000,
        password: 'testpassword',
        salt,
      })
      expect(key()).toBe(
        Bytes.toHex(
          pbkdf2_noble(sha256, Bytes.fromString('testpassword'), salt, {
            c: 1_000,
            dkLen: 32,
          }),
        ),
      )
    } finally {
      Engine.reset()
    }
  })

  test('behavior: ox uses synchronous WASM scrypt once installed', async () => {
    const engine = await WasmKeystore.engine()
    await Engine.install({ Keystore: engine })
    try {
      const salt = new Uint8Array(32).fill(7)
      const [key] = Keystore.scrypt({
        n: 1024,
        p: 2,
        password: 'testpassword',
        r: 1,
        salt,
      })
      expect(key()).toBe(
        Bytes.toHex(
          scrypt_noble(Bytes.fromString('testpassword'), salt, {
            N: 1024,
            dkLen: 32,
            p: 2,
            r: 1,
          }),
        ),
      )
    } finally {
      Engine.reset()
    }
  })
})
