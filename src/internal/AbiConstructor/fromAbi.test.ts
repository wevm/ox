import { expect, test } from 'vitest'
import { AbiConstructor } from 'ox'
import { seaportContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  const constructor_ = AbiConstructor.fromAbi(seaportContractConfig.abi)
  expect(constructor_).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "conduitController",
          "type": "address",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
})

test('error: no constructor', () => {
  expect(() => AbiConstructor.fromAbi([])).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI item with name "constructor" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})
