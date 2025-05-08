// Vectors from https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition

import { Bytes, Keystore } from 'ox'
import { describe, expect, test } from 'vitest'

describe('encrypt/decrypt', () => {
  test('behavior: pbkdf2', async () => {
    const key = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = await Keystore.encrypt(secret, key)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "6087dab2f9fdbbfaddc31a909735c1e6",
          },
          "ciphertext": "5318b4d5bcd28de64ee5559e671353e16f075ecae9f99c7a79a38af5f869aa46",
          "kdf": "pbkdf2",
          "kdfparams": {
            "c": 262144,
            "dklen": 32,
            "prf": "hmac-sha256",
            "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
          },
          "mac": "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2",
        },
        "id": null,
        "version": 3,
      }
    `)

    const decrypted = await Keystore.decrypt(encrypted, key)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: pbkdf2 (decrypted as bytes)', async () => {
    const key = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = await Keystore.encrypt(secret, key)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "6087dab2f9fdbbfaddc31a909735c1e6",
          },
          "ciphertext": "5318b4d5bcd28de64ee5559e671353e16f075ecae9f99c7a79a38af5f869aa46",
          "kdf": "pbkdf2",
          "kdfparams": {
            "c": 262144,
            "dklen": 32,
            "prf": "hmac-sha256",
            "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
          },
          "mac": "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2",
        },
        "id": null,
        "version": 3,
      }
    `)

    const decrypted = await Keystore.decrypt(encrypted, key, { as: 'Bytes' })
    expect(decrypted).toEqual(Bytes.fromHex(secret))
  })

  test('behavior: scrypt', async () => {
    const key = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = await Keystore.encrypt(secret, key)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "83dbcc02d8ccb40e466191a123791e0e",
          },
          "ciphertext": "d172bf743a674da9cdad04534d56926ef8358534d458fffccd4e6ad2fbde479c",
          "kdf": "scrypt",
          "kdfparams": {
            "dklen": 32,
            "n": 262144,
            "p": 8,
            "r": 1,
            "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
          },
          "mac": "2103ac29920d71da29f15d75b4a16dbe95cfd7ff8faea1056c33131d846e3097",
        },
        "id": null,
        "version": 3,
      }
    `)

    const decrypted = await Keystore.decrypt(encrypted, key)
    expect(decrypted).toEqual(secret)
  })
})

describe('pbkdf2', () => {
  test('default', async () => {
    const key = Keystore.pbkdf2({
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })
    expect(key.key()).toMatchInlineSnapshot(`
      "f06d69cdc7da0faffb1008270bca38f5e31891a3a773950e6d0fea48a7188551"
    `)
    expect(key.iv).toBeDefined()
    expect({ ...key, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
        },
        "key": [Function],
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const key = Keystore.pbkdf2({
      password: 'testpassword',
    })
    expect(key.key()).toBeDefined()
    expect(key.iv).toBeDefined()
    expect(key.kdfparams.salt).toBeDefined()
    expect({
      ...key,
      iv: null,
      key: null,
      kdfparams: { ...key.kdfparams, salt: null },
    }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": null,
        },
        "key": null,
      }
    `)
  })
})

describe('pbkdf2Async', () => {
  test('default', async () => {
    const key = await Keystore.pbkdf2Async({
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })
    expect(key.key()).toMatchInlineSnapshot(`
      "f06d69cdc7da0faffb1008270bca38f5e31891a3a773950e6d0fea48a7188551"
    `)
    expect(key.iv).toBeDefined()
    expect({ ...key, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
        },
        "key": [Function],
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const key = await Keystore.pbkdf2Async({
      password: 'testpassword',
    })
    expect(key.key()).toBeDefined()
    expect(key.iv).toBeDefined()
    expect(key.kdfparams.salt).toBeDefined()
    expect({
      ...key,
      iv: null,
      key: null,
      kdfparams: { ...key.kdfparams, salt: null },
    }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": null,
        },
        "key": null,
      }
    `)
  })
})

describe('scrypt', () => {
  test('default', async () => {
    const key = Keystore.scrypt({
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })
    expect(key.key()).toMatchInlineSnapshot(
      `"fac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd"`,
    )
    expect(key.iv).toBeDefined()
    expect({ ...key, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "scrypt",
        "kdfparams": {
          "dklen": 32,
          "n": 262144,
          "p": 8,
          "r": 1,
          "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
        },
        "key": [Function],
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const key = Keystore.scrypt({
      password: 'testpassword',
    })
    expect(key.key()).toBeDefined()
    expect(key.kdfparams.salt).toBeDefined()
    expect(key.iv).toBeDefined()
    expect({
      ...key,
      iv: null,
      key: null,
      kdfparams: { ...key.kdfparams, salt: null },
    }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "scrypt",
        "kdfparams": {
          "dklen": 32,
          "n": 262144,
          "p": 8,
          "r": 1,
          "salt": null,
        },
        "key": null,
      }
    `)
  })
})

describe('scryptAsync', () => {
  test('default', async () => {
    const key = await Keystore.scryptAsync({
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })
    expect(key.key()).toMatchInlineSnapshot(
      `"fac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd"`,
    )
    expect(key.iv).toBeDefined()
    expect({ ...key, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "scrypt",
        "kdfparams": {
          "dklen": 32,
          "n": 262144,
          "p": 8,
          "r": 1,
          "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
        },
        "key": [Function],
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const key = await Keystore.scryptAsync({
      password: 'testpassword',
    })
    expect(key.key()).toBeDefined()
    expect(key.kdfparams.salt).toBeDefined()
    expect(key.iv).toBeDefined()
    expect({
      ...key,
      iv: null,
      key: null,
      kdfparams: { ...key.kdfparams, salt: null },
    }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "scrypt",
        "kdfparams": {
          "dklen": 32,
          "n": 262144,
          "p": 8,
          "r": 1,
          "salt": null,
        },
        "key": null,
      }
    `)
  })
})
