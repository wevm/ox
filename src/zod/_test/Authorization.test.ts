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

  test('accepts yParity above 1', () => {
    expect(
      z.decode(z_Authorization.Signed, {
        address,
        chainId: '0x1',
        nonce: '0x2',
        r,
        s,
        yParity: '0x1c',
      }).yParity,
    ).toMatchInlineSnapshot(`28`)
    expect(
      z.encode(z_Authorization.SignedToRpc, {
        address,
        chainId: 1,
        nonce: 2n,
        r,
        s,
        yParity: 28,
      }).yParity,
    ).toMatchInlineSnapshot(`"0x1c"`)
    expect(
      z.decode(z_Authorization.TupleSigned, [
        '0x1',
        address,
        '0x2',
        '0x1c',
        r,
        s,
      ])[3],
    ).toMatchInlineSnapshot(`"0x1c"`)
  })

  test('accepts r and s without leading zeros', () => {
    // Authorization from mainnet tx 0x701f5911c66298aee60c1fc2b56063de81efcde3186d0ad317d083098bbb7b51.
    const rpc = {
      address: '0x77021100bd87b7008e5e1989d0eb38555d0d0000',
      chainId: '0x1',
      nonce: '0x0',
      r: '0x3baad1283c99f51e583a6a11c677c1a0bdad1b544345cfbcbd52b15d98a01ab8',
      s: '0xcd04e7ee3547adf0fb459aed29f7cf11f015574dfdfaf6b154d9946579ce84',
      yParity: '0x1',
    } as const
    const decoded = z.decode(z_Authorization.Signed, rpc)
    expect(decoded).toMatchInlineSnapshot(`
      {
        "address": "0x77021100bd87b7008e5e1989d0eb38555d0d0000",
        "chainId": 1,
        "nonce": 0n,
        "r": "0x3baad1283c99f51e583a6a11c677c1a0bdad1b544345cfbcbd52b15d98a01ab8",
        "s": "0x00cd04e7ee3547adf0fb459aed29f7cf11f015574dfdfaf6b154d9946579ce84",
        "yParity": 1,
      }
    `)
    expect(z.encode(z_Authorization.Signed, decoded)).toEqual(rpc)
    expect(z.encode(z_Authorization.SignedToRpc, decoded)).toEqual(rpc)
    expect(z.decode(z_Authorization.ListSigned, [rpc])).toEqual([decoded])
  })

  test('rejects invalid signatures', () => {
    expect(
      z.safeDecode(z_Authorization.Signed, {
        address,
        chainId: '0x1',
        nonce: '0x2',
        r,
        s,
        yParity: '0x100',
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_Authorization.TupleSigned, [
        '0x1',
        address,
        '0x2',
        '0x100',
        r,
        s,
      ]).success,
    ).toBe(false)
  })
})
