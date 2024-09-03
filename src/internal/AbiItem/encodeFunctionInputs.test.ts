import { expect, test } from 'vitest'
import { AbiItem } from 'ox'
import { address } from '../../../test/constants/addresses.js'
import { erc20Abi } from '../../../test/constants/abis.js'

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
