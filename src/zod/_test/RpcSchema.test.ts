import { describe, expect, test } from 'vp/test'
import * as z_RpcSchema from '../RpcSchema.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const hash = `0x${'11'.repeat(32)}` as const
const topic = `0x${'33'.repeat(32)}` as const

describe('parseParams', () => {
  test('decodes params (block number / tag coercion)', () => {
    expect(
      z_RpcSchema.parseParams(z_RpcSchema.Eth, 'eth_getBlockByNumber', [
        '0x1b4',
        true,
      ]),
    ).toMatchInlineSnapshot(`
      [
        436n,
        true,
      ]
    `)
    expect(
      z_RpcSchema.parseParams(z_RpcSchema.Eth, 'eth_getBlockByNumber', [
        'latest',
        false,
      ]),
    ).toMatchInlineSnapshot(`
      [
        "latest",
        false,
      ]
    `)
  })

  test('decodes wallet params', () => {
    expect(
      z_RpcSchema.parseParams(
        z_RpcSchema.Wallet,
        'wallet_switchEthereumChain',
        [{ chainId: '0x1' }],
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "chainId": "0x1",
        },
      ]
    `)
  })
})

describe('parseReturns', () => {
  test('decodes scalar return types', () => {
    expect(
      z_RpcSchema.parseReturns(z_RpcSchema.Eth, 'eth_blockNumber', '0x1b4'),
    ).toMatchInlineSnapshot(`"0x1b4"`)
    expect(z_RpcSchema.parseReturns(z_RpcSchema.Eth, 'eth_accounts', [address]))
      .toMatchInlineSnapshot(`
      [
        "0x0000000000000000000000000000000000000000",
      ]
    `)
  })

  test('decodes fee history return type', () => {
    expect(
      z_RpcSchema.parseReturns(z_RpcSchema.Eth, 'eth_feeHistory', {
        baseFeePerGas: ['0x1', '0x2'],
        gasUsedRatio: [0.5],
        oldestBlock: '0x10',
        reward: [['0x3']],
      }),
    ).toMatchInlineSnapshot(`
      {
        "baseFeePerGas": [
          1n,
          2n,
        ],
        "gasUsedRatio": [
          0.5,
        ],
        "oldestBlock": 16n,
        "reward": [
          [
            3n,
          ],
        ],
      }
    `)
  })

  test('decodes log return types', () => {
    expect(
      z_RpcSchema.parseReturns(z_RpcSchema.Eth, 'eth_getLogs', [
        {
          address,
          blockHash: hash,
          blockNumber: '0x1',
          data: '0x',
          logIndex: '0x0',
          topics: [topic],
          transactionHash: hash,
          transactionIndex: '0x0',
          removed: false,
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "blockNumber": 1n,
          "data": "0x",
          "logIndex": 0,
          "removed": false,
          "topics": [
            "0x3333333333333333333333333333333333333333333333333333333333333333",
          ],
          "transactionHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "transactionIndex": 0,
        },
      ]
    `)
  })

  test('decodes nullable return types', () => {
    expect(
      z_RpcSchema.parseReturns(
        z_RpcSchema.Eth,
        'eth_getTransactionReceipt',
        null,
      ),
    ).toMatchInlineSnapshot(`null`)
  })
})

describe('parseItem', () => {
  test('looks up a method schema', () => {
    expect(
      z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_blockNumber').method,
    ).toMatchInlineSnapshot(`"eth_blockNumber"`)
  })

  test('throws for unknown methods', () => {
    expect(() =>
      z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_unknownMethod' as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[RpcSchema.MethodNotFoundError: Method \`eth_unknownMethod\` does not exist on the schema.]`,
    )
  })
})

describe('parseRequest', () => {
  test('dispatches by method', () => {
    expect(
      z_RpcSchema.parseRequest(z_RpcSchema.Eth, {
        method: 'eth_getBlockByNumber',
        params: ['0x1', true],
      }),
    ).toMatchInlineSnapshot(`
      {
        "method": "eth_getBlockByNumber",
        "params": [
          1n,
          true,
        ],
      }
    `)
  })

  test('parse is an alias of parseRequest', () => {
    expect(
      z_RpcSchema.parse(z_RpcSchema.Wallet, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "method": "wallet_switchEthereumChain",
        "params": [
          {
            "chainId": "0x1",
          },
        ],
      }
    `)
  })

  test('Default dispatches across eth_ and wallet_ methods', () => {
    expect(
      z_RpcSchema.parseRequest(z_RpcSchema.Default, {
        method: 'eth_getBlockByNumber',
        params: ['0x1', true],
      }),
    ).toMatchInlineSnapshot(`
      {
        "method": "eth_getBlockByNumber",
        "params": [
          1n,
          true,
        ],
      }
    `)
    expect(
      z_RpcSchema.parseRequest(z_RpcSchema.Default, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "method": "wallet_switchEthereumChain",
        "params": [
          {
            "chainId": "0x1",
          },
        ],
      }
    `)
  })

  test('rejects unknown methods', () => {
    expect(
      z.safeDecode(
        z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_getBalance').params,
        ['not-an-address', 'latest'] as never,
      ).success,
    ).toMatchInlineSnapshot(`false`)
    expect(() =>
      z_RpcSchema.parseRequest(z_RpcSchema.Eth, {
        method: 'eth_unknownMethod',
        params: [],
      } as never),
    ).toThrow()
  })
})

describe('from', () => {
  test('single method returns an Item', () => {
    const item = z_RpcSchema.from({
      method: 'eth_blockNumber',
      params: z.optional(z.tuple([])),
      returns: z.string(),
    })
    expect(item.method).toMatchInlineSnapshot(`"eth_blockNumber"`)
    expect(item.request).toBeDefined()
  })

  test('namespace normalizes keyed params/returns into Items', () => {
    const schema = z_RpcSchema.from({
      abe_foo: {
        params: z.tuple([z.number()]),
        returns: z.string(),
      },
    })

    expect(schema.abe_foo.method).toMatchInlineSnapshot(`"abe_foo"`)
    expect(z_RpcSchema.parseParams(schema, 'abe_foo', [1]))
      .toMatchInlineSnapshot(`
      [
        1,
      ]
    `)
    expect(
      z_RpcSchema.parseReturns(schema, 'abe_foo', 'hello'),
    ).toMatchInlineSnapshot(`"hello"`)
    expect(z_RpcSchema.parseRequest(schema, { method: 'abe_foo', params: [1] }))
      .toMatchInlineSnapshot(`
      {
        "method": "abe_foo",
        "params": [
          1,
        ],
      }
    `)
  })

  test('namespace spreads existing ox/zod namespaces', () => {
    const schema = z_RpcSchema.from({
      ...z_RpcSchema.Eth,
      abe_foo: {
        params: z.tuple([z.number()]),
        returns: z.string(),
      },
    })

    expect(schema.eth_blockNumber.method).toMatchInlineSnapshot(
      `"eth_blockNumber"`,
    )
    expect(schema.abe_foo.method).toMatchInlineSnapshot(`"abe_foo"`)
  })
})
