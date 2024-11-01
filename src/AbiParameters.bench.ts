import { AbiCoder } from 'ethers'
import { AbiItem } from 'ox'
import { bench, describe } from 'vitest'
import { Web3 } from 'web3'

import { seaportContractConfig } from '../test/constants/abis.js'
import { address } from '../test/constants/addresses.js'
import { decode, encode } from './AbiParameters.js'

const fulfillAdvancedOrder = AbiItem.fromAbi(
  seaportContractConfig.abi,
  'fulfillAdvancedOrder',
)

describe('ABI Decode (static struct)', () => {
  bench('ox: `Abi.decodeParameters`', () => {
    decode(
      fulfillAdvancedOrder.inputs,
      '0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000006a0511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004500000000000000000000000000000000000000000000000000000000000005a000000000000000000000000000000000000000000000000000000000000005e0000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000360000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000001caab5c3b30000000000000000000000000000000000000000000000000000001caab5c3b3511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a00000000000000000000000000000000000000000000000000000000498f3973511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a0000000000000000000000000000000000000000000000000000000000010f2c0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000005414d89a8bf7e99d732bc52f3e6a3ef461c0c07800000000000000000000000000000000000000000000000000000000000002030000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000034fb5b7000000000000000000000000000000000000000000000000000000000000006f000000000000000000000000000000000000000000000000000000000001e0f30000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000037000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000008d000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000000312312300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003123123000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000004cf000000000000000000000000000000000000000000000000000000000000109200000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
    )
  })

  bench('ethers: `AbiCoder.decode`', () => {
    const coder = new AbiCoder()
    coder.decode(
      fulfillAdvancedOrder.inputs as any,
      '0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000006a0511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004500000000000000000000000000000000000000000000000000000000000005a000000000000000000000000000000000000000000000000000000000000005e0000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000360000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000001caab5c3b30000000000000000000000000000000000000000000000000000001caab5c3b3511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a00000000000000000000000000000000000000000000000000000000498f3973511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a0000000000000000000000000000000000000000000000000000000000010f2c0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000005414d89a8bf7e99d732bc52f3e6a3ef461c0c07800000000000000000000000000000000000000000000000000000000000002030000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000034fb5b7000000000000000000000000000000000000000000000000000000000000006f000000000000000000000000000000000000000000000000000000000001e0f30000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000037000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000008d000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000000312312300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003123123000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000004cf000000000000000000000000000000000000000000000000000000000000109200000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
    )
  })
})

const web3 = new Web3()

describe('ABI Encode', () => {
  bench('ox: `encodeAbi`', () => {
    encode(
      [
        {
          components: [
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'foo',
              type: 'tuple',
            },
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'baz',
              type: 'tuple',
            },
            {
              name: 'x',
              type: 'uint8[2]',
            },
          ],
          name: 'barOut',
          type: 'tuple',
        },
      ],
      [
        {
          foo: {
            x: 420n,
            y: true,
            z: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
          },
          baz: {
            x: 69n,
            y: false,
            z: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b',
          },
          x: [1, 2],
        },
      ],
    )
  })

  bench('ethers: `AbiCoder.encode`', () => {
    const coder = new AbiCoder()
    coder.encode(
      [
        {
          components: [
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'foo',
              type: 'tuple',
            },
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'baz',
              type: 'tuple',
            },
            {
              name: 'x',
              type: 'uint8[2]',
            },
          ],
          name: 'barOut',
          type: 'tuple',
        },
      ] as any,
      [
        {
          foo: {
            x: 420n,
            y: true,
            z: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
          },
          baz: {
            x: 69n,
            y: false,
            z: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b',
          },
          x: [1, 2],
        },
      ],
    )
  })

  bench('web3: `encodeParameters`', () => {
    web3.eth.abi.encodeParameters(
      [
        {
          components: [
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'foo',
              type: 'tuple',
            },
            {
              components: [
                {
                  name: 'x',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  type: 'bool',
                },
                {
                  name: 'z',
                  type: 'address',
                },
              ],
              name: 'baz',
              type: 'tuple',
            },
            {
              name: 'x',
              type: 'uint8[2]',
            },
          ],
          name: 'barOut',
          type: 'tuple',
        },
      ],
      [
        {
          foo: {
            x: 420n,
            y: true,
            z: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
          },
          baz: {
            x: 69n,
            y: false,
            z: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b',
          },
          x: [1, 2],
        },
      ],
    )
  })
})

