import { AbiConstructor } from 'ox'
import { expect, test } from 'vitest'

import { Constructor } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

test('default', () => {
  const constructor_ = AbiConstructor.from('constructor()')

  expect(
    AbiConstructor.encode(constructor_, {
      bytecode: Constructor.bytecode.object,
    }),
  ).toBe('0x')
})

test('behavior: args', () => {
  const constructor_ = AbiConstructor.from('constructor(address, uint256)')

  expect(
    AbiConstructor.encode(constructor_, {
      bytecode: Constructor.bytecode.object,
      args: [address.vitalik, 123n],
    }),
  ).toBe(
    '0x6080604052348015600f57600080fd5b5060405160b438038060b4833981016040819052602a916030565b50506068565b60008060408385031215604257600080fd5b82516001600160a01b0381168114605857600080fd5b6020939093015192949293505050565b603f8060756000396000f3fe6080604052600080fdfea2646970667358221220af4dcef0f96876be4bd542ad464caecb56e81aec19a668b8e04197812417fcec64736f6c634300081a0033000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000007b',
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
