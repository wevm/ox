import { test } from '@fast-check/vitest'
import { AbiCoder, Interface, ParamType } from 'ethers'
import { AbiFunction, AbiParameters } from 'ox'
import { describe, expect } from 'vp/test'

import { arbitraryAbiCase } from '../../../test/fuzz/arbitraries/abi.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const coder = AbiCoder.defaultAbiCoder()

describe('AbiParameters differential', () => {
  test.prop(
    {
      input: arbitraryAbiCase({
        maxArrayLength: 4,
        maxBytesLength: 128,
        maxDepth: 4,
        maxTupleArity: 4,
        minFixedArrayLength: 0,
      }),
    },
    { numRuns },
  )('encode matches ethers AbiCoder', ({ input }) => {
    expectParameters(input.parameters, input.values)
  })

  test('integer boundaries match ethers AbiCoder', () => {
    for (let bits = 8; bits <= 256; bits += 8) {
      const bits_ = BigInt(bits)
      const maxUnsigned = 2n ** bits_ - 1n
      const maxSigned = 2n ** (bits_ - 1n) - 1n
      const minSigned = -(2n ** (bits_ - 1n))

      for (const value of [0n, 1n, maxUnsigned])
        expectParameters([{ type: `uint${bits}` }], [value])
      for (const value of [minSigned, -1n, 0n, 1n, maxSigned])
        expectParameters([{ type: `int${bits}` }], [value])

      if (bits > 64) {
        expectParameters([{ type: `uint${bits}` }], [2n ** 64n - 1n])
        expectParameters([{ type: `uint${bits}` }], [2n ** 64n])
      }
    }
  })

  test('bytes and string boundaries match ethers AbiCoder', () => {
    for (let size = 1; size <= 32; size++)
      expectParameters([{ type: `bytes${size}` }], [`0x${'ab'.repeat(size)}`])

    for (const size of [0, 1, 31, 32, 33, 63, 64, 65, 128]) {
      expectParameters([{ type: 'bytes' }], [`0x${'ab'.repeat(size)}`])
      expectParameters([{ type: 'string' }], ['a'.repeat(size)])
    }

    for (const value of ['\u0000', 'é', '€', '😀', 'a😀b'])
      expectParameters([{ type: 'string' }], [value])
  })

  test('zero-width types match ethers AbiCoder', () => {
    expectParameters([{ type: 'uint256[0]' }, { type: 'uint256' }], [[], 3n])
    expectParameters([{ type: 'string[0]' }, { type: 'uint256' }], [[], 3n])
    expectParameters([{ type: 'tuple', components: [] }], [[]])
  })
})

describe('AbiFunction differential', () => {
  test.prop(
    {
      input: arbitraryAbiCase({
        maxArrayLength: 4,
        maxBytesLength: 128,
        maxDepth: 4,
        maxTupleArity: 4,
        minFixedArrayLength: 0,
      }),
    },
    { numRuns },
  )('encodeData matches ethers Interface', ({ input }) => {
    expectFunction(input.parameters, input.values)
  })

  test('nested named dynamic values match ethers Interface', () => {
    expectFunction(
      [
        {
          components: [
            { name: 'maker', type: 'address' },
            {
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'memo', type: 'string' },
                { name: 'payloads', type: 'bytes[]' },
              ],
              name: 'items',
              type: 'tuple[2]',
            },
          ],
          name: 'orders',
          type: 'tuple[]',
        },
        { name: 'suffix', type: 'string[2]' },
      ],
      [
        [
          {
            items: [
              {
                id: 2n ** 64n - 1n,
                memo: '',
                payloads: ['0x', `0x${'ab'.repeat(31)}`],
              },
              {
                id: 2n ** 64n,
                memo: '😀',
                payloads: [`0x${'ab'.repeat(32)}`, `0x${'ab'.repeat(33)}`],
              },
            ],
            maker: '0x0000000000000000000000000000000000000001',
          },
        ],
        ['', 'a'.repeat(33)],
      ],
    )
  })
})

function expectParameters(
  parameters: readonly AbiParameters.Parameter[],
  values: readonly unknown[],
) {
  const types = parameters.map((parameter) => ParamType.from(parameter))
  const expected = coder.encode(types, values)
  const encoded = AbiParameters.encode(parameters, values as never)
  expect(encoded).toEqual(expected)
}

function expectFunction(
  parameters: readonly AbiParameters.Parameter[],
  values: readonly unknown[],
) {
  const abiFunction: AbiFunction.AbiFunction = {
    inputs: parameters,
    name: 'test',
    outputs: [],
    stateMutability: 'pure',
    type: 'function',
  }
  const inputs = parameters
    .map((parameter) => ParamType.from(parameter).format('full'))
    .join(',')
  const expected = new Interface([
    `function ${abiFunction.name}(${inputs}) pure`,
  ]).encodeFunctionData(abiFunction.name, values)
  const encoded = AbiFunction.encodeData(abiFunction, values as never)
  expect(encoded).toEqual(expected)
}
