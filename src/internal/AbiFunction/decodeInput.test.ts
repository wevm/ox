import { Abi, AbiFunction } from 'ox'
import { expect, test } from 'vitest'
import { erc20Abi } from '../../../test/constants/abis.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const abiItem = AbiFunction.fromAbi(erc20Abi, {
    name: 'decimals',
  })
  const data = AbiFunction.encodeInput(abiItem)
  const input = AbiFunction.decodeInput(abiItem, data)
  expect(input).toEqual(undefined)
})

test('behavior: with data', () => {
  const abiItem = AbiFunction.fromAbi(erc20Abi, {
    name: 'approve',
    prepare: false,
  })
  const data = AbiFunction.encodeInput(abiItem, [address.vitalik, 1n])
  const input = AbiFunction.decodeInput(abiItem, data)
  expect(input).toEqual([address.vitalik, 1n])
})

test('behavior: with overloads', () => {
  const abi = Abi.from([
    {
      inputs: [{ type: 'bytes' }],
      name: 'balanceOf',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'x', type: 'uint256' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ])
  const abiItem = AbiFunction.fromAbi(abi, {
    name: 'balanceOf',
  })
  expect(
    AbiFunction.decodeInput(
      abiItem,
      '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
    ),
  ).toEqual([1n])
  expect(
    AbiFunction.decodeInput(
      abiItem,
      '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
    ),
  ).toEqual(['0xdeadbeef'])
})
