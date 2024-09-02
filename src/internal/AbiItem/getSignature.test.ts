import { AbiItem } from 'ox'
import { describe, expect, test } from 'vitest'

import { normalizeSignature } from './getSignature.js'

test('creates function signature', () => {
  expect(AbiItem.getSignature('_compound(uint256,uint256,uint256)')).toEqual(
    '_compound(uint256,uint256,uint256)',
  )
  expect(
    AbiItem.getSignature('function _compound(uint256 a, uint256 b, uint256 c)'),
  ).toEqual('_compound(uint256,uint256,uint256)')
  expect(AbiItem.getSignature('function ownerOf(uint256 tokenId)')).toEqual(
    'ownerOf(uint256)',
  )
  expect(AbiItem.getSignature('ownerOf(uint256)')).toEqual('ownerOf(uint256)')
  expect(
    AbiItem.getSignature('processInvestment(address,uint256,bool)'),
  ).toEqual('processInvestment(address,uint256,bool)')
  expect(AbiItem.getSignature('processAccount(uint256 , address)')).toEqual(
    'processAccount(uint256,address)',
  )
  expect(AbiItem.getSignature('claimed()')).toEqual('claimed()')
  expect(AbiItem.getSignature('function claimed()')).toEqual('claimed()')
})

test('creates function signature from `AbiFunction`', () => {
  expect(
    AbiItem.getSignature({
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
  ).toEqual('_compound(uint256,uint256,uint256)')

  expect(
    AbiItem.getSignature({
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('ownerOf(uint256)')

  expect(
    AbiItem.getSignature({
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: '', type: 'uint256' }],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('ownerOf(uint256)')

  expect(
    AbiItem.getSignature({
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
  ).toEqual('processInvestment(address,uint256,bool)')

  expect(
    AbiItem.getSignature({
      name: 'processAccount',
      type: 'function',
      inputs: [
        { name: '', type: 'uint256' },
        { name: '', type: 'address' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    }),
  ).toEqual('processAccount(uint256,address)')

  expect(
    AbiItem.getSignature({
      name: 'claimed',
      type: 'function',
      inputs: [],
      outputs: [],
      stateMutability: 'view',
    }),
  ).toEqual('claimed()')

  expect(
    AbiItem.getSignature({
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
  ).toEqual('forceSimpleCells((uint64,address,uint8,uint8)[])')

  expect(
    AbiItem.getSignature({
      inputs: [
        { name: 'name', type: 'string' },
        { name: 'symbol', type: 'string' },
        { name: 'editionSize', type: 'uint64' },
        { name: 'royaltyBPS', type: 'uint16' },
        {
          name: 'fundsRecipient',
          type: 'address',
        },
        { name: 'defaultAdmin', type: 'address' },
        {
          components: [
            {
              name: 'publicSalePrice',
              type: 'uint104',
            },
            {
              name: 'maxSalePurchasePerAddress',
              type: 'uint32',
            },
            { name: 'publicSaleStart', type: 'uint64' },
            { name: 'publicSaleEnd', type: 'uint64' },
            { name: 'presaleStart', type: 'uint64' },
            { name: 'presaleEnd', type: 'uint64' },
            {
              name: 'presaleMerkleRoot',
              type: 'bytes32',
            },
          ],

          name: 'saleConfig',
          type: 'tuple',
        },
        { name: 'description', type: 'string' },
        { name: 'animationURI', type: 'string' },
        { name: 'imageURI', type: 'string' },
      ],
      name: 'createEdition',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'function',
    }),
  ).toEqual(
    'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
  )

  expect(
    AbiItem.getSignature({
      inputs: [
        {
          name: 't',
          type: 'address',
        },
        {
          name: 'ah',
          type: 'address',
        },
        {
          name: '_owner',
          type: 'address',
        },
        {
          components: [
            {
              name: 'maxBid',
              type: 'uint256',
            },
            {
              name: 'minBid',
              type: 'uint256',
            },
            {
              name: 'bidWindow',
              type: 'uint256',
            },
            {
              name: 'tip',
              type: 'uint256',
            },
            {
              name: 'receiver',
              type: 'address',
            },
          ],

          name: 'cfg',
          type: 'tuple',
        },
      ],
      name: 'clone',
      outputs: [
        {
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'payable',
      type: 'function',
    }),
  ).toEqual(
    'clone(address,address,address,(uint256,uint256,uint256,uint256,address))',
  )

  expect(
    AbiItem.getSignature({
      inputs: [
        { name: 'payer', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'tokenAmount', type: 'uint256' },
        { name: 'tokenAddress', type: 'address' },
        { name: 'startTime', type: 'uint256' },
        { name: 'stopTime', type: 'uint256' },
        { name: 'nonce', type: 'uint8' },
      ],
      name: 'createStream',
      outputs: [{ name: 'stream', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'function',
    }),
  ).toEqual(
    'createStream(address,address,uint256,address,uint256,uint256,uint8)',
  )
})

test('creates event signature', () => {
  expect(
    AbiItem.getSignature('Transfer(address,address,uint256)'),
  ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
  expect(
    AbiItem.getSignature(
      'Transfer(address indexed from, address indexed to, uint256 amount)',
    ),
  ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
  expect(
    AbiItem.getSignature(
      'event Transfer(address indexed from, address indexed to, uint256 amount)',
    ),
  ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
  expect(AbiItem.getSignature('drawNumber()')).toMatchInlineSnapshot(
    '"drawNumber()"',
  )
  expect(AbiItem.getSignature('drawNumber( )')).toMatchInlineSnapshot(
    '"drawNumber()"',
  )
  expect(
    AbiItem.getSignature(
      'ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)',
    ),
  ).toMatchInlineSnapshot(
    '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
  )
  expect(
    AbiItem.getSignature(
      'ProcessedAccountDividendTracker(uint256 indexed foo, uint256 indexed bar, uint256 baz, uint256 a, bool b, uint256 c, address d)',
    ),
  ).toMatchInlineSnapshot(
    '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
  )
  expect(
    AbiItem.getSignature('BlackListMultipleAddresses(address[], bool)'),
  ).toMatchInlineSnapshot('"BlackListMultipleAddresses(address[],bool)"')
  expect(AbiItem.getSignature('checkBatch(bytes)')).toMatchInlineSnapshot(
    '"checkBatch(bytes)"',
  )
  expect(
    AbiItem.getSignature(
      'Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    ),
  ).toMatchInlineSnapshot('"Approval(address,address,uint256)"')
  expect(
    AbiItem.getSignature(
      'ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
    ),
  ).toMatchInlineSnapshot('"ApprovalForAll(address,address,bool)"')
})

test('creates event signature for `AbiEvent`', () => {
  expect(
    AbiItem.getSignature({
      name: 'Transfer',
      type: 'event',
      inputs: [
        { name: 'address', type: 'address', indexed: true },
        { name: 'address', type: 'address', indexed: true },
        { name: 'uint256', type: 'uint256', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')

  expect(
    AbiItem.getSignature({
      name: 'Transfer',
      type: 'event',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')

  expect(
    AbiItem.getSignature({
      name: 'drawNumber',
      type: 'event',
      inputs: [],
    }),
  ).toMatchInlineSnapshot('"drawNumber()"')

  expect(
    AbiItem.getSignature({
      name: 'drawNumber',
      type: 'event',
      inputs: [],
    }),
  ).toMatchInlineSnapshot('"drawNumber()"')

  expect(
    AbiItem.getSignature({
      name: 'ProcessedAccountDividendTracker',
      type: 'event',
      inputs: [
        { name: 'uint256', type: 'uint256', indexed: false },
        { name: 'uint256', type: 'uint256', indexed: false },
        { name: 'uint256', type: 'uint256', indexed: false },
        { name: 'uint256', type: 'uint256', indexed: false },
        { name: 'bool', type: 'bool', indexed: false },
        { name: 'uint256', type: 'uint256', indexed: false },
        { name: 'address', type: 'address', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot(
    '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
  )

  expect(
    AbiItem.getSignature({
      name: 'ProcessedAccountDividendTracker',
      type: 'event',
      inputs: [
        { name: 'foo', type: 'uint256', indexed: true },
        { name: 'bar', type: 'uint256', indexed: true },
        { name: 'baz', type: 'uint256', indexed: false },
        { name: 'a', type: 'uint256', indexed: false },
        { name: 'b', type: 'bool', indexed: false },
        { name: 'c', type: 'uint256', indexed: false },
        { name: 'd', type: 'address', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot(
    '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
  )

  expect(
    AbiItem.getSignature({
      name: 'BlackListMultipleAddresses',
      type: 'event',
      inputs: [
        { name: 'addresses', type: 'address[]', indexed: false },
        { name: 'isBlackListed', type: 'bool', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot('"BlackListMultipleAddresses(address[],bool)"')

  expect(
    AbiItem.getSignature({
      name: 'checkBatch',
      type: 'event',
      inputs: [{ name: '', type: 'bytes', indexed: false }],
    }),
  ).toMatchInlineSnapshot('"checkBatch(bytes)"')

  expect(
    AbiItem.getSignature({
      name: 'Approval',
      type: 'event',
      inputs: [
        { name: 'owner', type: 'address', indexed: true },
        { name: 'approved', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
      ],
    }),
  ).toMatchInlineSnapshot('"Approval(address,address,uint256)"')

  expect(
    AbiItem.getSignature({
      name: 'ApprovalForAll',
      type: 'event',
      inputs: [
        { name: 'owner', type: 'address', indexed: true },
        { name: 'operator', type: 'address', indexed: true },
        { name: 'approved', type: 'bool', indexed: false },
      ],
    }),
  ).toMatchInlineSnapshot('"ApprovalForAll(address,address,bool)"')

  expect(
    AbiItem.getSignature({
      anonymous: false,
      inputs: [
        {
          indexed: false,

          name: 'smolRecipeId',
          type: 'uint256',
        },
        {
          components: [
            {
              components: [
                {
                  name: 'background',
                  type: 'uint24',
                },
                { name: 'body', type: 'uint24' },
                { name: 'clothes', type: 'uint24' },
                { name: 'mouth', type: 'uint24' },
                { name: 'glasses', type: 'uint24' },
                { name: 'hat', type: 'uint24' },
                { name: 'hair', type: 'uint24' },
                { name: 'skin', type: 'uint24' },
                { name: 'gender', type: 'uint8' },
                { name: 'headSize', type: 'uint8' },
              ],

              name: 'smol',
              type: 'tuple',
            },
            { name: 'exists', type: 'bool' },
            {
              name: 'smolInputAmount',
              type: 'uint8',
            },
          ],
          indexed: false,

          name: 'smolData',
          type: 'tuple',
        },
      ],
      name: 'SmolRecipeAdded',
      type: 'event',
    }),
  ).toMatchInlineSnapshot(
    '"SmolRecipeAdded(uint256,((uint24,uint24,uint24,uint24,uint24,uint24,uint24,uint24,uint8,uint8),bool,uint8))"',
  )
})

describe('normalizeSignature', () => {
  test('foo()', () => {
    expect(normalizeSignature('foo()')).toBe('foo()')
  })

  test('bar(uint foo)', () => {
    expect(normalizeSignature('bar(uint foo)')).toBe('bar(uint)')
  })

  test('processAccount(uint256 , address )', () => {
    expect(normalizeSignature('processAccount(uint256 , address )')).toBe(
      'processAccount(uint256,address)',
    )
  })

  test('function bar()', () => {
    expect(normalizeSignature('function bar()')).toBe('bar()')
  })

  test('function bar()', () => {
    expect(normalizeSignature('function  bar( )')).toBe('bar()')
  })

  test('event Bar()', () => {
    expect(normalizeSignature('event Bar()')).toBe('Bar()')
  })

  test('function bar(uint foo)', () => {
    expect(normalizeSignature('function bar(uint foo)')).toBe('bar(uint)')
  })

  test('function bar(uint foo, address baz)', () => {
    expect(normalizeSignature('function bar(uint foo, address baz)')).toBe(
      'bar(uint,address)',
    )
  })

  test('event Barry(uint foo)', () => {
    expect(normalizeSignature('event Barry(uint foo)')).toBe('Barry(uint)')
  })

  test('Barry(uint indexed foo)', () => {
    expect(normalizeSignature('Barry(uint indexed foo)')).toBe('Barry(uint)')
  })

  test('event Barry(uint indexed foo)', () => {
    expect(normalizeSignature('event Barry(uint indexed foo)')).toBe(
      'Barry(uint)',
    )
  })

  test('function _compound(uint256 a, uint256 b, uint256 c)', () => {
    expect(
      normalizeSignature('function _compound(uint256 a, uint256 b, uint256 c)'),
    ).toBe('_compound(uint256,uint256,uint256)')
  })

  test('bar(uint foo, (uint baz))', () => {
    expect(normalizeSignature('bar(uint foo, (uint baz))')).toBe(
      'bar(uint,(uint))',
    )
  })

  test('bar(uint foo, (uint baz, bool x))', () => {
    expect(normalizeSignature('bar(uint foo, (uint baz, bool x))')).toBe(
      'bar(uint,(uint,bool))',
    )
  })

  test('bar(uint foo, (uint baz, bool x) foo)', () => {
    expect(normalizeSignature('bar(uint foo, (uint baz, bool x) foo)')).toBe(
      'bar(uint,(uint,bool))',
    )
  })

  test('bar(uint[] foo, (uint baz, bool x))', () => {
    expect(normalizeSignature('bar(uint[] foo, (uint baz, bool x))')).toBe(
      'bar(uint[],(uint,bool))',
    )
  })

  test('bar(uint[] foo, (uint baz, bool x)[])', () => {
    expect(normalizeSignature('bar(uint[] foo, (uint baz, bool x)[])')).toBe(
      'bar(uint[],(uint,bool)[])',
    )
  })

  test('foo(uint bar)', () => {
    expect(normalizeSignature('foo(uint bar) payable returns (uint)')).toBe(
      'foo(uint)',
    )
  })

  test('function submitBlocksWithCallbacks(bool isDataCompressed, bytes calldata data, ((uint16,(uint16,uint16,uint16,bytes)[])[], address[])  calldata config)', () => {
    expect(
      normalizeSignature(
        'function submitBlocksWithCallbacks(bool isDataCompressed, bytes calldata data, ((uint16,(uint16,uint16,uint16,bytes)[])[], address[])  calldata config)',
      ),
    ).toBe(
      'submitBlocksWithCallbacks(bool,bytes,((uint16,(uint16,uint16,uint16,bytes)[])[],address[]))',
    )
  })

  test('function createEdition(string name, string symbol, uint64 editionSize, uint16 royaltyBPS, address fundsRecipient, address defaultAdmin, (uint104 publicSalePrice, uint32 maxSalePurchasePerAddress, uint64 publicSaleStart, uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig, string description, string animationURI, string imageURI) returns (address)', () => {
    expect(
      normalizeSignature(
        'function createEdition(string name, string symbol, uint64 editionSize, uint16 royaltyBPS, address fundsRecipient, address defaultAdmin, (uint104 publicSalePrice, uint32 maxSalePurchasePerAddress, uint64 publicSaleStart, uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig, string description, string animationURI, string imageURI) returns (address)',
      ),
    ).toBe(
      'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
    )
  })

  test('trim spaces', () => {
    expect(
      normalizeSignature(
        'function  createEdition(string  name,string symbol,   uint64 editionSize  , uint16   royaltyBPS,     address     fundsRecipient,   address    defaultAdmin, ( uint104   publicSalePrice  ,   uint32 maxSalePurchasePerAddress, uint64 publicSaleStart,   uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig , string description, string animationURI, string imageURI ) returns (address)',
      ),
    ).toBe(
      'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
    )
  })

  test('error: invalid signatures', () => {
    expect(() => normalizeSignature('bar')).toThrowErrorMatchingInlineSnapshot(
      '[BaseError: Unable to normalize signature.]',
    )

    expect(() =>
      normalizeSignature('bar(uint foo'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[BaseError: Unable to normalize signature.]',
    )

    expect(() =>
      normalizeSignature('baruint foo)'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[BaseError: Unable to normalize signature.]',
    )

    expect(() =>
      normalizeSignature('bar(uint foo, (uint baz)'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[BaseError: Unable to normalize signature.]',
    )
  })
})
