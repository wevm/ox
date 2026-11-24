import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { Hex, Siwe } from 'ox'
import { createSiweMessage, parseSiweMessage } from 'viem/siwe'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const date = fc.date({
  min: new Date(0),
  max: new Date(4e12),
  noInvalidDate: true,
})

const message = fc.record(
  {
    address: fc
      .uint8Array({ minLength: 20, maxLength: 20 })
      .map((bytes) => ethers.getAddress(Hex.fromBytes(bytes)) as Hex.Hex),
    chainId: fc.integer({ min: 1, max: 2 ** 31 }),
    domain: fc.constantFrom(
      'example.com',
      'sub.example.org',
      'localhost:3000',
      'example.com:8080',
    ),
    expirationTime: date,
    issuedAt: date,
    nonce: fc.stringMatching(/^[a-zA-Z0-9]{8,16}$/),
    notBefore: date,
    requestId: fc.stringMatching(/^[a-zA-Z0-9-]{1,12}$/),
    resources: fc.array(
      fc.constantFrom(
        'https://example.com/a',
        'ipfs://bafy',
        'https://x.org/?q=1#f',
      ),
      { maxLength: 3 },
    ),
    scheme: fc.constantFrom('https', 'http'),
    statement: fc.stringMatching(/^[a-zA-Z0-9 .,!?']{0,40}$/),
    uri: fc.constantFrom(
      'https://example.com',
      'https://example.com/login',
      'did:key:z6Mk',
      'urn:uuid:1234',
    ),
    version: fc.constant('1' as const),
  },
  { requiredKeys: ['address', 'chainId', 'domain', 'nonce', 'uri', 'version'] },
)

describe('Siwe', () => {
  test.prop({ message }, { numRuns })(
    'createMessage writes what viem writes, and parseMessage reads it back as viem does',
    ({ message }) => {
      // Both default issuedAt to the current time, so fix it.
      const fixed = { ...message, issuedAt: message.issuedAt ?? new Date(1e12) }
      const text = Siwe.createMessage(fixed)
      expect(text).toBe(createSiweMessage(fixed))
      const parsed = Siwe.parseMessage(text)
      const expected: Record<string, unknown> = { ...fixed }
      if (expected.statement === '') delete expected.statement
      expect(parsed).toEqual(expected)
      expect(parsed).toEqual(parseSiweMessage(text))
    },
  )
})
