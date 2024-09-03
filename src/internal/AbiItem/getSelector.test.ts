import { AbiItem } from 'ox'
import { expect, test } from 'vitest'

test('creates function signature', () => {
  expect(AbiItem.getSelector('_compound(uint256,uint256,uint256)')).toEqual(
    '0xf4fbb312',
  )
  expect(
    AbiItem.getSelector('function _compound(uint256 a, uint256 b, uint256 c)'),
  ).toEqual('0xf4fbb312')
  expect(AbiItem.getSelector('function ownerOf(uint256 tokenId)')).toEqual(
    '0x6352211e',
  )
  expect(AbiItem.getSelector('ownerOf(uint256)')).toEqual('0x6352211e')
  expect(
    AbiItem.getSelector('processInvestment(address,uint256,bool)'),
  ).toEqual('0xcf4b8f61')
  expect(AbiItem.getSelector('processAccount(uint256 , address )')).toEqual(
    '0x73933128',
  )
  expect(AbiItem.getSelector('claimed()')).toEqual('0xe834a834')
  expect(AbiItem.getSelector('function claimed()')).toEqual('0xe834a834')
})

test('creates function signature from `AbiFunction`', () => {
  expect(
    AbiItem.getSelector({
      name: '_compound',
      type: 'function',
      inputs: [
        { name: 'a', type: 'uint256' },
        { name: 'b', type: 'uint256' },
        { name: 'c', type: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    }),
  ).toEqual('0xf4fbb312')

  expect(
    AbiItem.getSelector({
      name: '_compound',
      type: 'function',
      inputs: [
        { name: '', type: 'uint256' },
        { name: '', type: 'uint256' },
        { name: '', type: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    }),
  ).toEqual('0xf4fbb312')

  expect(
    AbiItem.getSelector({
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('0x6352211e')

  expect(
    AbiItem.getSelector({
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: '', type: 'uint256' }],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('0x6352211e')

  expect(
    AbiItem.getSelector({
      name: 'processInvestment',
      type: 'function',
      inputs: [
        { name: '', type: 'address' },
        { name: '', type: 'uint256' },
        { name: '', type: 'bool' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    }),
  ).toEqual('0xcf4b8f61')

  expect(
    AbiItem.getSelector({
      name: 'processAccount',
      type: 'function',
      inputs: [
        { name: '', type: 'uint256' },
        { name: '', type: 'address' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    }),
  ).toEqual('0x73933128')

  expect(
    AbiItem.getSelector({
      name: 'claimed',
      type: 'function',
      inputs: [],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('0xe834a834')

  expect(
    AbiItem.getSelector({
      inputs: [
        {
          components: [
            {
              name: 'position',
              type: 'uint64',
            },
            {
              name: 'owner',
              type: 'address',
            },
            {
              name: 'color',
              type: 'uint8',
            },
            {
              name: 'life',
              type: 'uint8',
            },
          ],
          name: 'cells',
          type: 'tuple[]',
        },
      ],
      name: 'forceSimpleCells',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    }),
  ).toEqual('0xd703f50a')
})
