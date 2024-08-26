import { expect, test } from 'vitest'
import * as exports from './Siwe.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "domainRegex",
      "ipRegex",
      "localhostRegex",
      "nonceRegex",
      "prefixRegex",
      "schemeRegex",
      "suffixRegex",
      "SiweInvalidMessageFieldError",
      "createMessage",
      "generateNonce",
      "isUri",
      "parseMessage",
      "validateMessage",
    ]
  `)
})
