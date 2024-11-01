import { attest } from '@ark/attest'
import { AbiParameters } from 'ox'
import { describe, test } from 'vitest'

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
