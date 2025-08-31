import { Authorization, Secp256k1 } from 'ox'
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
        r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
        s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
        yParity: 0,
      })
      expectTypeOf(authorization).toEqualTypeOf<{
        readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
        readonly chainId: 1
        readonly nonce: 40n
        readonly r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n
        readonly s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n
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
        "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
        "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
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
      readonly r: bigint
      readonly s: bigint
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
      "r": 74666311849961653398815470296948700361392062371901161364182304079113687952627n,
      "s": 24912990662134805731506157958890440652926649106845286943280690489391727501383n,
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
        "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
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
      "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
      "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
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
        "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        "yParity": 0,
      },
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
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
      "r": 1n,
      "s": 2n,
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
        "r": 1n,
        "s": 2n,
        "yParity": 0,
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 2,
        "nonce": 43n,
        "r": 4n,
        "s": 5n,
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
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
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
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
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
        r: 1n,
        s: 2n,
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
        r: 1n,
        s: 2n,
        yParity: 0,
      })
      const authorization_4 = Authorization.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 2,
        nonce: 43n,
        r: 4n,
        s: 5n,
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
