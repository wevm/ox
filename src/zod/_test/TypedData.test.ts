import { describe, expect, test } from 'vp/test'
import * as z_TypedData from '../TypedData.js'
import * as z from 'zod/mini'

describe('TypedData', () => {
  test('decodes EIP-712 types maps', () => {
    expect(
      z.decode(z_TypedData.TypedData, {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "Mail": [
          {
            "name": "from",
            "type": "Person",
          },
          {
            "name": "to",
            "type": "Person",
          },
          {
            "name": "contents",
            "type": "string",
          },
        ],
        "Person": [
          {
            "name": "name",
            "type": "string",
          },
          {
            "name": "wallet",
            "type": "address",
          },
        ],
      }
    `)
  })

  test('rejects invalid references', () => {
    expect(
      z.safeDecode(z_TypedData.TypedData, {
        Mail: [{ name: 'from', type: 'Person' }],
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TypedData.TypedData, {
        Person: [{ name: 'parent', type: 'Person' }],
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TypedData.TypedData, {
        Foo: [{ name: 'bar', type: 'Bar' }],
        Bar: [{ name: 'foo', type: 'Foo' }],
      }).success,
    ).toBe(false)
  })

  test('decodes domains with ABIType-compatible salt strings', () => {
    expect(
      z.decode(z_TypedData.Domain, {
        chainId: 1,
        name: 'EtherMail',
        salt: 'not-hex',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "name": "EtherMail",
        "salt": "not-hex",
        "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        "version": "1",
      }
    `)
  })
})
