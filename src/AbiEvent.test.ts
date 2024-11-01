import { Abi, AbiEvent, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

import { anvilMainnet } from '../test/anvil.js'
import { wagmiContractConfig } from '../test/constants/abis.js'
import { address } from '../test/constants/addresses.js'

describe('assertArgs', () => {
  test('default', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    })
    AbiEvent.assertArgs(abiEvent, args, {
      from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      value: 1n,
    })
  })

  test('default', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed, address indexed, uint256)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    })
    AbiEvent.assertArgs(abiEvent, args, [
      '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      1n,
    ])
  })

  test('error: args mismatch, named', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ad',
      ],
    })

    expect(() =>
      AbiEvent.assertArgs(abiEvent, args, {
        from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
        to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        value: 1n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiEvent.ArgsMismatchError: Given arguments do not match the expected arguments.

    Event: event Transfer(address indexed from, address indexed to, uint256 value)
    Expected Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad
      value:  1
    Given Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      value:  1]
  `)
  })

  test('error: args mismatch, unnamed', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed, address indexed, uint256)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    })
    expect(() =>
      AbiEvent.assertArgs(abiEvent, args, [
        '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
      ]),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiEvent.ArgsMismatchError: Given arguments do not match the expected arguments.

    Event: event Transfer(address indexed, address indexed, uint256)
    Expected Arguments: 
      0:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      1:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      2:  1
    Given Arguments: 
      0:  0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad]
  `)
  })

  test('error: args mismatch, string', () => {
    const abiEvent = AbiEvent.from('event Transfer(string indexed a)')
    const args = AbiEvent.decode(abiEvent, {
      topics: [
        '0x7cebee4ee226a36ff8751d9d69bb8265f5138c825f8c25d7ebdd60d972ffe5be',
        '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
      ],
    })
    expect(() =>
      AbiEvent.assertArgs(abiEvent, args, {
        a: '0xdeadbeef',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiEvent.ArgsMismatchError: Given arguments do not match the expected arguments.

    Event: event Transfer(string indexed a)
    Expected Arguments: 
      a:  0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
    Given Arguments: 
      a:  0xdeadbeef]
  `)
  })

  test('error: input not found, named', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    })
    expect(() =>
      AbiEvent.assertArgs(abiEvent, args, {
        // @ts-expect-error
        a: 'b',
        from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
        to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        value: 1n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiEvent.InputNotFoundError: Parameter "a" not found on \`event Transfer(address indexed from, address indexed to, uint256 value)\`.]`,
    )
  })

  test('error: input not found, unnamed', () => {
    const abiEvent = AbiEvent.from(
      'event Transfer(address indexed, address indexed, uint256)',
    )
    const args = AbiEvent.decode(abiEvent, {
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
      ],
    })
    expect(() =>
      // @ts-expect-error
      AbiEvent.assertArgs(abiEvent, args, [
        '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        1n,
        1n,
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiEvent.InputNotFoundError: Parameter "3" not found on \`event Transfer(address indexed, address indexed, uint256)\`.]`,
    )
  })

  test('error: provided args, but no actual event args', () => {
    const abiEvent = AbiEvent.from('event Transfer()')
    const args = AbiEvent.decode(abiEvent, {
      topics: [
        '0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0',
      ],
    })
    expect(() =>
      // @ts-ignore
      AbiEvent.assertArgs(abiEvent, args, {
        from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678az',
        to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
        value: 1n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiEvent.ArgsMismatchError: Given arguments do not match the expected arguments.

    Event: event Transfer()
    Expected Arguments: None
    Given Arguments: 
      from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678az
      to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
      value:  1]
  `)
  })
})

describe('decode', () => {
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

    The bytes array must contain a single byte of either a \`0\` or \`1\` value.]
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
})

describe('encode', () => {
  test('default', () => {
    const transfer = AbiEvent.from('event Transfer()')
    expect(AbiEvent.encode(transfer)).toMatchInlineSnapshot(`
    {
      "topics": [
        "0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0",
      ],
    }
  `)
  })

  test('behavior: no hash', () => {
    const transfer = AbiEvent.from('event Transfer()')
    expect(
      AbiEvent.encode({ ...transfer, hash: undefined }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0",
      ],
    }
  `)
  })

  test('behavior: multiple inputs, no args', () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed a, address indexed b, uint256 c)',
    )
    expect(AbiEvent.encode(transfer)).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
    }
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
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        b: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: '0x0000000000000000000000000000000000000000',
        b: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: null,
        b: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: ['0x0000000000000000000000000000000000000000', address.vitalik],
        b: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        ],
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)
  })

  test('behavior: multiple inputs, with args, unnamed', () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed, address indexed, uint256 )',
    )

    expect(
      AbiEvent.encode(transfer, ['0x0000000000000000000000000000000000000000']),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, [
        null,
        '0x0000000000000000000000000000000000000000',
      ]),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
      ]),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, [
        ['0x0000000000000000000000000000000000000000', address.vitalik],
        '0x0000000000000000000000000000000000000000',
      ]),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        ],
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
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
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        1: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: '0x0000000000000000000000000000000000000000',
        1: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: null,
        1: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)

    expect(
      AbiEvent.encode(transfer, {
        a: ['0x0000000000000000000000000000000000000000', address.vitalik],
        1: '0x0000000000000000000000000000000000000000',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        ],
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    }
  `)
  })

  test('behavior: string inputs', () => {
    const transfer = AbiEvent.from('event Transfer(string indexed a, string b)')

    expect(
      AbiEvent.encode(transfer, {
        a: 'hello',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0x89525573e05dbc5f7f7f72e98f8145459e8b183e54c819fa7029f09a04115d89",
        "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
      ],
    }
  `)
  })

  test('behavior: leading non-indexed inputs', () => {
    const transfer = AbiEvent.from(
      'event Transfer(uint256 a, string indexed b)',
    )

    expect(
      AbiEvent.encode(transfer, {
        b: 'hello',
      }),
    ).toMatchInlineSnapshot(`
    {
      "topics": [
        "0x9060fea662832699cca863409e283b48eb088414dc780c4d43afe69caefee4b5",
        "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
      ],
    }
  `)
  })

  test('behavior: network', async () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 indexed value)',
    )

    const { topics } = AbiEvent.encode(transfer)

    const logs = await anvilMainnet.request({
      method: 'eth_getLogs',
      params: [
        {
          address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
          fromBlock: Hex.fromNumber(19760235n),
          toBlock: Hex.fromNumber(19760240n),
          topics,
        },
      ],
    })

    expect(AbiEvent.decode(transfer, logs[0]!)).toMatchInlineSnapshot(`
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x0c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
      "value": 603n,
    }
  `)
  })

  test('error: tuple input', () => {
    const transfer = AbiEvent.from(
      'event Transfer((string) indexed a, string b)',
    )

    expect(() =>
      AbiEvent.encode(transfer, {
        a: ['hello'],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiEvent.FilterTypeNotSupportedError: Filter type "tuple" is not supported.]`,
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
      `[AbiEvent.FilterTypeNotSupportedError: Filter type "uint256[]" is not supported.]`,
    )
  })

  test('behavior: network', async () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )

    const { topics } = AbiEvent.encode(transfer)

    const logs = await anvilMainnet.request({
      method: 'eth_getLogs',
      params: [{ topics }],
    })

    expect(AbiEvent.decode(transfer, logs[0]!)).toMatchInlineSnapshot(`
    {
      "from": "0x634cf119d1964b88a426e1e782bd09f37b51d949",
      "to": "0xb77c2290c5e5acd8ca4778876b3caae593741bab",
      "value": 714357880932609n,
    }
  `)
  })
})

describe('format', () => {
  test('default', () => {
    const transfer = AbiEvent.from({
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256' },
      ],
    })
    const formatted = AbiEvent.format(transfer)
    expect(formatted).toMatchInlineSnapshot(
      `"event Transfer(address indexed from, address indexed to, uint256 value)"`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abiItem = AbiEvent.from({
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256' },
        ],
      })
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address",
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address",
          },
          {
            "name": "value",
            "type": "uint256",
          },
        ],
        "name": "Transfer",
        "type": "event",
      }
    `)
    }

    {
      const abiItem = AbiEvent.from(
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      )
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address",
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address",
          },
          {
            "name": "value",
            "type": "uint256",
          },
        ],
        "name": "Transfer",
        "type": "event",
      }
    `)
    }
  })

  test('options: prepare', () => {
    const abiItem = AbiEvent.from(
      {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256' },
        ],
      },
      { prepare: false },
    )
    expect(abiItem).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "indexed": true,
          "name": "from",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "to",
          "type": "address",
        },
        {
          "name": "value",
          "type": "uint256",
        },
      ],
      "name": "Transfer",
      "type": "event",
    }
  `)
  })
})

