import { Address, Hex, Secp256k1 } from 'ox'
import { Oidc } from 'ox/tempo'
import { describe, expect, test } from 'vp/test'

// TIP-1133's reference vector (`crates/zk/testdata/oidc_rs256_v1_dev.json` in tempo).
const aud =
  '1234567890-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com'
const sub = '110169484474386276334'
const salt =
  '0x01d2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60'

// A 2048-bit RSA key; expected hashes come from an independent circomlib Poseidon.
const jwk = {
  e: 'AQAB',
  kty: 'RSA',
  n: '1OsSndY5Y8WZQ78AsuLb6nweLAU1r83mMfSLIDDLbaHUnS4d6emX7e-w0_d2MaUJM6LKH3AWOAcyxCc9axDLsdW7p8NZveqVjbapt0iQKT1YbYIiCVMTuafTHytdHRY1ZiMTF0ipHOIIZvx_tyf-1M6t66kJ-FVfyu-I9GRSZ-zIIX2WYasi8eis9bFPSGgzNMKedA9BhvPn_X8ZYe39A450JwQOa_ri2vijy1-x1zOVLxwO4vzjVRfJ0bE7nBvclJR4QixWtXaq8iig7FitJPz9wkhYDvsFxq99HrbZ0fHOgqu5AJHvrL5APd_vYlwHd3wS01Oev6NG1zw-bqPF-Q',
} as const
const modulus =
  '0xd4eb129dd63963c59943bf00b2e2dbea7c1e2c0535afcde631f48b2030cb6da1d49d2e1de9e997edefb0d3f77631a50933a2ca1f7016380732c4273d6b10cbb1d5bba7c359bdea958db6a9b74890293d586d8222095313b9a7d31f2b5d1d16356623131748a91ce20866fc7fb727fed4ceadeba909f8555fcaef88f4645267ecc8217d9661ab22f1e8acf5b14f48683334c29e740f4186f3e7fd7f1961edfd038e7427040e6bfae2daf8a3cb5fb1d733952f1c0ee2fce35517c9d1b13b9c1bdc949478422c56b576aaf228a0ec58ad24fcfdc248580efb05c6af7d1eb6d9d1f1ce82abb90091efacbe403ddfef625c07777c12d3539ebfa346d73c3e6ea3c5f9'

