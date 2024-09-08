import { AbiConstructor } from 'ox'
import { expect, test } from 'vitest'

import { Constructor } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const constructor_ = AbiConstructor.from('constructor()')
  const encoded = AbiConstructor.encode(constructor_, {
    bytecode: Constructor.bytecode.object,
  })

  expect(
    AbiConstructor.decode(constructor_, {
      bytecode: Constructor.bytecode.object,
      data: encoded,
    }),
  ).toBe(undefined)
})

test('behavior: args', () => {
  const constructor_ = AbiConstructor.from('constructor(address, uint256)')
  const encoded = AbiConstructor.encode(constructor_, {
    bytecode: Constructor.bytecode.object,
    args: [address.vitalik, 123n],
  })

  expect(
    AbiConstructor.decode(constructor_, {
      bytecode: Constructor.bytecode.object,
      data: encoded,
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      123n,
    ]
  `)
})

test('behavior: network', async () => {
  const constructor_ = AbiConstructor.fromAbi(Constructor.abi)

  const data = AbiConstructor.encode(constructor_, {
    bytecode: Constructor.bytecode.object,
    args: [address.vitalik, 123n],
  })

  const hash = await anvilMainnet.request({
    method: 'eth_sendTransaction',
    params: [
      {
        data,
      },
    ],
  })

  const { input } = (await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  }))!

  expect(
    AbiConstructor.decode(constructor_, {
      bytecode: Constructor.bytecode.object,
      data: input,
    }),
  ).toMatchInlineSnapshot(`
    [
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      123n,
    ]
  `)
})