describe('fromAbi', () => {
  test('default', () => {
    expect(
      AbiEvent.fromAbi(wagmiContractConfig.abi, 'Approval'),
    ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "hash": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
  })

  test('behavior: prepare = false', () => {
    expect(
      AbiEvent.fromAbi(wagmiContractConfig.abi, 'Approval', {
        prepare: false,
      }),
    ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
  })

  test('behavior: name (hash)', () => {
    const item = AbiEvent.fromAbi(wagmiContractConfig.abi, 'Approval')
    expect(
      AbiEvent.fromAbi(wagmiContractConfig.abi, AbiEvent.getSelector(item)),
    ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "hash": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
  })

  test('error: no matching name', () => {
    expect(() =>
      // @ts-expect-error
      AbiEvent.fromAbi(wagmiContractConfig.abi, 'approve'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI event with name "approve" not found.]`,
    )
  })

  test('error: no matching name', () => {
    expect(() =>
      AbiEvent.fromAbi([] as readonly unknown[], 'Approved'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "Approved" not found.]`,
    )
  })

  test('error: no matching data', () => {
    expect(() =>
      AbiEvent.fromAbi([], '0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "0xdeadbeef" not found.]`,
    )
  })

  test('behavior: overloads', () => {
    const abi = Abi.from([
      'event Bar()',
      'event Foo(address indexed)',
      'event Foo(uint256 indexed)',
    ])
    const item = AbiEvent.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xe773a60b784586770a963a70fa6ba2bdf31c462939b6ba36852ed45f5f722358",
      "inputs": [
        {
          "indexed": true,
          "type": "address",
        },
      ],
      "name": "Foo",
      "overloads": [
        {
          "inputs": [
            {
              "indexed": true,
              "type": "uint256",
            },
          ],
          "name": "Foo",
          "type": "event",
        },
      ],
      "type": "event",
    }
  `)
  })

  test('behavior: overloads: no inputs', () => {
    const abi = Abi.from(['event Bar()', 'event Foo()', 'event Foo(uint256)'])
    const item = AbiEvent.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "event",
    }
  `)
  })

  test('overloads: no args', () => {
    const abi = Abi.from(['event Bar()', 'event Foo(uint256)', 'event Foo()'])
    const item = AbiEvent.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "event",
    }
  `)
  })

  test('behavior: overloads: different types', () => {
    const abi = Abi.from([
      'event Mint()',
      'event Mint(uint256)',
      'event Mint(string)',
    ])
    const item = AbiEvent.fromAbi(abi, 'Mint')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x34c73884fbbb790762253ae313e57da96c00670344647f0cb8d41ee92b9f1971",
      "inputs": [],
      "name": "Mint",
      "type": "event",
    }
  `)

    const item_2 = AbiEvent.fromAbi(abi, 'Mint', {
      args: [420n],
    })
    expect(item_2).toMatchInlineSnapshot(`
    {
      "hash": "0x07883703ed0e86588a40d76551c92f8a4b329e3bf19765e0e6749473c1a84665",
      "inputs": [
        {
          "type": "uint256",
        },
      ],
      "name": "Mint",
      "type": "event",
    }
  `)

    const item_3 = AbiEvent.fromAbi(abi, 'Mint', {
      args: ['foo'],
    })
    expect(item_3).toMatchInlineSnapshot(`
    {
      "hash": "0xc5e1d731c47dbd6a8c38e6ee9137792904eae9d20174034d1dc9a5781a0f855b",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Mint",
      "type": "event",
    }
  `)
  })

  test('behavior: overloads: ambiguious types', () => {
    expect(() =>
      AbiEvent.fromAbi(
        Abi.from(['event Foo(address)', 'event Foo(bytes20)']),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`Foo(bytes20)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiEvent.fromAbi(
        Abi.from([
          'event Foo(string)',
          'event Foo(uint)',
          'event Foo(address)',
        ]),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`Foo(address)\`, and
    \`string\` in \`Foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(
      AbiEvent.fromAbi(
        Abi.from([
          'event Foo(string)',
          'event Foo(uint)',
          'event Foo(address)',
        ]),
        'Foo',
        {
          // 21 bytes (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251eee'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "event",
    }
  `)

    expect(
      AbiEvent.fromAbi(
        Abi.from([
          'event Foo(string)',
          'event Foo(uint)',
          'event Foo(address)',
        ]),
        'Foo',
        {
          // non-hex (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251z'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "event",
    }
  `)

    expect(() =>
      AbiEvent.fromAbi(
        Abi.from([
          'event Foo(address)',
          'event Foo(uint)',
          'event Foo(string)',
        ]),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`Foo(string)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)
  })
})

describe('getSelector', () => {
  test('default', () => {
    expect(
      AbiEvent.getSelector(
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
    expect(
      AbiEvent.getSelector(
        'Transfer(address indexed from, address indexed to, uint256 value)',
      ),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
  })

  test('behavior: from `AbiEvent`', () => {
    expect(
      AbiEvent.getSelector(
        AbiEvent.from(
          'event Transfer(address indexed from, address indexed to, uint256 value)',
        ),
      ),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
  })
})

test('exports', () => {
  expect(Object.keys(AbiEvent)).toMatchInlineSnapshot(`
    [
      "ArgsMismatchError",
      "DataMismatchError",
      "FilterTypeNotSupportedError",
      "InputNotFoundError",
      "SelectorTopicMismatchError",
      "TopicsMismatchError",
      "assertArgs",
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
