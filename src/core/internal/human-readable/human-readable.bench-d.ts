import { attest } from '@ark/attest'
import { Abi, AbiItem, AbiParameter, AbiParameters } from 'ox'
import { describe, test } from 'vp/test'
import type { seaportHumanReadableAbi } from '../../../../test/abis/human-readable.js'

describe('human-readable ABI type instantiations', () => {
  test('Abi.from.ReturnType: erc20-sized ABI', () => {
    type Result = Abi.from.ReturnType<
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function transferFrom(address from, address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'event Transfer(address indexed from, address indexed to, uint256 amount)',
        'event Approval(address indexed owner, address indexed spender, uint256 amount)',
      ]
    >
    attest.instantiations([45_000, 'instantiations'])
    attest<Result>({} as Result)
  })

  test('Abi.from.ReturnType: seaport human-readable ABI', () => {
    type Result = Abi.from.ReturnType<typeof seaportHumanReadableAbi>
    attest.instantiations([5_000_000, 'instantiations'])
    attest<Result>({} as Result)
  })

  test('AbiItem.from.ReturnType: struct item', () => {
    type Result = AbiItem.from.ReturnType<
      [
        'struct Foo { address spender; uint256 amount; }',
        'function approve(Foo foo) returns (bool)',
      ]
    >
    attest.instantiations([15_000, 'instantiations'])
    attest<Result>({} as Result)
  })

  test('AbiParameters.from.ReturnType: nested tuple parameters', () => {
    type Result =
      AbiParameters.from.ReturnType<'(uint8 a, uint8[] b, (uint8 x, uint8 y)[] c) s, (uint x, uint y) t, uint256 a'>
    attest.instantiations([20_000, 'instantiations'])
    attest<Result>({} as Result)
  })

  test('AbiParameter.from.ReturnType: struct parameter', () => {
    type Result = AbiParameter.from.ReturnType<
      ['struct Foo { address spender; uint256 amount; }', 'Foo foo']
    >
    attest.instantiations([10_000, 'instantiations'])
    attest<Result>({} as Result)
  })
})
