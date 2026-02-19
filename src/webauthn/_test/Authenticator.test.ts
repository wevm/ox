import { describe, expect, test } from 'vitest'
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
