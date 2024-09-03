export const erc20Abi = [
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,

        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,

        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
] as const

/**
 * Seaport
 * https://etherscan.io/address/0x00000000000001ad428e4906ae43d8f9852d0dd6
 */
export const seaportAbi = [
  {
    inputs: [{ name: 'conduitController', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        components: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
            ],

            name: 'offer',
            type: 'tuple[]',
          },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],

            name: 'consideration',
            type: 'tuple[]',
          },
          { name: 'orderType', type: 'uint8' },
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
    name: 'cancel',
    outputs: [{ name: 'cancelled', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'numerator', type: 'uint120' },
          { name: 'denominator', type: 'uint120' },
          { name: 'signature', type: 'bytes' },
          { name: 'extraData', type: 'bytes' },
        ],
        internalType: 'structAdvancedOrder',
        name: 'advancedOrder',
        type: 'tuple',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { internalType: 'enumSide', name: 'side', type: 'uint8' },
          { name: 'index', type: 'uint256' },
          { name: 'identifier', type: 'uint256' },
          {
            name: 'criteriaProof',
            type: 'bytes32[]',
          },
        ],
        internalType: 'structCriteriaResolver[]',
        name: 'criteriaResolvers',
        type: 'tuple[]',
      },
      { name: 'fulfillerConduitKey', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
    ],
    name: 'fulfillAdvancedOrder',
    outputs: [{ name: 'fulfilled', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'numerator', type: 'uint120' },
          { name: 'denominator', type: 'uint120' },
          { name: 'signature', type: 'bytes' },
          { name: 'extraData', type: 'bytes' },
        ],
        internalType: 'structAdvancedOrder[]',
        name: 'advancedOrders',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { internalType: 'enumSide', name: 'side', type: 'uint8' },
          { name: 'index', type: 'uint256' },
          { name: 'identifier', type: 'uint256' },
          {
            name: 'criteriaProof',
            type: 'bytes32[]',
          },
        ],
        internalType: 'structCriteriaResolver[]',
        name: 'criteriaResolvers',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { name: 'itemIndex', type: 'uint256' },
        ],
        internalType: 'structFulfillmentComponent[][]',
        name: 'offerFulfillments',
        type: 'tuple[][]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { name: 'itemIndex', type: 'uint256' },
        ],
        internalType: 'structFulfillmentComponent[][]',
        name: 'considerationFulfillments',
        type: 'tuple[][]',
      },
      { name: 'fulfillerConduitKey', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'maximumFulfilled', type: 'uint256' },
    ],
    name: 'fulfillAvailableAdvancedOrders',
    outputs: [
      { name: 'availableOrders', type: 'bool[]' },
      {
        components: [
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifier', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structReceivedItem',
            name: 'item',
            type: 'tuple',
          },
          { name: 'offerer', type: 'address' },
          { name: 'conduitKey', type: 'bytes32' },
        ],
        internalType: 'structExecution[]',
        name: 'executions',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structOrder[]',
        name: 'orders',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { name: 'itemIndex', type: 'uint256' },
        ],
        internalType: 'structFulfillmentComponent[][]',
        name: 'offerFulfillments',
        type: 'tuple[][]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { name: 'itemIndex', type: 'uint256' },
        ],
        internalType: 'structFulfillmentComponent[][]',
        name: 'considerationFulfillments',
        type: 'tuple[][]',
      },
      { name: 'fulfillerConduitKey', type: 'bytes32' },
      { name: 'maximumFulfilled', type: 'uint256' },
    ],
    name: 'fulfillAvailableOrders',
    outputs: [
      { name: 'availableOrders', type: 'bool[]' },
      {
        components: [
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifier', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structReceivedItem',
            name: 'item',
            type: 'tuple',
          },
          { name: 'offerer', type: 'address' },
          { name: 'conduitKey', type: 'bytes32' },
        ],
        internalType: 'structExecution[]',
        name: 'executions',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            name: 'considerationToken',
            type: 'address',
          },
          {
            name: 'considerationIdentifier',
            type: 'uint256',
          },
          {
            name: 'considerationAmount',
            type: 'uint256',
          },
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          { name: 'offerToken', type: 'address' },
          { name: 'offerIdentifier', type: 'uint256' },
          { name: 'offerAmount', type: 'uint256' },
          {
            internalType: 'enumBasicOrderType',
            name: 'basicOrderType',
            type: 'uint8',
          },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          {
            name: 'offererConduitKey',
            type: 'bytes32',
          },
          {
            name: 'fulfillerConduitKey',
            type: 'bytes32',
          },
          {
            name: 'totalOriginalAdditionalRecipients',
            type: 'uint256',
          },
          {
            components: [
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structAdditionalRecipient[]',
            name: 'additionalRecipients',
            type: 'tuple[]',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structBasicOrderParameters',
        name: 'parameters',
        type: 'tuple',
      },
    ],
    name: 'fulfillBasicOrder',
    outputs: [{ name: 'fulfilled', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            name: 'considerationToken',
            type: 'address',
          },
          {
            name: 'considerationIdentifier',
            type: 'uint256',
          },
          {
            name: 'considerationAmount',
            type: 'uint256',
          },
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          { name: 'offerToken', type: 'address' },
          { name: 'offerIdentifier', type: 'uint256' },
          { name: 'offerAmount', type: 'uint256' },
          {
            internalType: 'enumBasicOrderType',
            name: 'basicOrderType',
            type: 'uint8',
          },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          {
            name: 'offererConduitKey',
            type: 'bytes32',
          },
          {
            name: 'fulfillerConduitKey',
            type: 'bytes32',
          },
          {
            name: 'totalOriginalAdditionalRecipients',
            type: 'uint256',
          },
          {
            components: [
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structAdditionalRecipient[]',
            name: 'additionalRecipients',
            type: 'tuple[]',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structBasicOrderParameters',
        name: 'parameters',
        type: 'tuple',
      },
    ],
    name: 'fulfillBasicOrder_efficient_6GL6yc',
    outputs: [{ name: 'fulfilled', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structOrder',
        name: 'order',
        type: 'tuple',
      },
      { name: 'fulfillerConduitKey', type: 'bytes32' },
    ],
    name: 'fulfillOrder',
    outputs: [{ name: 'fulfilled', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'contractOfferer', type: 'address' }],
    name: 'getContractOffererNonce',
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'offerer', type: 'address' }],
    name: 'getCounter',
    outputs: [{ name: 'counter', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
            ],

            name: 'offer',
            type: 'tuple[]',
          },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],

            name: 'consideration',
            type: 'tuple[]',
          },
          { name: 'orderType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          { name: 'conduitKey', type: 'bytes32' },
          { name: 'counter', type: 'uint256' },
        ],
        internalType: 'structOrderComponents',
        name: 'order',
        type: 'tuple',
      },
    ],
    name: 'getOrderHash',
    outputs: [{ name: 'orderHash', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'getOrderStatus',
    outputs: [
      { name: 'isValidated', type: 'bool' },
      { name: 'isCancelled', type: 'bool' },
      { name: 'totalFilled', type: 'uint256' },
      { name: 'totalSize', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'incrementCounter',
    outputs: [{ name: 'newCounter', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'information',
    outputs: [
      { name: 'version', type: 'string' },
      { name: 'domainSeparator', type: 'bytes32' },
      { name: 'conduitController', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'numerator', type: 'uint120' },
          { name: 'denominator', type: 'uint120' },
          { name: 'signature', type: 'bytes' },
          { name: 'extraData', type: 'bytes' },
        ],
        internalType: 'structAdvancedOrder[]',
        name: 'orders',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'orderIndex', type: 'uint256' },
          { internalType: 'enumSide', name: 'side', type: 'uint8' },
          { name: 'index', type: 'uint256' },
          { name: 'identifier', type: 'uint256' },
          {
            name: 'criteriaProof',
            type: 'bytes32[]',
          },
        ],
        internalType: 'structCriteriaResolver[]',
        name: 'criteriaResolvers',
        type: 'tuple[]',
      },
      {
        components: [
          {
            components: [
              { name: 'orderIndex', type: 'uint256' },
              { name: 'itemIndex', type: 'uint256' },
            ],
            internalType: 'structFulfillmentComponent[]',
            name: 'offerComponents',
            type: 'tuple[]',
          },
          {
            components: [
              { name: 'orderIndex', type: 'uint256' },
              { name: 'itemIndex', type: 'uint256' },
            ],
            internalType: 'structFulfillmentComponent[]',
            name: 'considerationComponents',
            type: 'tuple[]',
          },
        ],
        internalType: 'structFulfillment[]',
        name: 'fulfillments',
        type: 'tuple[]',
      },
      { name: 'recipient', type: 'address' },
    ],
    name: 'matchAdvancedOrders',
    outputs: [
      {
        components: [
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifier', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structReceivedItem',
            name: 'item',
            type: 'tuple',
          },
          { name: 'offerer', type: 'address' },
          { name: 'conduitKey', type: 'bytes32' },
        ],
        internalType: 'structExecution[]',
        name: 'executions',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structOrder[]',
        name: 'orders',
        type: 'tuple[]',
      },
      {
        components: [
          {
            components: [
              { name: 'orderIndex', type: 'uint256' },
              { name: 'itemIndex', type: 'uint256' },
            ],
            internalType: 'structFulfillmentComponent[]',
            name: 'offerComponents',
            type: 'tuple[]',
          },
          {
            components: [
              { name: 'orderIndex', type: 'uint256' },
              { name: 'itemIndex', type: 'uint256' },
            ],
            internalType: 'structFulfillmentComponent[]',
            name: 'considerationComponents',
            type: 'tuple[]',
          },
        ],
        internalType: 'structFulfillment[]',
        name: 'fulfillments',
        type: 'tuple[]',
      },
    ],
    name: 'matchOrders',
    outputs: [
      {
        components: [
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifier', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],
            internalType: 'structReceivedItem',
            name: 'item',
            type: 'tuple',
          },
          { name: 'offerer', type: 'address' },
          { name: 'conduitKey', type: 'bytes32' },
        ],
        internalType: 'structExecution[]',
        name: 'executions',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: 'contractName', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'offerer', type: 'address' },
              { name: 'zone', type: 'address' },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],

                name: 'offer',
                type: 'tuple[]',
              },
              {
                components: [
                  {
                    internalType: 'enumItemType',
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
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
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
              {
                name: 'totalOriginalConsiderationItems',
                type: 'uint256',
              },
            ],
            internalType: 'structOrderParameters',
            name: 'parameters',
            type: 'tuple',
          },
          { name: 'signature', type: 'bytes' },
        ],
        internalType: 'structOrder[]',
        name: 'orders',
        type: 'tuple[]',
      },
    ],
    name: 'validate',
    outputs: [{ name: 'validated', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [], name: 'BadContractSignature', type: 'error' },
  { inputs: [], name: 'BadFraction', type: 'error' },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'BadReturnValueFromERC20OnTransfer',
    type: 'error',
  },
  {
    inputs: [{ name: 'v', type: 'uint8' }],
    name: 'BadSignatureV',
    type: 'error',
  },
  { inputs: [], name: 'CannotCancelOrder', type: 'error' },
  {
    inputs: [],
    name: 'ConsiderationCriteriaResolverOutOfRange',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ConsiderationLengthNotEqualToTotalOriginal',
    type: 'error',
  },
  {
    inputs: [
      { name: 'orderIndex', type: 'uint256' },
      { name: 'considerationIndex', type: 'uint256' },
      { name: 'shortfallAmount', type: 'uint256' },
    ],
    name: 'ConsiderationNotMet',
    type: 'error',
  },
  { inputs: [], name: 'CriteriaNotEnabledForItem', type: 'error' },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'identifiers', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    name: 'ERC1155BatchTransferGenericFailure',
    type: 'error',
  },
  { inputs: [], name: 'InexactFraction', type: 'error' },
  { inputs: [], name: 'InsufficientNativeTokensSupplied', type: 'error' },
  { inputs: [], name: 'Invalid1155BatchTransferEncoding', type: 'error' },
  { inputs: [], name: 'InvalidBasicOrderParameterEncoding', type: 'error' },
  {
    inputs: [{ name: 'conduit', type: 'address' }],
    name: 'InvalidCallToConduit',
    type: 'error',
  },
  {
    inputs: [
      { name: 'conduitKey', type: 'bytes32' },
      { name: 'conduit', type: 'address' },
    ],
    name: 'InvalidConduit',
    type: 'error',
  },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'InvalidContractOrder',
    type: 'error',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'InvalidERC721TransferAmount',
    type: 'error',
  },
  { inputs: [], name: 'InvalidFulfillmentComponentData', type: 'error' },
  {
    inputs: [{ name: 'value', type: 'uint256' }],
    name: 'InvalidMsgValue',
    type: 'error',
  },
  { inputs: [], name: 'InvalidNativeOfferItem', type: 'error' },
  { inputs: [], name: 'InvalidProof', type: 'error' },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'InvalidRestrictedOrder',
    type: 'error',
  },
  { inputs: [], name: 'InvalidSignature', type: 'error' },
  { inputs: [], name: 'InvalidSigner', type: 'error' },
  {
    inputs: [
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
    ],
    name: 'InvalidTime',
    type: 'error',
  },
  {
    inputs: [{ name: 'fulfillmentIndex', type: 'uint256' }],
    name: 'MismatchedFulfillmentOfferAndConsiderationComponents',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'enumSide', name: 'side', type: 'uint8' }],
    name: 'MissingFulfillmentComponentOnAggregation',
    type: 'error',
  },
  { inputs: [], name: 'MissingItemAmount', type: 'error' },
  { inputs: [], name: 'MissingOriginalConsiderationItems', type: 'error' },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'NativeTokenTransferGenericFailure',
    type: 'error',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'NoContract',
    type: 'error',
  },
  { inputs: [], name: 'NoReentrantCalls', type: 'error' },
  { inputs: [], name: 'NoSpecifiedOrdersAvailable', type: 'error' },
  {
    inputs: [],
    name: 'OfferAndConsiderationRequiredOnFulfillment',
    type: 'error',
  },
  { inputs: [], name: 'OfferCriteriaResolverOutOfRange', type: 'error' },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'OrderAlreadyFilled',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'enumSide', name: 'side', type: 'uint8' }],
    name: 'OrderCriteriaResolverOutOfRange',
    type: 'error',
  },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'OrderIsCancelled',
    type: 'error',
  },
  {
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    name: 'OrderPartiallyFilled',
    type: 'error',
  },
  { inputs: [], name: 'PartialFillsNotEnabledForOrder', type: 'error' },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'identifier', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'TokenTransferGenericFailure',
    type: 'error',
  },
  {
    inputs: [
      { name: 'orderIndex', type: 'uint256' },
      { name: 'considerationIndex', type: 'uint256' },
    ],
    name: 'UnresolvedConsiderationCriteria',
    type: 'error',
  },
  {
    inputs: [
      { name: 'orderIndex', type: 'uint256' },
      { name: 'offerIndex', type: 'uint256' },
    ],
    name: 'UnresolvedOfferCriteria',
    type: 'error',
  },
  { inputs: [], name: 'UnusedItemParameters', type: 'error' },
  {
    inputs: [
      {
        indexed: false,

        name: 'newCounter',
        type: 'uint256',
      },
      {
        indexed: true,

        name: 'offerer',
        type: 'address',
      },
    ],
    name: 'CounterIncremented',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: false,

        name: 'orderHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'offerer',
        type: 'address',
      },
      { indexed: true, name: 'zone', type: 'address' },
    ],
    name: 'OrderCancelled',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: false,

        name: 'orderHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'offerer',
        type: 'address',
      },
      { indexed: true, name: 'zone', type: 'address' },
      {
        indexed: false,

        name: 'recipient',
        type: 'address',
      },
      {
        components: [
          { name: 'itemType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'identifier', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
        indexed: false,
        internalType: 'structSpentItem[]',
        name: 'offer',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'itemType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'identifier', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          {
            name: 'recipient',
            type: 'address',
          },
        ],
        indexed: false,
        internalType: 'structReceivedItem[]',
        name: 'consideration',
        type: 'tuple[]',
      },
    ],
    name: 'OrderFulfilled',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: false,

        name: 'orderHash',
        type: 'bytes32',
      },
      {
        components: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
            ],

            name: 'offer',
            type: 'tuple[]',
          },
          {
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              {
                name: 'identifierOrCriteria',
                type: 'uint256',
              },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
              {
                name: 'recipient',
                type: 'address',
              },
            ],

            name: 'consideration',
            type: 'tuple[]',
          },
          { name: 'orderType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          { name: 'conduitKey', type: 'bytes32' },
          {
            name: 'totalOriginalConsiderationItems',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'structOrderParameters',
        name: 'orderParameters',
        type: 'tuple',
      },
    ],
    name: 'OrderValidated',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: false,
        name: 'orderHashes',
        type: 'bytes32[]',
      },
    ],
    name: 'OrdersMatched',
    type: 'event',
  },
] as const
