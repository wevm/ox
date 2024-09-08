import { AbiConstructor } from 'ox'
import { expect, test } from 'vitest'

import { Constructor } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const constructor_ = AbiConstructor.from('constructor()')

  expect(
    AbiConstructor.encode(constructor_, {
      bytecode: '0xdeadbeef',
    }),
  ).toBe('0xdeadbeef')
})

test('behavior: args', () => {
  const constructor_ = AbiConstructor.from('constructor(address, uint256)')

  expect(
    AbiConstructor.encode(constructor_, {
      bytecode: '0xdeadbeef',
      args: [address.vitalik, 123n],
    }),
  ).toBe(
    '0xdeadbeef000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000007b',
  )
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

  const { contractAddress } = (await anvilMainnet.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  }))!

  expect(contractAddress).toBeDefined()
})
