import { expect, test } from 'vitest'
import * as exports from './WebAuthnP256.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "CredentialCreationFailedError",
      "CredentialRequestFailedError",
      "createCredential",
      "getCredentialCreationOptions",
      "getCredentialRequestOptions",
      "sign",
      "verify",
    ]
  `)
})