describe('fromJwk', () => {
  test('default', () => {
    expect(Oidc.fromJwk({ ...jwk, alg: 'RS256', kid: 'test', use: 'sig' }))
      .toMatchInlineSnapshot(`
        {
          "keyHash": "0x23b74aa0d1eb061ea782b216511ac9d41615f2c10a9a6efc3b957599e93a13d3",
          "kid": "test",
          "modulus": "0xd4eb129dd63963c59943bf00b2e2dbea7c1e2c0535afcde631f48b2030cb6da1d49d2e1de9e997edefb0d3f77631a50933a2ca1f7016380732c4273d6b10cbb1d5bba7c359bdea958db6a9b74890293d586d8222095313b9a7d31f2b5d1d16356623131748a91ce20866fc7fb727fed4ceadeba909f8555fcaef88f4645267ecc8217d9661ab22f1e8acf5b14f48683334c29e740f4186f3e7fd7f1961edfd038e7427040e6bfae2daf8a3cb5fb1d733952f1c0ee2fce35517c9d1b13b9c1bdc949478422c56b576aaf228a0ec58ad24fcfdc248580efb05c6af7d1eb6d9d1f1ce82abb90091efacbe403ddfef625c07777c12d3539ebfa346d73c3e6ea3c5f9",
        }
      `)
  })

  test('behavior: accepts a leading zero byte', () => {
    const n = Hex.concat('0x00', modulus)
    const key = Oidc.fromJwk({
      ...jwk,
      n: Buffer.from(n.slice(2), 'hex').toString('base64url'),
    })
    expect(key.modulus).toBe(modulus)
  })

  test('error: rejects keys outside the scheme', () => {
    expect(() =>
      Oidc.fromJwk({ ...jwk, kty: 'EC' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: not an RSA key.]`,
    )
    expect(() =>
      Oidc.fromJwk({ ...jwk, e: 'Aw' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: exponent is not 65537.]`,
    )
    expect(() =>
      Oidc.fromJwk({ ...jwk, use: 'enc' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: not a signing key.]`,
    )
    expect(() =>
      Oidc.fromJwk({ ...jwk, alg: 'RS512' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: algorithm is not RS256.]`,
    )
    expect(() =>
      Oidc.fromJwk({ ...jwk, n: undefined }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: modulus is missing.]`,
    )
    expect(() =>
      Oidc.fromJwk({ ...jwk, n: jwk.n.slice(0, 300) }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: modulus is not 2048 bits.]`,
    )
  })
})

describe('getAddressSeed', () => {
  test('default', () => {
    expect(Oidc.getAddressSeed({ aud, salt, sub })).toMatchInlineSnapshot(
      `"0x1a3548ca6ee9c37b81638ef979c0c405c03ca782bd3eceeba282073283bd7682"`,
    )
  })

  test('error: rejects a salt outside the field', () => {
    expect(() =>
      Oidc.getAddressSeed({ aud, salt: `0x${'ff'.repeat(32)}`, sub }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.InvalidFieldElementError: \`salt\` (\`0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff\`) is not an element of the BN254 scalar field.]`,
    )
  })

  test('error: rejects claims longer than the scheme hashes', () => {
    expect(() =>
      Oidc.getAddressSeed({ aud, salt, sub: 'a'.repeat(65) }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.ClaimTooLongError: The \`sub\` claim is 65 bytes; scheme \`0x01\` hashes at most 64 bytes.]`,
    )
  })
})

describe('getNonce', () => {
  test('default', () => {
    expect(
      Oidc.getNonce({
        accessKeyAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        blinding: `0x${'11'.repeat(31)}`,
        validUntil: 1760000540,
      }),
    ).toMatchInlineSnapshot(`"CO_jVIMNPIg_tHQ3unJMQnLAqyvzcvB8g5KwzRYZO2E"`)
  })

  test('behavior: is 43 characters', () => {
    const nonce = Oidc.getNonce({
      accessKeyAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      blinding: Oidc.randomBlinding(),
      validUntil: 1760000540,
    })
    expect(nonce.length).toBe(43)
  })

  test('error: rejects an invalid expiry', () => {
    expect(() =>
      Oidc.getNonce({
        accessKeyAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        blinding: `0x${'11'.repeat(31)}`,
        validUntil: -1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.InvalidTimestampError: \`validUntil\` (\`-1\`) is not a timestamp in seconds.]`,
    )
  })
})

describe('getPublicInput', () => {
  test('default', () => {
    expect(
      Oidc.getPublicInput({
        accessKeyAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        addressSeed:
          '0x1a3548ca6ee9c37b81638ef979c0c405c03ca782bd3eceeba282073283bd7682',
        issuedAt: 1760000000,
        issuer:
          '0x2ff3ac6e640a4a5d80c0a97cdf74754c3126bde1d8772872a7b3d8afe0714da4',
        keyHash:
          '0x0f311199cd1872a1d25d1bd871767f0151e5e93281215c583d5e603d65be23bf',
        validUntil: 1760000540,
      }),
    ).toMatchInlineSnapshot(
      `"0x0482585d75870919317aa31b2b525769ffa0556714412068b4dcfe7ab044d538"`,
    )
  })
})

describe('getSalt', () => {
  test('default', () => {
    expect(
      Oidc.getSalt({
        aud,
        iss: 'https://accounts.google.com',
        key: '0x386dbea44366ca1bc39c345d135906f7dd30a4af48368a7eb67f5107217b0bbd',
        sub,
      }),
    ).toMatchInlineSnapshot(
      `"0x10f643b3c42a80eff4054d3a3797f21184f2e8214e798f32e2955e368bdb022a"`,
    )
  })

  test('behavior: both issuer forms derive the same salt', () => {
    const key =
      '0x386dbea44366ca1bc39c345d135906f7dd30a4af48368a7eb67f5107217b0bbd'
    expect(Oidc.getSalt({ aud, iss: 'accounts.google.com', key, sub })).toBe(
      Oidc.getSalt({ aud, iss: 'https://accounts.google.com', key, sub }),
    )
  })
})

describe('hashIssuer', () => {
  test('default', () => {
    expect(
      Oidc.hashIssuer('https://accounts.google.com'),
    ).toMatchInlineSnapshot(
      `"0x2ff3ac6e640a4a5d80c0a97cdf74754c3126bde1d8772872a7b3d8afe0714da4"`,
    )
  })

  test('behavior: drops one leading https://', () => {
    expect(Oidc.hashIssuer('accounts.google.com')).toBe(
      Oidc.hashIssuer('https://accounts.google.com'),
    )
    expect(Oidc.hashIssuer('http://127.0.0.1:8789')).toMatchInlineSnapshot(
      `"0x1656ea090c49c9b4a8872fc6540d3c210b34ad42859aff31f059c28e999ba45d"`,
    )
  })

  test('error: rejects issuers over 128 bytes', () => {
    expect(() =>
      Oidc.hashIssuer(`https://${'a'.repeat(129)}`),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.ClaimTooLongError: The \`iss\` claim is 129 bytes; scheme \`0x01\` hashes at most 128 bytes.]`,
    )
  })
})

describe('hashKey', () => {
  test('default', () => {
    expect(Oidc.hashKey(modulus)).toMatchInlineSnapshot(
      `"0x23b74aa0d1eb061ea782b216511ac9d41615f2c10a9a6efc3b957599e93a13d3"`,
    )
  })

  test('error: rejects moduli that are not 256 bytes', () => {
    expect(() =>
      Oidc.hashKey(Hex.slice(modulus, 1)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.UnsupportedKeyError: The key is unsupported: modulus is not 256 bytes.]`,
    )
  })
})

describe('prepare', () => {
  const publicKey = Secp256k1.getPublicKey({
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  })

  test('default', () => {
    const prepared = Oidc.prepare({ publicKey, validUntil: 1760000540 })
    const { blinding, nonce, ...rest } = prepared
    expect(Hex.size(blinding)).toBe(32)
    expect(nonce).toBe(Oidc.getNonce(prepared))
    expect(rest.accessKeyAddress).toBe(Address.fromPublicKey(publicKey))
    expect(rest).toMatchInlineSnapshot(`
      {
        "accessKeyAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "validUntil": 1760000540,
      }
    `)
  })

  test('behavior: defaults validUntil to about 540 seconds from now', () => {
    const now = Math.floor(Date.now() / 1000)
    const { validUntil } = Oidc.prepare({ publicKey })
    expect(validUntil).toBeGreaterThanOrEqual(now + 540)
    expect(validUntil).toBeLessThanOrEqual(now + 545)
  })

  test('error: rejects an invalid expiry', () => {
    expect(() =>
      Oidc.prepare({ publicKey, validUntil: 1.5 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Oidc.InvalidTimestampError: \`validUntil\` (\`1.5\`) is not a timestamp in seconds.]`,
    )
  })
})

describe('randomBlinding', () => {
  test('default', () => {
    const blinding = Oidc.randomBlinding()
    expect(Hex.size(blinding)).toBe(32)
    expect(Hex.slice(blinding, 0, 1)).toBe('0x00')
    expect(Oidc.randomBlinding()).not.toBe(blinding)
  })
})
