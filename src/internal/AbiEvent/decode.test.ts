import { AbiEvent } from 'ox'
import { expect, test } from 'vitest'

test('behavior: named', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  expect(decoded).toMatchInlineSnapshot(`
    {
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
})

test('behavior: unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed, address indexed, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  expect(decoded).toMatchInlineSnapshot(`
    [
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      1n,
    ]
  `)
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  expect(decoded).toMatchInlineSnapshot(`
    {
      "2": 1n,
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "to": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }
  `)
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed, uint256 value)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  expect(decoded).toMatchInlineSnapshot(`
    {
      "1": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
})

test('behavior: named + unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed, uint256 value, uint256)',
  )
  const decoded = AbiEvent.decode(transfer, {
    data: '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0x9ed053bb818ff08b8353cd46f78db1f0799f31c9e4458fdb425c10eccd2efc44',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
    ],
  })
  expect(decoded).toMatchInlineSnapshot(`
    {
      "1": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "3": 1n,
      "from": "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac",
      "value": 1n,
    }
  `)
})

test('behavior: string inputs', () => {
  const transfer = AbiEvent.from('event Transfer(string indexed a)')

  const decoded = AbiEvent.decode(transfer, {
    topics: [
      '0x7cebee4ee226a36ff8751d9d69bb8265f5138c825f8c25d7ebdd60d972ffe5be',
      '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
    ],
  })

  expect(decoded).toMatchInlineSnapshot(`
    {
      "a": "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
    }
  `)
})

test('error: topics mismatch, named', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address to, uint256 indexed value)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AbiEvent.TopicsMismatchError: Expected a topic for indexed event parameter "value" for "event Transfer(address indexed from, address to, uint256 indexed value)".]`,
  )
})

test('error: topics mismatch, unnamed', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed, address, uint256 indexed)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[AbiEvent.TopicsMismatchError: Expected a topic for indexed event parameter for "event Transfer(address indexed, address, uint256 indexed)".]`,
  )
})

test('error: data mismatch', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address to, uint256 value)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      data: '0x0000000000000000000000000000000000000000000000000000000023c34600',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        '0x00000000000000000000000070e8a65d014918798ba424110d5df658cde1cc58',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiEvent.DataMismatchError: Data size of 32 bytes is too small for non-indexed event parameters.

    Non-indexed Parameters: (address to, uint256 value)
    Data:   0x0000000000000000000000000000000000000000000000000000000023c34600 (32 bytes)]
  `,
  )
})

test('error: data mismatch', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address to, uint256 value)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        '0x00000000000000000000000070e8a65d014918798ba424110d5df658cde1cc58',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiEvent.DataMismatchError: Data size of 0 bytes is too small for non-indexed event parameters.

    Non-indexed Parameters: (address to, uint256 value)
    Data:   0x (0 bytes)]
  `,
  )
})

test('error: invalid data size', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      data: '0x01',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiEvent.DataMismatchError: Data size of 1 bytes is too small for non-indexed event parameters.

    Non-indexed Parameters: (uint256 value)
    Data:   0x01 (1 bytes)]
  `,
  )
})

test('error: invalid boolean', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, bool sender)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      data: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      topics: [
        '0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Bytes.InvalidBytesBooleanError: Bytes value \`221,242,82,173,27,226,200,155,105,194,176,104,252,55,141,170,149,43,167,241,99,196,161,22,40,245,90,77,245,35,179,239\` is not a valid boolean.

    The bytes array must contain a single byte of either a \`0\` or \`1\` value.

    See: https://oxlib.sh/errors#bytesinvalidbytesbooleanerror]
  `,
  )
})

test('error: event selector topic mismatch', () => {
  const transfer = AbiEvent.from(
    'event Transfer(address indexed from, address indexed to, bool sender)',
  )

  expect(() =>
    AbiEvent.decode(transfer, {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiEvent.SelectorTopicMismatchError: topics[0]="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" does not match the expected topics[0]="0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f".

    Event: event Transfer(address indexed from, address indexed to, bool sender)
    Selector: 0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f]
  `,
  )
})
