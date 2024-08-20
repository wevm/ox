import { parseAbiParameters } from 'abitype'
import { expect, test } from 'vitest'

import { encodeAbiParameters } from '../abi/encodeParameters.js'
import { toBytes } from '../bytes/toBytes.js'
import { keccak256 } from '../hash/keccak256.js'
import { toHex } from '../hex/toHex.js'
import { getCreate2Address } from './getCreate2Address.js'

test('default', () => {
  expect(
    getCreate2Address({
      from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
      bytecode: toBytes(
        '0x6394198df16000526103ff60206004601c335afa6040516060f3',
      ),
      salt: toHex('hello world'),
    }),
  ).toMatchInlineSnapshot('"0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB"')

  expect(
    getCreate2Address({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash: toBytes(
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      ),
      salt: keccak256(
        encodeAbiParameters(parseAbiParameters('address, address, uint24'), [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          500,
        ]),
      ),
    }),
  ).toMatchInlineSnapshot('"0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"')

  expect(
    getCreate2Address({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash:
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      salt: keccak256(
        encodeAbiParameters(parseAbiParameters('address, address, uint24'), [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          500,
        ]),
      ),
    }),
  ).toMatchInlineSnapshot('"0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"')
})
