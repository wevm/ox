import { AbiError } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const abiItem = AbiError.from({
      inputs: [{ name: 'v', type: 'uint8' }],
      name: 'BadSignatureV',
      type: 'error',
    })
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xaa52af9ba76161953067fddc6a99eee9de4ef3377363fd1f54a2648771ce7104",
        "inputs": [
          {
            "name": "v",
            "type": "uint8",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
  }

  {
    const abiItem = AbiError.from('error BadSignatureV(uint8 v)')
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xaa52af9ba76161953067fddc6a99eee9de4ef3377363fd1f54a2648771ce7104",
        "inputs": [
          {
            "name": "v",
            "type": "uint8",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
  }

  {
    const abiItem = AbiError.from([
      'struct Signature { uint8 v; }',
      'error BadSignatureV(Signature signature)',
    ])
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x20b3153f3727f1104adc249fb4f7c79cba94baf5cfb70c4178a3893946445f3f",
        "inputs": [
          {
            "components": [
              {
                "name": "v",
                "type": "uint8",
              },
            ],
            "name": "signature",
            "type": "tuple",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
  }
})

test('options: prepare', () => {
  const abiItem = AbiError.from(
    {
      inputs: [{ name: 'v', type: 'uint8' }],
      name: 'BadSignatureV',
      type: 'error',
    },
    { prepare: false },
  )
  expect(abiItem).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "v",
          "type": "uint8",
        },
      ],
      "name": "BadSignatureV",
      "type": "error",
    }
  `)
})
