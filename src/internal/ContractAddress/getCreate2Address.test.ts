import { expect, test } from 'vitest'

import { AbiParameters_encode } from '../AbiParameters/encode.js'
import { Bytes_from } from '../Bytes/from.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Hex_from } from '../Hex/from.js'
import { ContractAddress_getCreate2Address } from './getCreate2Address.js'

test('default', () => {
  expect(
    ContractAddress_getCreate2Address({
      from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
      bytecode: Bytes_from(
        '0x6394198df16000526103ff60206004601c335afa6040516060f3',
      ),
      salt: Hex_from('hello world'),
    }),
  ).toMatchInlineSnapshot('"0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB"')

  expect(
    ContractAddress_getCreate2Address({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash: Bytes_from(
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      ),
      salt: Hash_keccak256(
        AbiParameters_encode(
          ['address', 'address', 'uint24'],
          [
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            500,
          ],
        ),
      ),
    }),
  ).toMatchInlineSnapshot('"0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"')

  expect(
    ContractAddress_getCreate2Address({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash:
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      salt: Hash_keccak256(
        AbiParameters_encode(
          ['address', 'address', 'uint24'],
          [
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            500,
          ],
        ),
      ),
    }),
  ).toMatchInlineSnapshot('"0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"')
})
