import { AbiEvent } from 'ox'
import { expect, test } from 'vitest'

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
