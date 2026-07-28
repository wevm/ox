import { Address, Engine, HdKey, Hex, Mnemonic } from 'ox'
import { describe, expect, test } from 'vp/test'
import { accounts } from '../../../test/constants/accounts.js'
import { hdKey as hdKeyEngine } from '../../../test/engines.js'
import * as exports from '../HdKey.js'

const seed = Mnemonic.toSeed(
  'test test test test test test test test test test test junk',
)
const vectorSeed = '0x000102030405060708090a0b0c0d0e0f'
const extendedKey = HdKey.fromSeed(seed).privateExtendedKey
const json = { xpriv: HdKey.fromSeed(seed).privateExtendedKey }
const versions = {
  private: 0x0488_ade4,
  public: 0x0488_b21e,
}
const testnetVersions = {
  private: 0x0435_8394,
  public: 0x0435_87cf,
}

describe('fromExtendedKey', () => {
  test('default', () => {
    const hdKey = HdKey.fromExtendedKey(extendedKey).derive(HdKey.path())
    expect(hdKey.privateKey!).toBe(accounts[0].privateKey)
    expect(Address.fromPublicKey(hdKey.publicKey)).toBe(accounts[0].address)
  })

  test('options: path', () => {
    for (let index = 0; index < accounts.length; index++) {
      const hdKey = HdKey.fromExtendedKey(extendedKey).derive(
        HdKey.path({ index }),
      )
      expect(Address.fromPublicKey(hdKey.publicKey)).toBe(
        accounts[index]!.address,
      )
    }
  })

  test('options: versions', () => {
    const hdKey = HdKey.fromSeed(vectorSeed, {
      versions: testnetVersions,
    })
    const restored = HdKey.fromExtendedKey(hdKey.privateExtendedKey, {
      versions: testnetVersions,
    })

    expect({
      privateExtendedKey: restored.privateExtendedKey,
      publicExtendedKey: restored.publicExtendedKey,
      versions: restored.versions,
    }).toMatchInlineSnapshot(`
      {
        "privateExtendedKey": "tprv8ZgxMBicQKsPeDgjzdC36fs6bMjGApWDNLR9erAXMs5skhMv36j9MV5ecvfavji5khqjWaWSFhN3YcCUUdiKH6isR4Pwy3U5y5egddBr16m",
        "publicExtendedKey": "tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp",
        "versions": {
          "private": 70615956,
          "public": 70617039,
        },
      }
    `)
  })
})

describe('fromJson', () => {
  test('default', () => {
    const hdKey = HdKey.fromJson(json).derive(HdKey.path())
    expect(hdKey.privateKey!).toBe(accounts[0].privateKey)
    expect(Address.fromPublicKey(hdKey.publicKey)).toBe(accounts[0].address)
  })

  test('options: path', () => {
    for (let index = 0; index < accounts.length; index++) {
      const hdKey = HdKey.fromJson(json).derive(HdKey.path({ index }))
      expect(Address.fromPublicKey(hdKey.publicKey)).toBe(
        accounts[index]!.address,
      )
    }
  })

  test('options: versions', () => {
    const hdKey = HdKey.fromSeed(vectorSeed, {
      versions: testnetVersions,
    })
    const restored = HdKey.fromJson(
      { xpriv: hdKey.privateExtendedKey },
      { versions: testnetVersions },
    )

    expect(restored.privateExtendedKey).toBe(hdKey.privateExtendedKey)
    expect(restored.publicExtendedKey).toBe(hdKey.publicExtendedKey)
  })
})

describe('fromSeed', () => {
  test('default', () => {
    const hdKey = HdKey.fromSeed(seed).derive(HdKey.path())
    expect(hdKey.privateKey!).toBe(accounts[0].privateKey)
    expect(Address.fromPublicKey(hdKey.publicKey)).toBe(accounts[0].address)
    expect(hdKey).toMatchInlineSnapshot(`
      {
        "depth": 5,
        "derive": [Function],
        "identifier": "0xa55476015c13afb8afb92160329a8cde976f1f2e",
        "index": 0,
        "privateExtendedKey": "xprvA3KbAeguosodJeRqpV3NF1VYREub6vBASfBEXa1LgZeqPAhCFkHQMBjXYPa8RZvP5tnWMSg2zYcox5vbsfz1pB7J2zU9LEzWxg7rrRpoeSh",
        "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "publicExtendedKey": "xpub6GJwaADoeFMvX8WJvWaNc9SGyGk5WNu1ot6qKxQxEuBpFy2LoHbetz41PgEcEg4n2bk3hWoHYJ69EqkjpoSv9KrinCnZV6y4Xo6VJZ6KHWT",
        "publicKey": {
          "prefix": 4,
          "x": "0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
          "y": "0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
        },
        "versions": {
          "private": 76066276,
          "public": 76067358,
        },
      }
    `)
  })

  test('options: derive', () => {
    for (let index = 0; index < accounts.length; index++) {
      const hdKey = HdKey.fromSeed(seed).derive(HdKey.path({ index }))
      expect(Address.fromPublicKey(hdKey.publicKey)).toBe(
        accounts[index]!.address,
      )
    }
  })

  test('behavior: preserves an offset view without mutating its backing array', () => {
    const bytes = Hex.toBytes(`0xffff${vectorSeed.slice(2)}eeee`)
    const view = bytes.subarray(2, -2)
    const before = Uint8Array.from(bytes)

    const hdKey = HdKey.fromSeed(view)

    expect(bytes).toEqual(before)
    expect(hdKey.privateExtendedKey).toMatchInlineSnapshot(
      `"xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi"`,
    )
  })
})