describe('Seaport function', () => {
  bench('ox: `encodeAbi`', () => {
    encode(
      [
        {
          components: [
            { name: 'offerer', type: 'address' },
            { name: 'zone', type: 'address' },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
              ],

              name: 'offer',
              type: 'tuple[]',
            },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
                {
                  name: 'recipient',
                  type: 'address',
                },
              ],

              name: 'consideration',
              type: 'tuple[]',
            },
            {
              name: 'orderType',
              type: 'uint8',
            },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'zoneHash', type: 'bytes32' },
            { name: 'salt', type: 'uint256' },
            { name: 'conduitKey', type: 'bytes32' },
            { name: 'counter', type: 'uint256' },
          ],

          name: 'orders',
          type: 'tuple[]',
        },
      ],
      [
        [
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
        ],
      ],
    )
  })

  bench('ethers: `AbiCoder.encode`', () => {
    const coder = new AbiCoder()
    coder.encode(
      [
        {
          components: [
            { name: 'offerer', type: 'address' },
            { name: 'zone', type: 'address' },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
              ],

              name: 'offer',
              type: 'tuple[]',
            },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
                {
                  name: 'recipient',
                  type: 'address',
                },
              ],

              name: 'consideration',
              type: 'tuple[]',
            },
            {
              name: 'orderType',
              type: 'uint8',
            },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'zoneHash', type: 'bytes32' },
            { name: 'salt', type: 'uint256' },
            { name: 'conduitKey', type: 'bytes32' },
            { name: 'counter', type: 'uint256' },
          ],

          name: 'orders',
          type: 'tuple[]',
        },
      ] as any,
      [
        [
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
        ],
      ],
    )
  })

  bench('web3: `encodeParameters`', () => {
    web3.eth.abi.encodeParameters(
      [
        {
          components: [
            { name: 'offerer', type: 'address' },
            { name: 'zone', type: 'address' },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
              ],

              name: 'offer',
              type: 'tuple[]',
            },
            {
              components: [
                {
                  name: 'itemType',
                  type: 'uint8',
                },
                { name: 'token', type: 'address' },
                {
                  name: 'identifierOrCriteria',
                  type: 'uint256',
                },
                {
                  name: 'startAmount',
                  type: 'uint256',
                },
                { name: 'endAmount', type: 'uint256' },
                {
                  name: 'recipient',
                  type: 'address',
                },
              ],

              name: 'consideration',
              type: 'tuple[]',
            },
            {
              name: 'orderType',
              type: 'uint8',
            },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'zoneHash', type: 'bytes32' },
            { name: 'salt', type: 'uint256' },
            { name: 'conduitKey', type: 'bytes32' },
            { name: 'counter', type: 'uint256' },
          ],

          name: 'orders',
          type: 'tuple[]',
        },
      ],
      [
        [
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
          {
            conduitKey:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
            consideration: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                recipient: address.vitalik,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 141n,
                identifierOrCriteria: 55n,
                itemType: 16,
                recipient: address.vitalik,
                startAmount: 15n,
                token: address.burn,
              },
            ],
            counter: 1234123123n,
            endTime: 123123123123n,
            offer: [
              {
                endAmount: 420n,
                identifierOrCriteria: 69n,
                itemType: 10,
                startAmount: 6n,
                token: address.burn,
              },
              {
                endAmount: 11n,
                identifierOrCriteria: 515n,
                itemType: 10,
                startAmount: 6n,
                token: address.usdcHolder,
              },
              {
                endAmount: 123123n,
                identifierOrCriteria: 55555511n,
                itemType: 10,
                startAmount: 111n,
                token: address.vitalik,
              },
            ],
            offerer: address.vitalik,
            orderType: 10,
            salt: 1234123123n,
            startTime: 123123123123n,
            zone: address.vitalik,
            zoneHash:
              '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
          },
        ],
      ],
    )
  })
})
