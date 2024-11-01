import { Address, Bytes, PublicKey, Secp256k1 } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../test/constants/accounts.js'

describe('getPublicKey', () => {
  test('default', () => {
    {
      const publicKey = Secp256k1.getPublicKey({
        privateKey: accounts[0].privateKey,
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
      )
      expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
        accounts[0].address,
      )
    }

    {
      const publicKey = Secp256k1.getPublicKey({
        privateKey: Bytes.fromHex(accounts[0].privateKey),
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
      )
      expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
        accounts[0].address,
      )
    }
  })
})

describe('randomPrivateKey', () => {
  test('default', () => {
    const privateKey = Secp256k1.randomPrivateKey()
    expect(privateKey.length).toBe(66)
  })

  test('options: as', () => {
    const privateKey = Secp256k1.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey.length).toBe(32)
  })
})

describe('recoverAddress', () => {
  const address = accounts[0].address
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.recoverAddress({ payload, signature })).toBe(
      Address.from(address),
    )
  })
})

describe('recoverPublicKey', () => {
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.recoverPublicKey({ payload, signature })).toStrictEqual(
      Secp256k1.getPublicKey({ privateKey }),
    )
  })
})

describe('sign', () => {
  test('default', async () => {
    {
      const signature = Secp256k1.sign({
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
      {
        "r": 74352382517807082440778846078252240710763999160569457624520311883943391062769n,
        "s": 43375188480015931414505591342117068151247353833881461609019650667261881302875n,
        "yParity": 0,
      }
    `,
      )
      expect(
        Secp256k1.verify({
          address: accounts[0].address,
          payload:
            '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
          signature,
        }),
      ).toBe(true)
    }

    {
      const signature = Secp256k1.sign({
        payload: Bytes.fromHex(
          '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
        ),
        privateKey: accounts[0].privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
      {
        "r": 89036260706339362183898531363310683680162157132496689422406521430939707497224n,
        "s": 22310885159939283473640002814069314990500333570711854513358211093549688653897n,
        "yParity": 1,
      }
    `,
      )
      expect(
        Secp256k1.verify({
          address: accounts[0].address,
          payload:
            '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
          signature,
        }),
      ).toBe(true)
    }
  })

  test('options: hash', () => {
    const signature = Secp256k1.sign({
      hash: true,
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey: accounts[0].privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
    {
      "r": 42395289763960325836777315020270385161624044426039905118158393530872007515822n,
      "s": 30406628000207299947338207254203930276142590474479134670945489721527570429874n,
      "yParity": 1,
    }
  `,
    )

    const publicKey = Secp256k1.getPublicKey({
      privateKey: accounts[0].privateKey,
    })

    expect(
      Secp256k1.verify({
        publicKey,
        hash: true,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
  })
})

describe('verify', () => {
  const address = accounts[0].address
  const privateKey = accounts[0].privateKey

  test('behavior: verify w/ address', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.verify({ address, payload, signature })).toBe(true)
  })

  test('behavior: bytes payload', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(
      Secp256k1.verify({ address, payload: Bytes.fromHex(payload), signature }),
    ).toBe(true)
  })

  test('behavior: verify w/ publicKey', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    expect(Secp256k1.verify({ publicKey, payload, signature: { r, s } })).toBe(
      true,
    )
  })

  test('behavior: verify w/ compressed publicKey', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const compressed = PublicKey.compress(publicKey)
    expect(
      Secp256k1.verify({ publicKey: compressed, payload, signature: { r, s } }),
    ).toBe(true)
  })

  test('options: hash', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ hash: true, payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    expect(
      Secp256k1.verify({ hash: true, publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(Secp256k1)).toMatchInlineSnapshot(`
    [
      "getPublicKey",
      "randomPrivateKey",
      "recoverAddress",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
