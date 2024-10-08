import { expect, test } from 'vitest'
import { AbiParameters, ContractAddress, Hash, Hex } from 'ox'

test('default', () => {
  expect(
    ContractAddress.fromCreate2({
      from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
      bytecode: Hex.from(
        '0x6394198df16000526103ff60206004601c335afa6040516060f3',
      ),
      salt: Hex.fromString('hello world'),
    }),
  ).toMatchInlineSnapshot(`"0x59fbb593abe27cb193b6ee5c5dc7bbde312290ab"`)

  expect(
    ContractAddress.fromCreate2({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash: Hex.from(
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      ),
      salt: Hash.keccak256(
        AbiParameters.encode(
          AbiParameters.from(['address', 'address', 'uint24']),
          [
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            500,
          ],
        ),
      ),
    }),
  ).toMatchInlineSnapshot(`"0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"`)

  expect(
    ContractAddress.fromCreate2({
      from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      bytecodeHash:
        '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      salt: Hash.keccak256(
        AbiParameters.encode(
          AbiParameters.from(['address', 'address', 'uint24']),
          [
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            500,
          ],
        ),
      ),
    }),
  ).toMatchInlineSnapshot(`"0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"`)
})
