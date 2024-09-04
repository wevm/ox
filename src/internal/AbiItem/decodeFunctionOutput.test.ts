import { AbiItem, AbiParameters } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const abiItem = AbiItem.from(
    'function test() returns (uint a, (uint x, string y) b)',
  )
  const args = [420n, { x: 420n, y: 'lol' }] as const
  const result = AbiItem.decodeFunctionOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
  )
  expect(result).toEqual(args)
})

test('behavior: single output parameter', () => {
  const abiItem = AbiItem.from('function test() returns (uint a)')
  const args = [420n] as const
  const result = AbiItem.decodeFunctionOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
  )
  expect(result).toEqual(args[0])
})

test('behavior: no output parameter', () => {
  const abiItem = AbiItem.from('function test()')
  const result = AbiItem.decodeFunctionOutput(abiItem, '0x')
  expect(result).toEqual(undefined)
})

test('options: as = Object', () => {
  const abiItem = AbiItem.from(
    'function test() returns (uint a, (uint x, string y) b)',
  )
  const args = [420n, { x: 420n, y: 'lol' }] as const
  const result = AbiItem.decodeFunctionOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
    { as: 'Object' },
  )
  expect(result).toMatchInlineSnapshot(`
    {
      "a": 420n,
      "b": {
        "x": 420n,
        "y": "lol",
      },
    }
  `)
})

test('options: as = Object, behavior: single output parameter', () => {
  const abiItem = AbiItem.from('function test() returns (uint a)')
  const args = [420n] as const
  const result = AbiItem.decodeFunctionOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
    { as: 'Object' },
  )
  expect(result).toMatchInlineSnapshot('420n')
})

test('options: as = Object, behavior: no output parameter', () => {
  const abiItem = AbiItem.from('function test()')
  const result = AbiItem.decodeFunctionOutput(abiItem, '0x', {
    as: 'Object',
  })
  expect(result).toMatchInlineSnapshot('undefined')
})
