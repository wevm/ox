import { attest } from '@ark/attest'
import { Abi, AbiFunction, AbiParameters } from 'ox'
import { test } from 'vitest'
import { wagmiContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  const abiItem = AbiFunction.from(
    'function test() returns (uint a, (uint x, string y) b)',
  )
  const args = [420n, { x: 420n, y: 'lol' }] as const
  const result = AbiFunction.decodeOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
  )
  attest(result).type.toString.snap(
    'readonly [bigint, { x: bigint; y: string }]',
  )
})

test('behavior: single output parameter', () => {
  const abiItem = AbiFunction.from('function test() returns (uint a)')
  const args = [420n] as const
  const result = AbiFunction.decodeOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
  )
  attest(result).type.toString.snap('bigint')
})

test('behavior: no output parameter', () => {
  const abiItem = AbiFunction.from('function test()')
  const result = AbiFunction.decodeOutput(abiItem, '0x')
  attest(result).type.toString.snap('undefined')
})

test('behavior: widened', () => {
  const abiItem = AbiFunction.from('function test() returns (uint a)')
  const args = [420n] as const
  const result = AbiFunction.decodeOutput(
    abiItem as AbiFunction.AbiFunction,
    AbiParameters.encode(abiItem.outputs, args),
  )
  attest(result).type.toString.snap('unknown')
})

test('options: as = Object', () => {
  const abiItem = AbiFunction.from(
    'function test() returns (uint a, (uint x, string y) b)',
  )
  const args = [420n, { x: 420n, y: 'lol' }] as const
  const result = AbiFunction.decodeOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
    { as: 'Object' },
  )
  attest(result).type.toString.snap(
    '{ a: bigint; b: { x: bigint; y: string } }',
  )
})

test('options: as = Object, behavior: single output parameter', () => {
  const abiItem = AbiFunction.from('function test() returns (uint a)')
  const args = [420n] as const
  const result = AbiFunction.decodeOutput(
    abiItem,
    AbiParameters.encode(abiItem.outputs, args),
    { as: 'Object' },
  )
  attest(result).type.toString.snap('bigint')
})

test('options: as = Object, behavior: no output parameter', () => {
  const abiItem = AbiFunction.from('function test()')
  const result = AbiFunction.decodeOutput(abiItem, '0x', { as: 'Object' })
  attest(result).type.toString.snap('undefined')
})

test('behavior: abiItem union', () => {
  const abi = Abi.from(wagmiContractConfig.abi)
  const abiItem = AbiFunction.fromAbi(abi, {
    name: 'totalSupply' as AbiFunction.Name<typeof abi>,
  })
  if (abiItem.type === 'function') {
    const result = AbiFunction.decodeOutput(
      abiItem,
      '0x000000000000000000000000000000000000000000000000000000000000000000000001',
    )
    attest(result).type.toString.snap('string | bigint | boolean | undefined')
  }
})
