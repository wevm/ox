import { Abi, AbiEvent, Hex, Log } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )
  const args = Log.toArgs(
    {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    },
    {
      abiEvent,
    },
  )
  expect(args).toMatchInlineSnapshot(`
    {
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
})

test('behavior: filter logs, network', async () => {
  const abi = Abi.from([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ])
  const logs = await anvilMainnet.request({
    method: 'eth_getLogs',
    params: [
      {
        fromBlock: Hex.fromNumber(
          (anvilMainnet.config.forkBlockNumber as bigint) - 5n,
        ),
        toBlock: Hex.fromNumber(anvilMainnet.config.forkBlockNumber!),
      },
    ],
  })
  expect(
    logs
      .map((rpcLog) => {
        try {
          const log = Log.fromRpc(rpcLog)
          const abiEvent = AbiEvent.fromAbi(abi, { name: log.topics[0] })
          return {
            args: Log.toArgs(log, {
              abiEvent,
              matchArgs: {
                from: [
                  '0x916fa3c896bb0bb9171a3f5bfb1f76b5cff3b46b',
                  '0x2aeee741fa1e21120a21e57db9ee545428e683c9',
                ],
              },
            }),
            event: abiEvent.name,
            log,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean),
  ).toMatchSnapshot()
})

test('behavior: args, named', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )

  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          value: 1n,
        },
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        },
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          from: ['0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac', address.vitalik],
          to: null,
        },
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
})

test('behavior: args, unnamed', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256)',
  )

  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: [
          '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          1n,
        ],
      },
    ),
  ).toMatchInlineSnapshot(`
    [
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      1n,
    ]
  `)
  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: ['0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac'],
      },
    ),
  ).toMatchInlineSnapshot(`
    [
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      1n,
    ]
  `)
  expect(
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: [
          null,
          ['0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac', address.vitalik],
          1n,
        ],
      },
    ),
  ).toMatchInlineSnapshot(`
    [
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      1n,
    ]
  `)
})

test('error: args mismatch, named', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )

  expect(() =>
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
          to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          value: 1n,
        },
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Log.ArgsMismatchError: Provided arguments to not match the arguments decoded from the log.

    Event: event Transfer(address indexed from, address indexed to, uint256 value)
    Decoded Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      value:  1
    Provided Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      value:  1]
  `)
})

test('error: args mismatch, unnamed', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256)',
  )

  expect(() =>
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: ['0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Log.ArgsMismatchError: Provided arguments to not match the arguments decoded from the log.

    Event: event Transfer(address indexed, address indexed, uint256)
    Decoded Arguments: 
      0:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      1:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      2:  1
    Provided Arguments: 
      0:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad]
  `)
})

test('error: args mismatch, string', () => {
  const abiEvent = AbiEvent.from('event Transfer(string indexed a)')

  expect(() =>
    Log.toArgs(
      {
        topics: [
          '0x7cebee4ee226a36ff8751d9d69bb8265f5138c825f8c25d7ebdd60d972ffe5be',
          '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          a: '0xdeadbeef',
        },
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Log.ArgsMismatchError: Provided arguments to not match the arguments decoded from the log.

    Event: event Transfer(string indexed a)
    Decoded Arguments: 
      a:  0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
    Provided Arguments: 
      a:  0xdeadbeef]
  `)
})

test('error: input not found, named', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )

  expect(() =>
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          // @ts-expect-error
          a: 'b',
          from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
          to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          value: 1n,
        },
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AbiEvent.InputNotFoundError: Parameter "a" not found on \`event Transfer(address indexed from, address indexed to, uint256 value)\`.]`,
  )
})

test('error: input not found, unnamed', () => {
  const abiEvent = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256)',
  )

  expect(() =>
    Log.toArgs(
      {
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        ],
      },
      {
        abiEvent,
        matchArgs: [
          '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          1n,
          // @ts-expect-error
          1n,
        ],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AbiEvent.InputNotFoundError: Parameter "3" not found on \`event Transfer(address indexed, address indexed, uint256)\`.]`,
  )
})

test('error: provided args, but no actual event args', () => {
  const abiEvent = AbiEvent.from('event Transfer()')

  expect(() =>
    Log.toArgs(
      {
        topics: [
          '0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0',
        ],
      },
      {
        abiEvent,
        matchArgs: {
          // @ts-ignore
          from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678az',
          to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
          value: 1n,
        },
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Log.ArgsMismatchError: Provided arguments to not match the arguments decoded from the log.

    Event: event Transfer()
    Decoded Arguments: None
    Provided Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678az
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      value:  1]
  `)
})
