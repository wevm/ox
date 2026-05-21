// Vectors from https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition

import { Bytes, Keystore } from 'ox'
import { describe, expect, test } from 'vp/test'

describe('encrypt/decrypt', () => {
  test('behavior: pbkdf2', async () => {
    const [key, opts] = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
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

    const decrypted = Keystore.decrypt(encrypted, key)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: pbkdf2 (decrypt with toKey)', async () => {
    const [key, opts] = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
      iterations: 8192,
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "6087dab2f9fdbbfaddc31a909735c1e6",
          },
          "ciphertext": "583d14406889943bd38ddbb3207d966f4e797e1064a5ee9761b859c68d5e9c70",
          "kdf": "pbkdf2",
          "kdfparams": {
            "c": 8192,
            "dklen": 32,
            "prf": "hmac-sha256",
            "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
          },
          "mac": "ba98d7d25b0be12a943cb75a0689e33bbc6781c53ccc2cd708a3b41f4ede72d8",
        },
        "id": null,
        "version": 3,
      }
    `)

    const key2 = Keystore.toKey(encrypted, {
      password: 'testpassword',
    })
    const decrypted = Keystore.decrypt(encrypted, key2)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: pbkdf2 (decrypt with toKeyAsync)', async () => {
    const [key, opts] = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
      iterations: 8192,
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "6087dab2f9fdbbfaddc31a909735c1e6",
          },
          "ciphertext": "583d14406889943bd38ddbb3207d966f4e797e1064a5ee9761b859c68d5e9c70",
          "kdf": "pbkdf2",
          "kdfparams": {
            "c": 8192,
            "dklen": 32,
            "prf": "hmac-sha256",
            "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
          },
          "mac": "ba98d7d25b0be12a943cb75a0689e33bbc6781c53ccc2cd708a3b41f4ede72d8",
        },
        "id": null,
        "version": 3,
      }
    `)

    const key2 = await Keystore.toKeyAsync(encrypted, {
      password: 'testpassword',
    })
    const decrypted = Keystore.decrypt(encrypted, key2)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: pbkdf2 (decrypted as bytes)', async () => {
    const [key, opts] = Keystore.pbkdf2({
      iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
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

    const decrypted = Keystore.decrypt(encrypted, key, { as: 'Bytes' })
    expect(decrypted).toEqual(Bytes.fromHex(secret))
  })

  test.skip('behavior: scrypt', async () => {
    const [key, opts] = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
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

    const decrypted = Keystore.decrypt(encrypted, key)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: scrypt (decrypt as toKey)', async () => {
    const [key, opts] = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 8192,
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "83dbcc02d8ccb40e466191a123791e0e",
          },
          "ciphertext": "643fe2fae9b78bbfe3dd5ccfc0f5588941f054b5c4832a6a880c923f1594ee49",
          "kdf": "scrypt",
          "kdfparams": {
            "dklen": 32,
            "n": 8192,
            "p": 8,
            "r": 1,
            "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
          },
          "mac": "8424b23693b3492c074e9dd6366507739725640a62f1f41565b7b2c5f8db6253",
        },
        "id": null,
        "version": 3,
      }
    `)

    const key2 = Keystore.toKey(encrypted, {
      password: 'testpassword',
    })
    const decrypted = Keystore.decrypt(encrypted, key2)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: scrypt (decrypt as toKeyAsync)', async () => {
    const [key, opts] = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 8192,
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key, opts)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "83dbcc02d8ccb40e466191a123791e0e",
          },
          "ciphertext": "643fe2fae9b78bbfe3dd5ccfc0f5588941f054b5c4832a6a880c923f1594ee49",
          "kdf": "scrypt",
          "kdfparams": {
            "dklen": 32,
            "n": 8192,
            "p": 8,
            "r": 1,
            "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
          },
          "mac": "8424b23693b3492c074e9dd6366507739725640a62f1f41565b7b2c5f8db6253",
        },
        "id": null,
        "version": 3,
      }
    `)

    const key2 = await Keystore.toKeyAsync(encrypted, {
      password: 'testpassword',
    })
    const decrypted = Keystore.decrypt(encrypted, key2)
    expect(decrypted).toEqual(secret)
  })

  test('behavior: scrypt (key as hex)', async () => {
    const [key, opts] = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 1024,
    })

    const secret =
      '0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'

    const encrypted = Keystore.encrypt(secret, key(), opts)
    expect({ ...encrypted, id: null }).toMatchInlineSnapshot(`
      {
        "crypto": {
          "cipher": "aes-128-ctr",
          "cipherparams": {
            "iv": "83dbcc02d8ccb40e466191a123791e0e",
          },
          "ciphertext": "b548abbf08d565f9dcfe529517ac00229d18077f54c3c28b2b18fdbda3b18b17",
          "kdf": "scrypt",
          "kdfparams": {
            "dklen": 32,
            "n": 1024,
            "p": 8,
            "r": 1,
            "salt": "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
          },
          "mac": "8aab3b28ec4c8d16454305e49d8da9fe58b311185f7ab7050bb1f8ea86e85883",
        },
        "id": null,
        "version": 3,
      }
    `)

    const decrypted = Keystore.decrypt(encrypted, key())
    expect(decrypted).toEqual(secret)
  })
})

