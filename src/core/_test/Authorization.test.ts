import { Authorization, type Hex, Secp256k1 } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('from', () => {
  test('default', () => {
    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      expectTypeOf(authorization).toEqualTypeOf<{
        readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
        readonly chainId: 1
        readonly nonce: 40n
      }>()
      expectTypeOf(authorization).toMatchTypeOf<
        Authorization.Authorization<false>
      >()
      expect(authorization).toMatchInlineSnapshot(
        `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
      }
    `,
      )
    }

    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
        yParity: 0,
      })
      expectTypeOf(authorization).toEqualTypeOf<{
        readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
        readonly chainId: 1
        readonly nonce: 40n
        readonly r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf'
        readonly s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8'
        readonly yParity: 0
      }>()
      expectTypeOf(authorization).toMatchTypeOf<
        Authorization.Authorization<true>
      >()
      expect(authorization).toMatchInlineSnapshot(
        `
        {
          "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "chainId": 1,
          "nonce": 40n,
          "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
          "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
          "yParity": 0,
        }
      `,
      )
    }
  })

  test('options: signature', () => {
    const authorization = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const signature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })
    const authorization_signed = Authorization.from(authorization, {
      signature,
    })
    expectTypeOf(authorization_signed).toEqualTypeOf<{
      readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
      readonly chainId: 1
      readonly nonce: 40n
      readonly r: Hex.Hex
      readonly s: Hex.Hex
      readonly yParity: number
    }>()
    expectTypeOf(authorization_signed).toMatchTypeOf<
      Authorization.Authorization<true>
    >()
    expect(authorization_signed).toMatchInlineSnapshot(
      `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
        "r": "0xa513a287a156a99f2be4023466d401589e33add75c057e5fd376d11ed8946cf3",
        "s": "0x371440c5f5c845ae5260bffccf9e28307b9204216faeaa0e27a6608bcdd7e047",
        "yParity": 1,
      }
    `,
    )
  })

  test('behavior: rpc', () => {
    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: '0x1',
        nonce: '0x1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      })
      expectTypeOf(authorization).toMatchTypeOf<Authorization.Authorization>()
      expect(authorization).toMatchInlineSnapshot(
        `
        {
          "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "chainId": 1,
          "nonce": 1n,
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "yParity": 0,
        }
      `,
      )
    }
  })
})

describe('fromRpc', () => {
  test('default', () => {
    expect(
      Authorization.fromRpc({
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1',
        nonce: '0x1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
        "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
        "yParity": 0,
      }
    `)
  })
})

describe('fromRpcList', () => {
  test('default', () => {
    expect(
      Authorization.fromRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: '0x0',
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: '0x0',
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 1,
          "nonce": 1n,
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "yParity": 0,
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": 1,
          "nonce": 1n,
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "yParity": 0,
        },
      ]
    `)
  })
})

describe('fromTuple', () => {
  test('default', () => {
    const tuple = [
      '0x1',
      '0x0000000000000000000000000000000000000000',
      '0x3',
    ] as const satisfies Authorization.Tuple
    const authorization = Authorization.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 3n,
    }
  `)
  })

  test('behavior: zeroish nonce + chainId', () => {
    const tuple = [
      '0x',
      '0x0000000000000000000000000000000000000000',
      '0x',
    ] as const satisfies Authorization.Tuple
    const authorization = Authorization.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 0,
        "nonce": 0n,
      }
    `)
  })

  test('behavior: signature', () => {
    const tuple = [
      '0x1',
      '0x0000000000000000000000000000000000000000',
      '0x3',
      '0x',
      '0x01',
      '0x02',
    ] as const satisfies Authorization.Tuple
    const authorization = Authorization.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 3n,
        "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
        "yParity": 0,
      }
    `)
  })
})

describe('fromTupleList', () => {
  test('default', () => {
    const tupleList = [
      ['0x01', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x28'],
      ['0x03', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14'],
    ] as const satisfies Authorization.TupleList
    const authorization = Authorization.fromTupleList(tupleList)
    expect(authorization).toMatchInlineSnapshot(`
    [
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 3,
        "nonce": 20n,
      },
    ]
  `)
  })

  test('behavior: signature', () => {
    const tupleList = [
      [
        '0x05',
        '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        '0x2a',
        '0x',
        '0x01',
        '0x02',
      ],
      [
        '0x02',
        '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        '0x2b',
        '0x',
        '0x04',
        '0x05',
      ],
    ] as const satisfies Authorization.TupleList
    const authorization = Authorization.fromTupleList(tupleList)
    expect(authorization).toMatchInlineSnapshot(`
      [
        {
          "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "chainId": 5,
          "nonce": 42n,
          "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
          "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
          "yParity": 0,
        },
        {
          "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "chainId": 2,
          "nonce": 43n,
          "r": "0x0000000000000000000000000000000000000000000000000000000000000004",
          "s": "0x0000000000000000000000000000000000000000000000000000000000000005",
          "yParity": 0,
        },
      ]
    `)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      Authorization.getSignPayload({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      }),
    ).toMatchInlineSnapshot(
      `"0x5919da563810a99caf657d42bd10905adbd28b3b89b8a4577efa471e5e4b3914"`,
    )

    expect(
      Authorization.getSignPayload({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 69,
        nonce: 420n,
      }),
    ).toMatchInlineSnapshot(
      `"0x7bdd120f6437316be99b11232d472bb0209d20d7c564f4dfbad855189e830b15"`,
    )
  })
})

describe('hash', () => {
  test('default', () => {
    expect(
      Authorization.hash({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      }),
    ).toMatchInlineSnapshot(
      `"0x5919da563810a99caf657d42bd10905adbd28b3b89b8a4577efa471e5e4b3914"`,
    )

    expect(
      Authorization.hash({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 69,
        nonce: 420n,
      }),
    ).toMatchInlineSnapshot(
      `"0x7bdd120f6437316be99b11232d472bb0209d20d7c564f4dfbad855189e830b15"`,
    )
  })

  test('options: presign equals getSignPayload', () => {
    const authorization = {
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    } as const
    const payload = Authorization.getSignPayload(authorization)
    const hash_presign = Authorization.hash(authorization, { presign: true })
    expect(hash_presign).toEqual(payload)
  })

  test('behavior: signed vs presign', () => {
    const authorization = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const signature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })
    const signed = Authorization.from(authorization, { signature })

    const hash_default = Authorization.hash(signed)
    const hash_presign = Authorization.hash(signed, { presign: true })
    expect(hash_default).not.toEqual(hash_presign)
    expect(hash_presign).toEqual(Authorization.getSignPayload(authorization))
    expect(
      Secp256k1.recoverAddress({
        payload: Authorization.hash(authorization, { presign: true }),
        signature,
      }),
    ).toEqual(accounts[0].address)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      Authorization.toRpc({
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        nonce: 1n,
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: 0,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": "0x1",
        "nonce": "0x1",
        "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
        "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
        "yParity": "0x0",
      }
    `)
  })
})

