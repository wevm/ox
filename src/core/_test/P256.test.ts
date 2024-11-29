import { Bytes, Hex, P256 } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('getPublicKey', () => {
  const privateKey =
    '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'

  test('default', () => {
    {
      const publicKey = P256.getPublicKey({
        privateKey,
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
    {
      "prefix": 4,
      "x": 10551483369778534213743005046722587423472548496575383028418761641566343103239n,
      "y": 88295525029668593780823649128376935553570204792365777341876890493798599407244n,
    }
  `,
      )
    }

    {
      const publicKey = P256.getPublicKey({
        privateKey: Bytes.fromHex(accounts[0].privateKey),
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
    {
      "prefix": 4,
      "x": 74284260781974828542656778781460620511024287575108245086657461940925169173577n,
      "y": 49004966777120461993240735637857463864712305111925716454339081891868780934195n,
    }
  `,
      )
    }
  })
})

describe('randomPrivateKey', () => {
  test('default', () => {
    const privateKey = P256.randomPrivateKey()
    expect(privateKey.length).toBe(66)
  })

  test('options: as', () => {
    const privateKey = P256.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey.length).toBe(32)
  })
})

describe('recoverPublicKey', () => {
  const privateKey = P256.randomPrivateKey()

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = P256.sign({ payload, privateKey })
    expect(P256.recoverPublicKey({ payload, signature })).toStrictEqual(
      P256.getPublicKey({ privateKey }),
    )
  })
})

describe('sign', () => {
  const privateKey =
    '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'
  const publicKey = P256.getPublicKey({ privateKey })

  test('default', async () => {
    {
      const signature = P256.sign({
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": 25696373395957984486324188498890325781005829812399813021478384321951480608605n,
          "s": 44320676628162932405815850946781131436023797452754174109610070201481442411520n,
          "yParity": 1,
        }
      `,
      )
      expect(
        P256.verify({
          publicKey,
          payload:
            '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
          signature,
        }),
      ).toBe(true)
      expect(
        P256.verify({
          publicKey,
          payload: '0xbeef',
          signature,
        }),
      ).toBe(false)
    }

    {
      const signature = P256.sign({
        payload: Bytes.fromHex(
          '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
        ),
        privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": 109093915289726021639001379260733771573757231672849462488223442695417941697300n,
          "s": 6698841733262193840826736319213924566905321252379319222891108166116990474980n,
          "yParity": 0,
        }
      `,
      )
      expect(
        P256.verify({
          publicKey,
          payload: '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
          signature,
        }),
      ).toBe(true)
      expect(
        P256.verify({
          publicKey,
          payload: '0xbeef',
          signature,
        }),
      ).toBe(false)
    }
  })

  test('options: hash', () => {
    const signature = P256.sign({
      hash: true,
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
  {
    "r": 38589374264307162948518251922729143918445204519165784874036137623135009958234n,
    "s": 201259577542353941908945259470130875727678910646252042669727980758229302244n,
    "yParity": 0,
  }
`,
    )
    expect(
      P256.verify({
        hash: true,
        publicKey,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
    expect(
      P256.verify({
        hash: true,
        publicKey,
        payload: '0xbeef',
        signature,
      }),
    ).toBe(false)
  })

  test('options: extraEntropy', () => {
    {
      const signature_1 = P256.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).toEqual(signature_2)
    }

    {
      const signature_1 = P256.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }

    {
      const signature_1 = P256.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }
  })
})

describe('verify', () => {
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(P256.verify({ publicKey, payload, signature: { r, s } })).toBe(true)
  })

  test('behavior: bytes payload', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(
      P256.verify({
        publicKey,
        payload: Bytes.fromHex(payload),
        signature: { r, s },
      }),
    ).toBe(true)
  })

  test('options: hash', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ hash: true, payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(
      P256.verify({ hash: true, publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(P256)).toMatchInlineSnapshot(`
    [
      "noble",
      "getPublicKey",
      "randomPrivateKey",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