describe('pbkdf2', () => {
  test('default', async () => {
    const [key, opts] = Keystore.pbkdf2({
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })
    expect(key()).toMatchInlineSnapshot(
      `"0xf06d69cdc7da0faffb1008270bca38f5e31891a3a773950e6d0fea48a7188551"`,
    )
    expect(opts.iv).toBeDefined()
    expect({ ...opts, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
        },
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const [key, opts] = Keystore.pbkdf2({
      password: 'testpassword',
    })
    expect(key()).toBeDefined()
    expect(opts.iv).toBeDefined()
    expect(opts.kdfparams.salt).toBeDefined()
    expect({
      ...opts,
      iv: null,
      key: null,
      kdfparams: { ...opts.kdfparams, salt: null },
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
    const [key, opts] = await Keystore.pbkdf2Async({
      salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
      password: 'testpassword',
    })
    expect(key()).toMatchInlineSnapshot(
      `"0xf06d69cdc7da0faffb1008270bca38f5e31891a3a773950e6d0fea48a7188551"`,
    )
    expect(opts.iv).toBeDefined()
    expect({ ...opts, iv: null }).toMatchInlineSnapshot(`
      {
        "iv": null,
        "kdf": "pbkdf2",
        "kdfparams": {
          "c": 262144,
          "dklen": 32,
          "prf": "hmac-sha256",
          "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
        },
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const [key, opts] = await Keystore.pbkdf2Async({
      password: 'testpassword',
    })
    expect(key()).toBeDefined()
    expect(opts.iv).toBeDefined()
    expect(opts.kdfparams.salt).toBeDefined()
    expect({
      ...opts,
      iv: null,
      key: null,
      kdfparams: { ...opts.kdfparams, salt: null },
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

describe('validation', () => {
  test('pbkdf2 rejects iterations < 1000', () => {
    expect(() =>
      Keystore.pbkdf2({ password: 'x', iterations: 1 }),
    ).toThrowError(
      'Keystore: PBKDF2 iterations must be an integer >= 1000, got 1.',
    )
  })

  test('pbkdf2 rejects non-integer iterations', () => {
    expect(() =>
      Keystore.pbkdf2({ password: 'x', iterations: 1.5 }),
    ).toThrowError(
      'Keystore: PBKDF2 iterations must be an integer >= 1000, got 1.5.',
    )
  })

  test('pbkdf2Async rejects iterations < 1000', async () => {
    await expect(
      Keystore.pbkdf2Async({ password: 'x', iterations: 1 }),
    ).rejects.toThrowError(
      'Keystore: PBKDF2 iterations must be an integer >= 1000, got 1.',
    )
  })

  test('scrypt rejects n < 1024', () => {
    expect(() => Keystore.scrypt({ password: 'x', n: 2 })).toThrowError(
      'Keystore: scrypt n must be a power of two >= 1024, got 2.',
    )
  })

  test('scrypt rejects n that is not a power of two', () => {
    expect(() => Keystore.scrypt({ password: 'x', n: 1500 })).toThrowError(
      'Keystore: scrypt n must be a power of two >= 1024, got 1500.',
    )
  })

  test('scrypt rejects r <= 0', () => {
    expect(() =>
      Keystore.scrypt({ password: 'x', n: 1024, r: 0 }),
    ).toThrowError('Keystore: scrypt r must be a positive integer, got 0.')
  })

  test('scrypt rejects p <= 0', () => {
    expect(() =>
      Keystore.scrypt({ password: 'x', n: 1024, p: 0 }),
    ).toThrowError('Keystore: scrypt p must be a positive integer, got 0.')
  })

  test('scryptAsync rejects n that is not a power of two', async () => {
    await expect(
      Keystore.scryptAsync({ password: 'x', n: 1500 }),
    ).rejects.toThrowError(
      'Keystore: scrypt n must be a power of two >= 1024, got 1500.',
    )
  })
})

describe.skip('scrypt', () => {
  test('default', async () => {
    const [key, opts] = Keystore.scrypt({
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })
    expect(key()).toMatchInlineSnapshot(
      `"0xfac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd"`,
    )
    expect(opts.iv).toBeDefined()
    expect({ ...opts, iv: null }).toMatchInlineSnapshot(`
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
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const [key, opts] = Keystore.scrypt({
      password: 'testpassword',
    })
    expect(key()).toBeDefined()
    expect(opts.kdfparams.salt).toBeDefined()
    expect(opts.iv).toBeDefined()
    expect({
      ...opts,
      iv: null,
      key: null,
      kdfparams: { ...opts.kdfparams, salt: null },
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
  test('behavior: respects p and r options', async () => {
    const [, opts] = await Keystore.scryptAsync({
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 1024,
      p: 1,
      r: 8,
    })
    expect(opts.kdfparams.p).toBe(1)
    expect(opts.kdfparams.r).toBe(8)
    expect(opts.kdfparams.n).toBe(1024)
  })

  test('behavior: matches sync scrypt for identical params', async () => {
    const [keySync] = Keystore.scrypt({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 1024,
      p: 2,
      r: 4,
    })
    const [keyAsync] = await Keystore.scryptAsync({
      iv: '0x83dbcc02d8ccb40e466191a123791e0e',
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
      n: 1024,
      p: 2,
      r: 4,
    })
    expect(keyAsync()).toEqual(keySync())
  })
})

describe.skip('scryptAsync legacy snapshot', () => {
  test('default', async () => {
    const [key, opts] = await Keystore.scryptAsync({
      salt: '0xab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19',
      password: 'testpassword',
    })
    expect(key()).toMatchInlineSnapshot(
      `"0xfac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd"`,
    )
    expect(opts.iv).toBeDefined()
    expect({ ...opts, iv: null }).toMatchInlineSnapshot(`
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
      }
    `)
  })

  test('behavior: rand salt', async () => {
    const [key, opts] = await Keystore.scryptAsync({
      password: 'testpassword',
    })
    expect(key()).toBeDefined()
    expect(opts.kdfparams.salt).toBeDefined()
    expect(opts.iv).toBeDefined()
    expect({
      ...opts,
      iv: null,
      key: null,
      kdfparams: { ...opts.kdfparams, salt: null },
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
