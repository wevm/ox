import { ctr } from '@noble/ciphers/aes.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as vectors from '../../../test/vectors/pbkdf2/index.js'
import * as Keystore from '../Keystore.js'

describe('engine', () => {
  test('behavior: matches NIST SP 800-38A AES-CTR vectors', async () => {
    const { aesCtrDecrypt, aesCtrEncrypt } = await Keystore.engine()
    const iv = Hex.toBytes('0xf0f1f2f3f4f5f6f7f8f9fafbfcfdfeff')
    const plaintext = Hex.toBytes('0x6bc1bee22e409f96e93d7e117393172a')
    const vectors = [
      {
        ciphertext: '0x874d6191b620e3261bef6864990db6ce',
        key: '0x2b7e151628aed2a6abf7158809cf4f3c',
      },
      {
        ciphertext: '0x1abc932417521ca24f2b0459fe7e6e0b',
        key: '0x8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b',
      },
      {
        ciphertext: '0x601ec313775789a5b7a7f504bbf3d228',
        key: '0x603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4',
      },
    ] as const

    expect(
      vectors.map(({ ciphertext, key }) => {
        const encrypted = aesCtrEncrypt(Hex.toBytes(key), iv, plaintext)
        const decrypted = aesCtrDecrypt(
          Hex.toBytes(key),
          iv,
          Hex.toBytes(ciphertext),
        )
        return {
          decrypted: Hex.fromBytes(decrypted),
          encrypted: Hex.fromBytes(encrypted),
        }
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "decrypted": "0x6bc1bee22e409f96e93d7e117393172a",
          "encrypted": "0x874d6191b620e3261bef6864990db6ce",
        },
        {
          "decrypted": "0x6bc1bee22e409f96e93d7e117393172a",
          "encrypted": "0x1abc932417521ca24f2b0459fe7e6e0b",
        },
        {
          "decrypted": "0x6bc1bee22e409f96e93d7e117393172a",
          "encrypted": "0x601ec313775789a5b7a7f504bbf3d228",
        },
      ]
    `)
  })

  test('behavior: matches RFC 7914 PBKDF2-HMAC-SHA256 vectors', async () => {
    const { pbkdf2Sha256 } = await Keystore.engine()

    for (const { iterations, key, password, salt } of vectors.vectors)
      expect(
        pbkdf2Sha256(password, salt, {
          c: iterations,
          dkLen: key.length,
        }),
      ).toEqual(key)
  })

  test('behavior: agrees with the defaults across boundary sizes', async () => {
    const node = await Keystore.engine()
    const iv = Uint8Array.from(
      { length: 20 },
      (_, index) => (index * 13) % 251,
    ).subarray(2, 18)

    for (const keySize of [16, 24, 32]) {
      const key = Uint8Array.from(
        { length: keySize + 4 },
        (_, index) => (index * 17) % 251,
      ).subarray(2, keySize + 2)

      for (const size of [0, 1, 15, 16, 17, 31, 32, 33]) {
        const data = Uint8Array.from(
          { length: size + 6 },
          (_, index) => (index * 29) % 251,
        ).subarray(3, size + 3)
        const encrypted = node.aesCtrEncrypt(key, iv, data)

        expect(encrypted).toEqual(ctr(key, iv).encrypt(data))
        expect(node.aesCtrDecrypt(key, iv, encrypted)).toEqual(data)
      }
    }

    const password = Uint8Array.from(
      { length: 37 },
      (_, index) => (index * 31) % 251,
    ).subarray(3, 34)
    const salt = Uint8Array.from(
      { length: 41 },
      (_, index) => (index * 37) % 251,
    ).subarray(5, 37)

    for (const options of [
      { c: 1, dkLen: 1 },
      { c: 2, dkLen: 31 },
      { c: 3, dkLen: 32 },
      { c: 4, dkLen: 33 },
      { c: 16, dkLen: 64 },
    ]) {
      const expected = pbkdf2(sha256, password, salt, options)
      expect(node.pbkdf2Sha256(password, salt, options)).toEqual(expected)
      expect(await node.pbkdf2Sha256Async(password, salt, options)).toEqual(
        expected,
      )
    }
  })

  test('behavior: does not mutate inputs and returns owned arrays', async () => {
    const node = await Keystore.engine()
    const data = Uint8Array.of(1, 2, 3, 4, 5)
    const iv = new Uint8Array(16).fill(2)
    const key = new Uint8Array(16).fill(3)
    const password = Uint8Array.of(4, 5, 6)
    const salt = Uint8Array.of(7, 8, 9)
    const inputs = [data, iv, key, password, salt]
    const before = inputs.map((input) => input.slice())

    const outputs = [
      node.aesCtrEncrypt(key, iv, data),
      node.aesCtrDecrypt(key, iv, data),
      node.pbkdf2Sha256(password, salt, { c: 1, dkLen: 32 }),
      await node.pbkdf2Sha256Async(password, salt, { c: 1, dkLen: 32 }),
    ]

    expect(inputs).toEqual(before)
    expect(outputs.map((output) => output.constructor === Uint8Array))
      .toMatchInlineSnapshot(`
        [
          true,
          true,
          true,
          true,
        ]
      `)
    expect(
      node.aesCtrEncrypt(key, iv, data) === node.aesCtrEncrypt(key, iv, data),
    ).toMatchInlineSnapshot('false')
  })

  test('behavior: rejects malformed AES and PBKDF2 parameters', async () => {
    const node = await Keystore.engine()
    const data = new Uint8Array()
    const iv = new Uint8Array(16)
    const key = new Uint8Array(16)

    for (const keyLength of [0, 15, 17, 23, 25, 31, 33]) {
      expect(() => ctr(new Uint8Array(keyLength), iv).encrypt(data)).toThrow()
      expect(() =>
        node.aesCtrEncrypt(new Uint8Array(keyLength), iv, data),
      ).toThrow()
      expect(() =>
        node.aesCtrDecrypt(new Uint8Array(keyLength), iv, data),
      ).toThrow()
    }
    for (const ivLength of [0, 15, 17]) {
      expect(() => ctr(key, new Uint8Array(ivLength)).encrypt(data)).toThrow()
      expect(() =>
        node.aesCtrEncrypt(key, new Uint8Array(ivLength), data),
      ).toThrow()
      expect(() =>
        node.aesCtrDecrypt(key, new Uint8Array(ivLength), data),
      ).toThrow()
    }

    for (const options of [
      { c: 0, dkLen: 32 },
      { c: 1.5, dkLen: 32 },
      { c: 1, dkLen: 0 },
      { c: 1, dkLen: 1.5 },
    ]) {
      expect(() => pbkdf2(sha256, data, data, options)).toThrow()
      expect(() => node.pbkdf2Sha256(data, data, options)).toThrow()
      await expect(
        node.pbkdf2Sha256Async(data, data, options),
      ).rejects.toThrow()
    }
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await Keystore.engine()
    const second = await Keystore.engine()

    expect(first === second).toMatchInlineSnapshot('false')
  })
})
