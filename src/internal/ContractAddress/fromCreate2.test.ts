import { ContractAddress, Hex } from 'ox'
import { expect, test } from 'vitest'

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
})
