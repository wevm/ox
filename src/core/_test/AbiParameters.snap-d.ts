import { attest } from '@ark/attest'
import { AbiParameters } from 'ox'
import { describe, test } from 'vp/test'

describe('decode', () => {
  test('default', () => {
    {
      const result = AbiParameters.decode([], '0x')
      attest(result).type.toString.snap('[]')
    }

    {
      const parameters = AbiParameters.from('bool a, (uint32 x, string y) b')
      const data = AbiParameters.encode(parameters, [
        true,
        { x: 123, y: 'lol' },
      ])
      const result = AbiParameters.decode(parameters, data)
      attest(result).type.toString.snap(
        'readonly [boolean, { y: string; x: number }]',
      )
    }
  })

  test('options: as = Object', () => {
    {
      const result = AbiParameters.decode([], '0x', { as: 'Object' })
      attest(result).type.toString.snap('{}')
    }

    {
      const parameters = AbiParameters.from('bool a, (uint32 x, string y) b')
      const data = AbiParameters.encode(parameters, [
        true,
        { x: 123, y: 'lol' },
      ])
      const result = AbiParameters.decode(parameters, data, {
        as: 'Object',
      })
      attest(result).type.toString.snap(
        '{ a: boolean; b: { y: string; x: number } }',
      )
    }
  })

  test('behavior: widened', () => {
    {
      const result = AbiParameters.decode(
        [] as AbiParameters.AbiParameters,
        '0x',
      )
      attest(result).type.toString.snap('readonly unknown[]')
    }

    {
      const result = AbiParameters.decode(
        [] as AbiParameters.AbiParameters,
        '0x',
        {
          as: 'Object',
        },
      )
      attest(result).type.toString.snap('unknown')
    }
  })
})

describe('encode', () => {
  test('behavior: type instantiations', () => {
    const parameters = [
      { name: 'a', type: 'uint256' },
      {
        components: [
          { name: 'x', type: 'address' },
          { name: 'y', type: 'string' },
        ],
        name: 'b',
        type: 'tuple',
      },
    ] as const
    AbiParameters.encode(parameters, [
      420n,
      { x: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', y: 'lol' },
    ])
    attest.instantiations([2103, 'instantiations'])
  })
})

describe('encodePacked', () => {
  test('behavior: type instantiations', () => {
    AbiParameters.encodePacked(
      ['address', 'string', 'uint256'],
      ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'hello world', 420n],
    )
    attest.instantiations([883, 'instantiations'])
  })
})
