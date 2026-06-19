import { describe, expect, test } from 'vp/test'
import * as z_Authorization from '../Authorization.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const r = `0x${'11'.repeat(32)}` as const
const s = `0x${'22'.repeat(32)}` as const

describe('Authorization', () => {
  test('decodes and encodes unsigned authorizations', () => {
    expect(
      z.decode(z_Authorization.Authorization, {
        address,
        chainId: '0x1',
        nonce: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 2n,
      }
    `)
    expect(
      z.encode(z_Authorization.Authorization, {
        address,
        chainId: 1,
        nonce: 2n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": "0x1",
        "nonce": "0x2",
      }
    `)
  })

  test('decodes and encodes signed authorizations', () => {
    expect(
      z.decode(z_Authorization.Signed, {
        address,
        chainId: '0x1',
        nonce: '0x2',
        r,
        s,
        yParity: '0x1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 2n,
        "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "yParity": 1,
      }
    `)
    expect(
      z.encode(z_Authorization.Signed, {
        address,
        chainId: 1,
        nonce: 2n,
        r,
        s,
        yParity: 1,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": "0x1",
        "nonce": "0x2",
        "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "yParity": "0x1",
      }
    `)
  })

  test('AuthorizationToRpc accepts numberish encode inputs', () => {
    const expected = {
      address,
      chainId: '0x1',
      nonce: '0x2',
      r,
      s,
      yParity: '0x1',
    }

    expect(
      z.encode(z_Authorization.SignedToRpc, {
        address,
        chainId: 1,
        nonce: 2n,
        r,
        s,
        yParity: 1,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_Authorization.SignedToRpc, {
        address,
        chainId: 1,
        nonce: 2,
        r,
        s,
        yParity: 1,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_Authorization.SignedToRpc, {
        address,
        chainId: '0x1',
        nonce: '0x2',
        r,
        s,
        yParity: 1,
      }),
    ).toEqual(expected)
  })

  test('validates lists and tuples', () => {
    expect(
      z.decode(z_Authorization.ListSigned, [
        { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x1' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 1,
          "nonce": 2n,
          "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
          "yParity": 1,
        },
      ]
    `)
    expect(z.decode(z_Authorization.Tuple, ['0x1', address, '0x2']))
      .toMatchInlineSnapshot(`
        [
          "0x1",
          "0x0000000000000000000000000000000000000000",
          "0x2",
        ]
      `)
    expect(
      z.decode(z_Authorization.TupleSigned, [
        '0x1',
        address,
        '0x2',
        '0x1',
        r,
        s,
      ]),
    ).toMatchInlineSnapshot(`
      [
        "0x1",
        "0x0000000000000000000000000000000000000000",
        "0x2",
        "0x1",
        "0x1111111111111111111111111111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      ]
    `)
  })

  test('rejects invalid signatures', () => {
    expect(
      z.safeDecode(z_Authorization.Signed, {
        address,
        chainId: '0x1',
        nonce: '0x2',
        r,
        s,
        yParity: '0x2',
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_Authorization.TupleSigned, [
        '0x1',
        address,
        '0x2',
        '0x2',
        r,
        s,
      ]).success,
    ).toBe(false)
  })
})
