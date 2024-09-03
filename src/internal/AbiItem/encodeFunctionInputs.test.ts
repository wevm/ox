import { Abi, AbiItem } from 'ox'
import { expect, test } from 'vitest'
import { erc20Abi } from '../../../test/constants/abis.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const abiItem = AbiItem.extract(erc20Abi, {
    name: 'decimals',
  })
  expect(AbiItem.encodeFunctionInputs(abiItem)).toEqual('0x313ce567')
})

test('behavior: abiItem not prepared', () => {
  const abiItem = AbiItem.extract(erc20Abi, {
    name: 'decimals',
    prepare: false,
  })
  expect(AbiItem.encodeFunctionInputs(abiItem)).toEqual('0x313ce567')
})

test('behavior: with data', () => {
  const abiItem = AbiItem.extract(erc20Abi, {
    name: 'approve',
    prepare: false,
  })
  expect(AbiItem.encodeFunctionInputs(abiItem, [address.vitalik, 1n])).toEqual(
    '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
  )
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
  const abiItem = AbiItem.extract(abi, {
    name: 'balanceOf',
  })
  expect(AbiItem.encodeFunctionInputs(abiItem, [1n])).toEqual(
    '0x784153650000000000000000000000000000000000000000000000000000000000000001',
  )
  expect(AbiItem.encodeFunctionInputs(abiItem, ['0xdeadbeef'])).toEqual(
    '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
  )
})
