import { expect, test } from 'vitest'
import * as exports from './WebAuthnP256.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "CredentialCreationFailedError",
      "CredentialRequestFailedError",
      "createCredential",
      "getAuthenticatorData",
      "getClientDataJSON",
      "getCredentialCreationOptions",
      "getCredentialRequestOptions",
      "getSignPayload",
      "sign",
      "verify",
    ]
  `)
})
