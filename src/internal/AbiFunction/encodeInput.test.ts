import { Abi, AbiFunction } from 'ox'
import { expect, test } from 'vitest'
import { erc20Abi } from '../../../test/constants/abis.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const abiFunction = AbiFunction.fromAbi(erc20Abi, 'decimals')
  expect(AbiFunction.encodeInput(abiFunction)).toEqual('0x313ce567')
})

test('behavior: abiFunction not prepared', () => {
  const abiFunction = AbiFunction.fromAbi(erc20Abi, 'decimals', {
    prepare: false,
  })
  expect(AbiFunction.encodeInput(abiFunction)).toEqual('0x313ce567')
})

test('behavior: with data', () => {
  const abiFunction = AbiFunction.fromAbi(erc20Abi, 'approve', {
    prepare: false,
  })
  expect(AbiFunction.encodeInput(abiFunction, [address.vitalik, 1n])).toEqual(
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
  const abiFunction = AbiFunction.fromAbi(abi, 'balanceOf')
  expect(AbiFunction.encodeInput(abiFunction, [1n])).toEqual(
    '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
  )
  expect(AbiFunction.encodeInput(abiFunction, ['0xdeadbeef'])).toEqual(
    '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
  )
})
