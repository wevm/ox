import { WebAuthnP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const clientDataJSON = WebAuthnP256.getClientDataJSON({
    challenge: '0xdeadbeef',
    origin: 'https://example.com',
  })
  expect(clientDataJSON).toMatchInlineSnapshot(
    `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"`,
  )
})

test('options: crossOrigin', () => {
  const clientDataJSON = WebAuthnP256.getClientDataJSON({
    challenge: '0xdeadbeef',
    origin: 'https://example.com',
    crossOrigin: true,
  })
  expect(clientDataJSON).toMatchInlineSnapshot(
    `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":true}"`,
  )
})
