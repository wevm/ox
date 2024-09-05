import { attest } from '@ark/attest'
import { Abi, AbiError, AbiItem } from 'ox'
import { test } from 'vitest'

import { seaportContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  const item = AbiError.fromAbi(seaportContractConfig.abi, {
    name: 'BadSignatureV',
  })
  attest(item).type.toString.snap(`{
  readonly inputs: readonly [
    { readonly name: "owner"; readonly type: "address" }
  ]
  readonly name: "balanceOf"
  readonly outputs: readonly [
    { readonly name: ""; readonly type: "uint256" }
  ]
  readonly stateMutability: "view"
  readonly type: "function"
}`)
})

test('behavior: unknown abi', () => {
  const item = AbiError.fromAbi(
    seaportContractConfig.abi as readonly unknown[],
    {
      name: 'BadSignatureV',
    },
  )
  attest(item).type.toString.snap('AbiError')
})

test('behavior: data', () => {
  const item = AbiError.fromAbi(seaportContractConfig.abi, {
    name: 'BadSignatureV',
  })
  const selector = AbiItem.getSelector(item)
  const item_2 = AbiError.fromAbi(seaportContractConfig.abi, {
    name: selector,
  })
  attest(item_2.name).type.toString.snap()
})

test('behavior: overloads', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  attest(item).type.toString.snap()
})

test('behavior: overloads with args', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
    args: [1n],
  })
  attest(item).type.toString.snap()
})

test('behavior: overloads: no inputs or args', () => {
  const abi = Abi.from([
    'error Bar()',
    'error Foo(bytes)',
    'error Foo(uint256)',
  ])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  attest(item).type.toString.snap()
})

test('behavior: widened name', () => {
  const abi = Abi.from(seaportContractConfig.abi)
  const abiItem = AbiError.fromAbi(abi, {
    name: 'BadContractSignature' as AbiError.Name<typeof abi>,
  })
  attest(abiItem.name).type.toString.snap()
})
