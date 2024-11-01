import { attest } from '@ark/attest'
import { Abi, AbiFunction, AbiItem } from 'ox'
import { describe, test } from 'vitest'

import { wagmiContractConfig } from '../../test/constants/abis.js'

describe('fromAbi', () => {
  test('default', () => {
    const item = AbiItem.fromAbi(wagmiContractConfig.abi, 'balanceOf')
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
    const item = AbiItem.fromAbi(
      wagmiContractConfig.abi as readonly unknown[],
      'balanceOf',
      {
        args: ['0x0000000000000000000000000000000000000000'],
      },
    )
    attest(item).type.toString.snap(`  | AbiConstructor
    | AbiError
    | AbiEvent
    | AbiFallback
    | AbiFunction
    | AbiReceive`)
  })

  test('behavior: data', () => {
    const data = AbiFunction.encodeData(
      AbiFunction.fromAbi(wagmiContractConfig.abi, 'approve'),
      ['0x0000000000000000000000000000000000000000', 1n],
    )
    const item_2 = AbiItem.fromAbi(wagmiContractConfig.abi, data)
    attest(item_2.name).type.toString.snap(`  | "symbol"
    | "Transfer"
    | "name"
    | "approve"
    | "Approval"
    | "ApprovalForAll"
    | "balanceOf"
    | "totalSupply"
    | "transferFrom"
    | "getApproved"
    | "isApprovedForAll"
    | "ownerOf"
    | "safeTransferFrom"
    | "setApprovalForAll"
    | "supportsInterface"
    | "tokenURI"
    | "mint"`)
  })

  test('behavior: overloads', () => {
    const abi = Abi.from([
      'function bar()',
      'function foo()',
      'function foo(uint256)',
    ])
    const item = AbiItem.fromAbi(abi, 'foo')
    attest(item).type.toString.snap(`{
    readonly name: "foo"
    readonly type: "function"
    readonly stateMutability: "nonpayable"
    readonly inputs: readonly []
    readonly outputs: readonly []
  }`)
  })

  test('behavior: overloads: no inputs or args', () => {
    const abi = Abi.from([
      'function bar()',
      'function foo(bytes)',
      'function foo(uint256)',
    ])
    const item = AbiItem.fromAbi(abi, 'foo')
    attest(item).type.toString.snap(`{
    readonly name: "foo"
    readonly type: "function"
    readonly stateMutability: "nonpayable"
    readonly inputs: readonly [{ readonly type: "bytes" }]
    readonly outputs: readonly []
    readonly overloads: [
      {
        readonly name: "foo"
        readonly type: "function"
        readonly stateMutability: "nonpayable"
        readonly inputs: readonly [
          { readonly type: "uint256" }
        ]
        readonly outputs: readonly []
      }
    ]
  }`)
  })

  test('behavior: widened name', () => {
    const abi = Abi.from(wagmiContractConfig.abi)
    const abiItem = AbiItem.fromAbi(
      abi,
      'totalSupply' as AbiItem.Name<typeof abi>,
    )
    attest(abiItem.name).type.toString.snap(`  | "symbol"
    | "Transfer"
    | "name"
    | "approve"
    | "Approval"
    | "ApprovalForAll"
    | "balanceOf"
    | "totalSupply"
    | "transferFrom"
    | "getApproved"
    | "isApprovedForAll"
    | "ownerOf"
    | "safeTransferFrom"
    | "setApprovalForAll"
    | "supportsInterface"
    | "tokenURI"
    | "mint"`)
  })
})