describe('toRpcList', () => {
  test('default', () => {
    expect(
      Authorization.toRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          nonce: 1n,
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: 0,
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": "0x1",
          "nonce": "0x1",
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "yParity": "0x0",
        },
      ]
    `)
  })
})

describe('toTuple', () => {
  test('default', () => {
    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      const tuple = Authorization.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
        [
          "0x1",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x28",
        ]
      `)
    }

    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        r: '0x01',
        s: '0x02',
        yParity: 0,
      })
      const tuple = Authorization.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
        [
          "0x1",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x28",
          "0x",
          "0x1",
          "0x2",
        ]
      `)
    }

    {
      const authorization = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 0,
        nonce: 0n,
      })
      const tuple = Authorization.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
      [
        "0x",
        "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "0x",
      ]
    `)
    }
  })
})

describe('toTupleList', () => {
  test('default', () => {
    {
      const tuple = Authorization.toTupleList([])
      expect(tuple).toMatchInlineSnapshot('[]')
    }

    {
      const authorization_1 = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      const authorization_2 = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 3,
        nonce: 20n,
      })
      const tuple = Authorization.toTupleList([
        authorization_1,
        authorization_2,
      ])
      expect(tuple).toMatchInlineSnapshot(`
        [
          [
            "0x1",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x28",
          ],
          [
            "0x3",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x14",
          ],
        ]
      `)
    }

    {
      const authorization_3 = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 5,
        nonce: 42n,
        r: '0x01',
        s: '0x02',
        yParity: 0,
      })
      const authorization_4 = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 2,
        nonce: 43n,
        r: '0x04',
        s: '0x05',
        yParity: 0,
      })
      const tuple = Authorization.toTupleList([
        authorization_3,
        authorization_4,
      ])
      expect(tuple).toMatchInlineSnapshot(`
        [
          [
            "0x5",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x2a",
            "0x",
            "0x1",
            "0x2",
          ],
          [
            "0x2",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x2b",
            "0x",
            "0x4",
            "0x5",
          ],
        ]
      `)
    }
  })

  test('behavior: undefined input returns empty', () => {
    // Explicitly call without an argument to exercise optional parameter path.
    const tuple = Authorization.toTupleList()
    expect(tuple).toMatchInlineSnapshot('[]')
  })
})

test('exports', () => {
  expect(Object.keys(Authorization)).toMatchInlineSnapshot(`
    [
      "from",
      "fromRpc",
      "fromRpcList",
      "fromTuple",
      "fromTupleList",
      "getSignPayload",
      "hash",
      "toRpc",
      "toRpcList",
      "toTuple",
      "toTupleList",
    ]
  `)
})
