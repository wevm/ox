import { WebAuthnP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const authenticatorData = WebAuthnP256.getAuthenticatorData({
    rpId: 'example.com',
  })
  expect(authenticatorData).toMatchInlineSnapshot(
    `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce19470500000000"`,
  )
})

test('options: signCount', () => {
  const authenticatorData = WebAuthnP256.getAuthenticatorData({
    rpId: 'example.com',
    signCount: 420,
  })
  expect(authenticatorData).toMatchInlineSnapshot(
    `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"`,
  )
})

test('options: flag', () => {
  const authenticatorData = WebAuthnP256.getAuthenticatorData({
    rpId: 'example.com',
    flag: 1,
    signCount: 420,
  })
  expect(authenticatorData).toMatchInlineSnapshot(
    `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194701000001a4"`,
  )
})
