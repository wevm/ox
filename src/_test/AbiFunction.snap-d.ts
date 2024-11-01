import { attest } from '@ark/attest'
import { Abi, AbiFunction, AbiParameters } from 'ox'
import { describe, test } from 'vitest'
import { erc20Abi, wagmiContractConfig } from '../../test/constants/abis.js'
import { address } from '../../test/constants/addresses.js'

describe('decodeData', () => {
  test('default', () => {
    const abiItem = AbiFunction.fromAbi(erc20Abi, 'decimals')
    const data = AbiFunction.encodeData(abiItem)
    const input = AbiFunction.decodeData(abiItem, data)
    attest(input).type.toString.snap('undefined')
  })

  test('behavior: with data', () => {
    const abiItem = AbiFunction.fromAbi(erc20Abi, 'approve', {
      prepare: false,
    })
    const data = AbiFunction.encodeData(abiItem, [address.vitalik, 1n])
    const input = AbiFunction.decodeData(abiItem, data)
    attest(input).type.toString.snap('readonly [`0x${string}`, bigint]')
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
    const abiItem = AbiFunction.fromAbi(abi, 'balanceOf')
    attest(
      AbiFunction.decodeData(
        abiItem,
        '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
      ),
    ).type.toString.snap('readonly [bigint] | readonly [`0x${string}`]')
    attest(
      AbiFunction.decodeData(
        abiItem,
        '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
      ),
    ).type.toString.snap('readonly [bigint] | readonly [`0x${string}`]')
  })
})

describe('decodeResult', () => {
  test('default', () => {
    const abiItem = AbiFunction.from(
      'function test() returns (uint a, (uint x, string y) b)',
    )
    const args = [420n, { x: 420n, y: 'lol' }] as const
    const result = AbiFunction.decodeResult(
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
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
    )
    attest(result).type.toString.snap('bigint')
  })

  test('behavior: no output parameter', () => {
    const abiItem = AbiFunction.from('function test()')
    const result = AbiFunction.decodeResult(abiItem, '0x')
    attest(result).type.toString.snap('undefined')
  })

  test('behavior: widened', () => {
    const abiItem = AbiFunction.from('function test() returns (uint a)')
    const args = [420n] as const
    const result = AbiFunction.decodeResult(
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
    const result = AbiFunction.decodeResult(
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
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
      { as: 'Object' },
    )
    attest(result).type.toString.snap('bigint')
  })

  test('options: as = Object, behavior: no output parameter', () => {
    const abiItem = AbiFunction.from('function test()')
    const result = AbiFunction.decodeResult(abiItem, '0x', { as: 'Object' })
    attest(result).type.toString.snap('undefined')
  })

  test('behavior: abiItem union', () => {
    const abi = Abi.from(wagmiContractConfig.abi)
    const abiItem = AbiFunction.fromAbi(
      abi,
      'totalSupply' as AbiFunction.Name<typeof abi>,
    )
    if (abiItem.type === 'function') {
      const result = AbiFunction.decodeResult(
        abiItem,
        '0x000000000000000000000000000000000000000000000000000000000000000000000001',
      )
      attest(result).type.toString.snap('string | bigint | boolean | undefined')
    }
  })
})

describe('fromAbi', () => {
  test('default', () => {
    const item = AbiFunction.fromAbi(wagmiContractConfig.abi, 'balanceOf', {
      args: ['0x0000000000000000000000000000000000000000'],
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
    const item = AbiFunction.fromAbi(
      wagmiContractConfig.abi as readonly unknown[],
      'balanceOf',
      {
        args: ['0x0000000000000000000000000000000000000000'],
      },
    )
    attest(item).type.toString.snap('AbiFunction')
  })

  test('behavior: data', () => {
    const item = AbiFunction.fromAbi(wagmiContractConfig.abi, 'approve')
    const data = AbiFunction.encodeData(item, [
      '0x0000000000000000000000000000000000000000',
      1n,
    ])
    const item_2 = AbiFunction.fromAbi(wagmiContractConfig.abi, data)
    attest(item_2.name).type.toString.snap(`  | "symbol"
  | "name"
  | "approve"
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
    const item = AbiFunction.fromAbi(abi, 'foo')
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
    const item = AbiFunction.fromAbi(abi, 'foo')
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
    const abiItem = AbiFunction.fromAbi(
      abi,
      'totalSupply' as AbiFunction.Name<typeof abi>,
    )
    attest(abiItem.name).type.toString.snap(`  | "symbol"
  | "name"
  | "approve"
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