describe('Engine', () => {
  test('behavior: routes every operation through a complete custom engine', () => {
    Engine.set({ HdKey: hdKeyEngine })

    const fromSeed = HdKey.fromSeed(seed)
    const fromExtendedKey = HdKey.fromExtendedKey(fromSeed.privateExtendedKey)
    const fromJson = HdKey.fromJson({ xpriv: fromSeed.privateExtendedKey })
    const derived = fromSeed.derive('m/123')

    expect({
      derived: derived.privateExtendedKey,
      fromExtendedKey: fromExtendedKey.privateExtendedKey,
      fromJson: fromJson.privateExtendedKey,
      fromSeed: fromSeed.privateExtendedKey,
    }).toMatchInlineSnapshot(`
      {
        "derived": "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
        "fromExtendedKey": "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
        "fromJson": "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
        "fromSeed": "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
      }
    `)
  })

  test('behavior: an existing key resolves the current engine for every derive', () => {
    const hdKey = HdKey.fromSeed(vectorSeed)
    const before = hdKey.derive('m/1').privateExtendedKey

    Engine.set({ HdKey: { derive: hdKeyEngine.derive } })

    expect(hdKey.derive('m/1').privateExtendedKey).not.toBe(before)
    expect(hdKey.derive('m/1').privateExtendedKey).toBe(
      'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
    )
  })

  test('behavior: mutated versions apply to recursive derivation', () => {
    const hdKey = HdKey.fromSeed(vectorSeed)
    Object.assign(hdKey.versions, testnetVersions)

    const derived = hdKey.derive("m/0'")

    expect(derived.privateExtendedKey.startsWith('tprv')).toBe(true)
    expect(derived.publicExtendedKey.startsWith('tpub')).toBe(true)
    expect(derived.versions).toEqual(testnetVersions)
  })

  test('behavior: a node from a partial engine derives after reset', () => {
    Engine.set({ HdKey: { fromSeed: hdKeyEngine.fromSeed } })
    const hdKey = HdKey.fromSeed(seed)

    Engine.reset('HdKey')

    expect(hdKey.derive("m/0'").privateExtendedKey).toMatchInlineSnapshot(
      `"xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7"`,
    )
  })

  test('behavior: a scoped derive restores the previous implementation', () => {
    const hdKey = HdKey.fromSeed(vectorSeed)
    const expected = hdKey.derive('m/1').privateExtendedKey

    const scoped = Engine.with(
      { HdKey: { derive: hdKeyEngine.derive } },
      () => hdKey.derive('m/1').privateExtendedKey,
    )

    expect(scoped).not.toBe(expected)
    expect(hdKey.derive('m/1').privateExtendedKey).toBe(expected)
  })

  test('behavior: materialization detaches provider buffers and versions', () => {
    const node = hdKeyEngine.fromSeed(Hex.toBytes(vectorSeed), versions)
    Engine.set({ HdKey: { fromSeed: () => node } })

    const hdKey = HdKey.fromSeed(vectorSeed)
    node.identifier.fill(0)
    node.privateKey.fill(0)
    node.publicKey.fill(0)
    node.versions.private = 0

    expect({
      identifier: hdKey.identifier,
      privateKey: hdKey.privateKey,
      publicKey: hdKey.publicKey,
      versions: hdKey.versions,
    }).toMatchInlineSnapshot(`
      {
        "identifier": "0x3442193e1bb70916e914552172cd4e2dbc9df811",
        "privateKey": "0xe8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35",
        "publicKey": {
          "prefix": 4,
          "x": "0x39a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2",
          "y": "0x3cbe7ded0e7ce6a594896b8f62888fdbc5c8821305e2ea42bf01e37300116281",
        },
        "versions": {
          "private": 76066276,
          "public": 76067358,
        },
      }
    `)
  })

  test('error: rejects malformed provider node lengths', () => {
    const node = hdKeyEngine.fromSeed(Hex.toBytes(vectorSeed), versions)

    Engine.set({
      HdKey: {
        fromSeed: () => ({ ...node, publicKey: node.publicKey.slice(0, 33) }),
      },
    })

    expect(() => HdKey.fromSeed(vectorSeed)).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Expected 65 bytes for an HD key public key, received 33.]`,
    )
  })

  test('behavior: the HdKey provider owns its public key', () => {
    Engine.set({
      HdKey: { fromSeed: hdKeyEngine.fromSeed },
      Secp256k1: { getPublicKey: () => new Uint8Array(65) },
    })

    expect(HdKey.fromSeed(seed).publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": "0x39a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2",
        "y": "0x3cbe7ded0e7ce6a594896b8f62888fdbc5c8821305e2ea42bf01e37300116281",
      }
    `)
  })
})

describe('path', () => {
  test('default', () => {
    const path = HdKey.path()
    expect(path).toMatchInlineSnapshot(`"m/44'/60'/0'/0/0"`)
  })

  test('options', () => {
    const path = HdKey.path({ account: 1, change: 2, index: 3 })
    expect(path).toMatchInlineSnapshot(`"m/44'/60'/1'/2/3"`)
  })
})

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromExtendedKey",
      "fromJson",
      "fromSeed",
      "path",
    ]
  `)
})
