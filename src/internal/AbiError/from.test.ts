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
        "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
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
        "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
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
        "hash": "0xfced1c858d7f2bfb0878dcc1cb75305474698643ad13e7d8e5e1b96283a8c7c2",
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
