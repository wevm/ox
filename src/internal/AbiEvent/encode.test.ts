import { AbiEvent, Hex } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const transfer = AbiEvent.from('event Transfer()')
  expect(AbiEvent.encode(transfer)).toMatchInlineSnapshot(`
    [
      "0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0",
    ]
  `)
})

test('behavior: no hash', () => {
  const transfer = AbiEvent.from('event Transfer()')
  expect(
    AbiEvent.encode({ ...transfer, hash: undefined }),
  ).toMatchInlineSnapshot(`
    [
      "0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0",
    ]
  `)
})

test('behavior: multiple inputs, no args', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed a, address indexed b, uint256 c)',
  )
  expect(AbiEvent.encode(transfer)).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    ]
  `)
})

test('behavior: multiple inputs, with args, named', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed a, address indexed b, uint256 c)',
  )

  expect(
    AbiEvent.encode(transfer, {
      a: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      null,
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      b: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: '0x0000000000000000000000000000000000000000',
      b: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: null,
      b: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: ['0x0000000000000000000000000000000000000000', address.vitalik],
      b: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
      ],
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)
})

test('behavior: multiple inputs, with args, unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256 )',
  )

  expect(
    AbiEvent.encode(transfer, ['0x0000000000000000000000000000000000000000']),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      null,
    ]
  `)

  expect(
    AbiEvent.encode(transfer, [
      null,
      '0x0000000000000000000000000000000000000000',
    ]),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
    ]),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, [
      ['0x0000000000000000000000000000000000000000', address.vitalik],
      '0x0000000000000000000000000000000000000000',
    ]),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
      ],
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)
})

test('behavior: multiple inputs, with args, partially named', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed a, address indexed, uint256 c)',
  )

  expect(
    AbiEvent.encode(transfer, {
      a: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      null,
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      1: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: '0x0000000000000000000000000000000000000000',
      1: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: null,
      1: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)

  expect(
    AbiEvent.encode(transfer, {
      a: ['0x0000000000000000000000000000000000000000', address.vitalik],
      1: '0x0000000000000000000000000000000000000000',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
      ],
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ]
  `)
})

test('behavior: string inputs', () => {
  const transfer = AbiEvent.from('event Transfer(string indexed a, string b)')

  expect(
    AbiEvent.encode(transfer, {
      a: 'hello',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0x89525573e05dbc5f7f7f72e98f8145459e8b183e54c819fa7029f09a04115d89",
      "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
    ]
  `)
})

test('behavior: leading non-indexed inputs', () => {
  const transfer = AbiEvent.from('event Transfer(uint256 a, string indexed b)')

  expect(
    AbiEvent.encode(transfer, {
      b: 'hello',
    }),
  ).toMatchInlineSnapshot(`
    [
      "0x9060fea662832699cca863409e283b48eb088414dc780c4d43afe69caefee4b5",
      "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
    ]
  `)
})

test('behavior: network', async () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )

  const logs = await anvilMainnet.request({
    method: 'eth_getLogs',
    params: [
      {
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
        fromBlock: Hex.from(19760235n),
        toBlock: Hex.from(19760240n),
        topics: AbiEvent.encode(transfer),
      },
    ],
  })

  expect(logs[0]!.topics).toMatchInlineSnapshot(`
    [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
      "0x000000000000000000000000000000000000000000000000000000000000025b",
    ]
  `)
})

test('error: tuple input', () => {
  const transfer = AbiEvent.from('event Transfer((string) indexed a, string b)')

  expect(() =>
    AbiEvent.encode(transfer, {
      a: ['hello'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[FilterTypeNotSupportedError: Filter type "tuple" is not supported.]`,
  )
})

test('error: array input', () => {
  const transfer = AbiEvent.from(
    'event Transfer(uint256[] indexed a, string b)',
  )

  expect(() =>
    AbiEvent.encode(transfer, {
      a: [1n],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[FilterTypeNotSupportedError: Filter type "uint256[]" is not supported.]`,
  )
})
