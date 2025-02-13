import type {
  Abi,
  AbiConstructor,
  AbiError,
  AbiEvent,
  AbiFallback,
  AbiFunction,
  AbiReceive,
} from 'abitype'
import { AbiItem } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('AbiItem.format', () => {
  const result = AbiItem.format({
    name: 'foo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  })
  expectTypeOf(result).toEqualTypeOf<'function foo()'>()
  expectTypeOf(
    AbiItem.format({
      name: 'foo',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        {
          type: 'tuple',
          components: [
            {
              type: 'string',
            },
          ],
        },
        {
          type: 'address',
        },
      ],
      outputs: [],
    }),
  ).toEqualTypeOf<'function foo((string), address)'>()

  const abiItem: Abi[number] = {
    type: 'function',
    name: 'foo',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  }
  expectTypeOf(AbiItem.format(abiItem)).toEqualTypeOf<string>()

  expectTypeOf(
    AbiItem.format({
      type: 'fallback',
      stateMutability: 'nonpayable',
    }),
  ).toEqualTypeOf<'fallback() external'>()
  expectTypeOf(
    AbiItem.format({
      type: 'fallback',
      stateMutability: 'payable',
    }),
  ).toEqualTypeOf<'fallback() external payable'>()
})

test('AbiItem.format.ReturnType', () => {
  expectTypeOf<AbiItem.format.ReturnType<Abi[number]>>().toEqualTypeOf<string>()
  expectTypeOf<AbiItem.format.ReturnType<AbiFunction>>().toEqualTypeOf<string>()
  expectTypeOf<AbiItem.format.ReturnType<AbiEvent>>().toEqualTypeOf<string>()
  expectTypeOf<AbiItem.format.ReturnType<AbiError>>().toEqualTypeOf<string>()
  expectTypeOf<
    AbiItem.format.ReturnType<AbiConstructor>
  >().toEqualTypeOf<string>()
  expectTypeOf<AbiItem.format.ReturnType<AbiFallback>>().toEqualTypeOf<string>()
  expectTypeOf<AbiItem.format.ReturnType<AbiReceive>>().toEqualTypeOf<string>()

  type Result = AbiItem.format.ReturnType<{
    readonly name: 'foo'
    readonly type: 'function'
    readonly stateMutability: 'nonpayable'
    readonly inputs: readonly []
    readonly outputs: readonly []
  }>
  expectTypeOf<Result>().toEqualTypeOf<'function foo()'>()

  expectTypeOf<
    AbiItem.format.ReturnType<{
      readonly name: 'address'
      readonly type: 'function'
      readonly stateMutability: 'nonpayable'
      readonly inputs: readonly []
      readonly outputs: readonly []
    }>
  >().toEqualTypeOf<'function [Error: "address" is a protected Solidity keyword.]()'>()

  expectTypeOf<
    AbiItem.format.ReturnType<{
      readonly name: 'Transfer'
      readonly type: 'event'
      readonly inputs: readonly [
        {
          readonly name: 'from'
          readonly type: 'address'
          readonly indexed: true
        },
        {
          readonly name: 'to'
          readonly type: 'address'
          readonly indexed: true
        },
        {
          readonly name: 'amount'
          readonly type: 'uint256'
        },
      ]
    }>
  >().toEqualTypeOf<'event Transfer(address indexed from, address indexed to, uint256 amount)'>()
})
