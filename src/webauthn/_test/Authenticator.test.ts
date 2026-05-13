import { describe, expect, test } from 'vitest'
import * as Bytes from '../../core/Bytes.js'
import * as P256 from '../../core/P256.js'
import * as PublicKey from '../../core/PublicKey.js'
import { Authenticator } from '../index.js'

describe('getAuthenticatorData', () => {
  test('default', () => {
    const authenticatorData = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce19470500000000"`,
    )
  })

  test('options: signCount', () => {
    const authenticatorData = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      signCount: 420,
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"`,
    )
  })

  test('options: flag', () => {
    const authenticatorData = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 1,
      signCount: 420,
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194701000001a4"`,
    )
  })
})

describe('getClientDataJSON', () => {
  test('default', () => {
    const clientDataJSON = Authenticator.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'https://example.com',
    })
    expect(clientDataJSON).toMatchInlineSnapshot(
      `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"`,
    )
  })

  test('options: crossOrigin', () => {
    const clientDataJSON = Authenticator.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'https://example.com',
      crossOrigin: true,
    })
    expect(clientDataJSON).toMatchInlineSnapshot(
      `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":true}"`,
    )
  })
})

describe('getAuthenticatorData (publicKey overloads)', () => {
  test('credential.publicKey as Hex', () => {
    const { publicKey } = P256.createKeyPair()
    const credentialId = new Uint8Array(32)

    const fromObject = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey },
    })
    const fromHex = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey: PublicKey.toHex(publicKey) },
    })

    expect(fromHex).toBe(fromObject)
  })

  test('credential.publicKey as Bytes', () => {
    const { publicKey } = P256.createKeyPair()
    const credentialId = new Uint8Array(32)

    const fromObject = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey },
    })
    const fromBytes = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: {
        id: credentialId,
        publicKey: PublicKey.toBytes(publicKey),
      },
    })

    expect(fromBytes).toBe(fromObject)
  })

  test('credential.publicKey as Hex (Bytes output)', () => {
    const { publicKey } = P256.createKeyPair()
    const credentialId = new Uint8Array(32)

    const fromObject = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey },
      as: 'Bytes',
    })
    const fromHex = Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey: PublicKey.toHex(publicKey) },
      as: 'Bytes',
    })

    expect(fromObject).toBeInstanceOf(Uint8Array)
    expect(fromHex).toEqual(fromObject)
  })
})

describe('getSignCount', () => {
  test('from hex', () => {
    expect(
      Authenticator.getSignCount(
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
      ),
    ).toBe(1)
  })

  test('from bytes', () => {
    expect(
      Authenticator.getSignCount(
        Bytes.fromHex(
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
        ),
      ),
    ).toBe(1)
  })

  test('from parsed AuthenticatorData', () => {
    const parsed = Authenticator.parse(
      '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000007',
    )!
    expect(Authenticator.getSignCount(parsed)).toBe(7)
  })

  test('returns 0 when input shorter than 37 bytes', () => {
    expect(Authenticator.getSignCount('0x00')).toBe(0)
    expect(Authenticator.getSignCount(new Uint8Array(10))).toBe(0)
  })
})

describe('parse', () => {
  test('default', () => {
    const parsed = Authenticator.parse(
      '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
    )
    expect(parsed).toMatchObject({
      flags: 0x05,
      up: true,
      uv: true,
      be: false,
      bs: false,
      at: false,
      ed: false,
      signCount: 1,
    })
  })

  test('from bytes', () => {
    const bytes = Bytes.fromHex(
      '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
    )
    const parsed = Authenticator.parse(bytes)
    expect(parsed?.signCount).toBe(1)
    expect(parsed?.bytes).toBe(bytes)
  })

  test('returns undefined for short input', () => {
    expect(Authenticator.parse('0x00')).toBeUndefined()
    expect(Authenticator.parse(new Uint8Array(10))).toBeUndefined()
  })
})
