/**
 * EntryPoint version.
 *
 * @see https://github.com/eth-infinitism/account-abstraction/releases
 */
export type Version = '0.6' | '0.7' | '0.8'

/** EntryPoint 0.6 ABI. */
export const abiV06 = [
  {
    inputs: [
      { name: 'preOpGas', type: 'uint256' },
      { name: 'paid', type: 'uint256' },
      { name: 'validAfter', type: 'uint48' },
      { name: 'validUntil', type: 'uint48' },
      { name: 'targetSuccess', type: 'bool' },
      { name: 'targetResult', type: 'bytes' },
    ],
    name: 'ExecutionResult',
    type: 'error',
  },
  {
    inputs: [
      { name: 'opIndex', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    name: 'FailedOp',
    type: 'error',
  },
  {
    inputs: [{ name: 'sender', type: 'address' }],
    name: 'SenderAddressResult',
    type: 'error',
  },
  {
    inputs: [{ name: 'aggregator', type: 'address' }],
    name: 'SignatureValidationFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        components: [
          { name: 'preOpGas', type: 'uint256' },
          { name: 'prefund', type: 'uint256' },
          { name: 'sigFailed', type: 'bool' },
          { name: 'validAfter', type: 'uint48' },
          { name: 'validUntil', type: 'uint48' },
          { name: 'paymasterContext', type: 'bytes' },
        ],

        name: 'returnInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'senderInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'factoryInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'paymasterInfo',
        type: 'tuple',
      },
    ],
    name: 'ValidationResult',
    type: 'error',
  },
  {
    inputs: [
      {
        components: [
          { name: 'preOpGas', type: 'uint256' },
          { name: 'prefund', type: 'uint256' },
          { name: 'sigFailed', type: 'bool' },
          { name: 'validAfter', type: 'uint48' },
          { name: 'validUntil', type: 'uint48' },
          { name: 'paymasterContext', type: 'bytes' },
        ],

        name: 'returnInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'senderInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'factoryInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'stake', type: 'uint256' },
          { name: 'unstakeDelaySec', type: 'uint256' },
        ],

        name: 'paymasterInfo',
        type: 'tuple',
      },
      {
        components: [
          { name: 'aggregator', type: 'address' },
          {
            components: [
              { name: 'stake', type: 'uint256' },
              {
                name: 'unstakeDelaySec',
                type: 'uint256',
              },
            ],

            name: 'stakeInfo',
            type: 'tuple',
          },
        ],

        name: 'aggregatorInfo',
        type: 'tuple',
      },
    ],
    name: 'ValidationResultWithAggregation',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'factory',
        type: 'address',
      },
      {
        indexed: false,

        name: 'paymaster',
        type: 'address',
      },
    ],
    name: 'AccountDeployed',
    type: 'event',
  },
  { anonymous: false, inputs: [], name: 'BeforeExecution', type: 'event' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'totalDeposit',
        type: 'uint256',
      },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'aggregator',
        type: 'address',
      },
    ],
    name: 'SignatureAggregatorChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'totalStaked',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'unstakeDelaySec',
        type: 'uint256',
      },
    ],
    name: 'StakeLocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawTime',
        type: 'uint256',
      },
    ],
    name: 'StakeUnlocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,

        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'StakeWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,

        name: 'paymaster',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
      { indexed: false, name: 'success', type: 'bool' },
      {
        indexed: false,

        name: 'actualGasCost',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'actualGasUsed',
        type: 'uint256',
      },
    ],
    name: 'UserOperationEvent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'revertReason',
        type: 'bytes',
      },
    ],
    name: 'UserOperationRevertReason',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,

        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdrawn',
    type: 'event',
  },
  {
    inputs: [],
    name: 'SIG_VALIDATION_FAILED',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'initCode', type: 'bytes' },
      { name: 'sender', type: 'address' },
      { name: 'paymasterAndData', type: 'bytes' },
    ],
    name: '_validateSenderAndPaymaster',
    outputs: [],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'unstakeDelaySec', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', type: 'uint112' },
      { name: 'staked', type: 'bool' },
      { name: 'stake', type: 'uint112' },
      { name: 'unstakeDelaySec', type: 'uint32' },
      { name: 'withdrawTime', type: 'uint48' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        components: [
          { name: 'deposit', type: 'uint112' },
          { name: 'staked', type: 'bool' },
          { name: 'stake', type: 'uint112' },
          { name: 'unstakeDelaySec', type: 'uint32' },
          { name: 'withdrawTime', type: 'uint48' },
        ],

        name: 'info',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'key', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'initCode', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          { name: 'callGasLimit', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            type: 'uint256',
          },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'userOp',
        type: 'tuple',
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'sender', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              { name: 'initCode', type: 'bytes' },
              { name: 'callData', type: 'bytes' },
              {
                name: 'callGasLimit',
                type: 'uint256',
              },
              {
                name: 'verificationGasLimit',
                type: 'uint256',
              },
              {
                name: 'preVerificationGas',
                type: 'uint256',
              },
              {
                name: 'maxFeePerGas',
                type: 'uint256',
              },
              {
                name: 'maxPriorityFeePerGas',
                type: 'uint256',
              },
              {
                name: 'paymasterAndData',
                type: 'bytes',
              },
              { name: 'signature', type: 'bytes' },
            ],

            name: 'userOps',
            type: 'tuple[]',
          },
          {
            name: 'aggregator',
            type: 'address',
          },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'opsPerAggregator',
        type: 'tuple[]',
      },
      { name: 'beneficiary', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          { name: 'callGasLimit', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            type: 'uint256',
          },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'ops',
        type: 'tuple[]',
      },
      { name: 'beneficiary', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'key', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'callData', type: 'bytes' },
      {
        components: [
          {
            components: [
              { name: 'sender', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              {
                name: 'callGasLimit',
                type: 'uint256',
              },
              {
                name: 'verificationGasLimit',
                type: 'uint256',
              },
              {
                name: 'preVerificationGas',
                type: 'uint256',
              },
              { name: 'paymaster', type: 'address' },
              {
                name: 'maxFeePerGas',
                type: 'uint256',
              },
              {
                name: 'maxPriorityFeePerGas',
                type: 'uint256',
              },
            ],

            name: 'mUserOp',
            type: 'tuple',
          },
          { name: 'userOpHash', type: 'bytes32' },
          { name: 'prefund', type: 'uint256' },
          { name: 'contextOffset', type: 'uint256' },
          { name: 'preOpGas', type: 'uint256' },
        ],

        name: 'opInfo',
        type: 'tuple',
      },
      { name: 'context', type: 'bytes' },
    ],
    name: 'innerHandleOp',
    outputs: [{ name: 'actualGasCost', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          { name: 'callGasLimit', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            type: 'uint256',
          },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'op',
        type: 'tuple',
      },
      { name: 'target', type: 'address' },
      { name: 'targetCallData', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          { name: 'callGasLimit', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            type: 'uint256',
          },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'userOp',
        type: 'tuple',
      },
    ],
    name: 'simulateValidation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unlockStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
      },
    ],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
      },
      { name: 'withdrawAmount', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

/** EntryPoint 0.7 ABI. */
export const abiV07 = [
  {
    inputs: [
      { name: 'success', type: 'bool' },
      { name: 'ret', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
    type: 'error',
  },
  {
    inputs: [
      { name: 'opIndex', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    name: 'FailedOp',
    type: 'error',
  },
  {
    inputs: [
      { name: 'opIndex', type: 'uint256' },
      { name: 'reason', type: 'string' },
      { name: 'inner', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
    type: 'error',
  },
  {
    inputs: [{ name: 'returnData', type: 'bytes' }],
    name: 'PostOpReverted',
    type: 'error',
  },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  {
    inputs: [{ name: 'sender', type: 'address' }],
    name: 'SenderAddressResult',
    type: 'error',
  },
  {
    inputs: [{ name: 'aggregator', type: 'address' }],
    name: 'SignatureValidationFailed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'factory',
        type: 'address',
      },
      {
        indexed: false,

        name: 'paymaster',
        type: 'address',
      },
    ],
    name: 'AccountDeployed',
    type: 'event',
  },
  { anonymous: false, inputs: [], name: 'BeforeExecution', type: 'event' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'totalDeposit',
        type: 'uint256',
      },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'revertReason',
        type: 'bytes',
      },
    ],
    name: 'PostOpRevertReason',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'aggregator',
        type: 'address',
      },
    ],
    name: 'SignatureAggregatorChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'totalStaked',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'unstakeDelaySec',
        type: 'uint256',
      },
    ],
    name: 'StakeLocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawTime',
        type: 'uint256',
      },
    ],
    name: 'StakeUnlocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,

        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'StakeWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,

        name: 'paymaster',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
      { indexed: false, name: 'success', type: 'bool' },
      {
        indexed: false,

        name: 'actualGasCost',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'actualGasUsed',
        type: 'uint256',
      },
    ],
    name: 'UserOperationEvent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
    ],
    name: 'UserOperationPrefundTooLow',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,

        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,

        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,

        name: 'revertReason',
        type: 'bytes',
      },
    ],
    name: 'UserOperationRevertReason',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,

        name: 'account',
        type: 'address',
      },
      {
        indexed: false,

        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,

        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdrawn',
    type: 'event',
  },
  {
    inputs: [{ name: 'unstakeDelaySec', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', type: 'uint256' },
      { name: 'staked', type: 'bool' },
      { name: 'stake', type: 'uint112' },
      { name: 'unstakeDelaySec', type: 'uint32' },
      { name: 'withdrawTime', type: 'uint48' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        components: [
          { name: 'deposit', type: 'uint256' },
          { name: 'staked', type: 'bool' },
          { name: 'stake', type: 'uint112' },
          { name: 'unstakeDelaySec', type: 'uint32' },
          { name: 'withdrawTime', type: 'uint48' },
        ],

        name: 'info',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'key', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'initCode', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          {
            name: 'accountGasLimits',
            type: 'bytes32',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'gasFees', type: 'bytes32' },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'userOp',
        type: 'tuple',
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'sender', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              { name: 'initCode', type: 'bytes' },
              { name: 'callData', type: 'bytes' },
              {
                name: 'accountGasLimits',
                type: 'bytes32',
              },
              {
                name: 'preVerificationGas',
                type: 'uint256',
              },
              { name: 'gasFees', type: 'bytes32' },
              {
                name: 'paymasterAndData',
                type: 'bytes',
              },
              { name: 'signature', type: 'bytes' },
            ],

            name: 'userOps',
            type: 'tuple[]',
          },
          {
            name: 'aggregator',
            type: 'address',
          },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'opsPerAggregator',
        type: 'tuple[]',
      },
      { name: 'beneficiary', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          {
            name: 'accountGasLimits',
            type: 'bytes32',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { name: 'gasFees', type: 'bytes32' },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],

        name: 'ops',
        type: 'tuple[]',
      },
      { name: 'beneficiary', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'key', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'callData', type: 'bytes' },
      {
        components: [
          {
            components: [
              { name: 'sender', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              {
                name: 'verificationGasLimit',
                type: 'uint256',
              },
              {
                name: 'callGasLimit',
                type: 'uint256',
              },
              {
                name: 'paymasterVerificationGasLimit',
                type: 'uint256',
              },
              {
                name: 'paymasterPostOpGasLimit',
                type: 'uint256',
              },
              {
                name: 'preVerificationGas',
                type: 'uint256',
              },
              { name: 'paymaster', type: 'address' },
              {
                name: 'maxFeePerGas',
                type: 'uint256',
              },
              {
                name: 'maxPriorityFeePerGas',
                type: 'uint256',
              },
            ],

            name: 'mUserOp',
            type: 'tuple',
          },
          { name: 'userOpHash', type: 'bytes32' },
          { name: 'prefund', type: 'uint256' },
          { name: 'contextOffset', type: 'uint256' },
          { name: 'preOpGas', type: 'uint256' },
        ],

        name: 'opInfo',
        type: 'tuple',
      },
      { name: 'context', type: 'bytes' },
    ],
    name: 'innerHandleOp',
    outputs: [{ name: 'actualGasCost', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unlockStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
      },
    ],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
      },
      { name: 'withdrawAmount', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

/** EntryPoint 0.8 ABI. */
export const abiV08 = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    inputs: [
      { internalType: 'bool', name: 'success', type: 'bool' },
      { internalType: 'bytes', name: 'ret', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'opIndex', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'FailedOp',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'opIndex', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
      { internalType: 'bytes', name: 'inner', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
    type: 'error',
  },
  { inputs: [], name: 'InvalidShortString', type: 'error' },
  {
    inputs: [{ internalType: 'bytes', name: 'returnData', type: 'bytes' }],
    name: 'PostOpReverted',
    type: 'error',
  },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
    name: 'SenderAddressResult',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'aggregator', type: 'address' }],
    name: 'SignatureValidationFailed',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'string', name: 'str', type: 'string' }],
    name: 'StringTooLong',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'factory',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'paymaster',
        type: 'address',
      },
    ],
    name: 'AccountDeployed',
    type: 'event',
  },
  { anonymous: false, inputs: [], name: 'BeforeExecution', type: 'event' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalDeposit',
        type: 'uint256',
      },
    ],
    name: 'Deposited',
    type: 'event',
  },
  { anonymous: false, inputs: [], name: 'EIP712DomainChanged', type: 'event' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'revertReason',
        type: 'bytes',
      },
    ],
    name: 'PostOpRevertReason',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'aggregator',
        type: 'address',
      },
    ],
    name: 'SignatureAggregatorChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalStaked',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'unstakeDelaySec',
        type: 'uint256',
      },
    ],
    name: 'StakeLocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'withdrawTime',
        type: 'uint256',
      },
    ],
    name: 'StakeUnlocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'StakeWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'paymaster',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      { indexed: false, internalType: 'bool', name: 'success', type: 'bool' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'actualGasCost',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'actualGasUsed',
        type: 'uint256',
      },
    ],
    name: 'UserOperationEvent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
    ],
    name: 'UserOperationPrefundTooLow',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'revertReason',
        type: 'bytes',
      },
    ],
    name: 'UserOperationRevertReason',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'withdrawAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdrawn',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint32', name: 'unstakeDelaySec', type: 'uint32' },
    ],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'target', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { internalType: 'bytes1', name: 'fields', type: 'bytes1' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'version', type: 'string' },
      { internalType: 'uint256', name: 'chainId', type: 'uint256' },
      { internalType: 'address', name: 'verifyingContract', type: 'address' },
      { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
      { internalType: 'uint256[]', name: 'extensions', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'deposit', type: 'uint256' },
          { internalType: 'bool', name: 'staked', type: 'bool' },
          { internalType: 'uint112', name: 'stake', type: 'uint112' },
          { internalType: 'uint32', name: 'unstakeDelaySec', type: 'uint32' },
          { internalType: 'uint48', name: 'withdrawTime', type: 'uint48' },
        ],
        internalType: 'struct IStakeManager.DepositInfo',
        name: 'info',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDomainSeparatorV4',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'uint192', name: 'key', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ internalType: 'uint256', name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPackedUserOpTypeHash',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes', name: 'initCode', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
          { internalType: 'bytes', name: 'initCode', type: 'bytes' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' },
          {
            internalType: 'bytes32',
            name: 'accountGasLimits',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { internalType: 'bytes32', name: 'gasFees', type: 'bytes32' },
          { internalType: 'bytes', name: 'paymasterAndData', type: 'bytes' },
          { internalType: 'bytes', name: 'signature', type: 'bytes' },
        ],
        internalType: 'struct PackedUserOperation',
        name: 'userOp',
        type: 'tuple',
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'sender', type: 'address' },
              { internalType: 'uint256', name: 'nonce', type: 'uint256' },
              { internalType: 'bytes', name: 'initCode', type: 'bytes' },
              { internalType: 'bytes', name: 'callData', type: 'bytes' },
              {
                internalType: 'bytes32',
                name: 'accountGasLimits',
                type: 'bytes32',
              },
              {
                internalType: 'uint256',
                name: 'preVerificationGas',
                type: 'uint256',
              },
              { internalType: 'bytes32', name: 'gasFees', type: 'bytes32' },
              {
                internalType: 'bytes',
                name: 'paymasterAndData',
                type: 'bytes',
              },
              { internalType: 'bytes', name: 'signature', type: 'bytes' },
            ],
            internalType: 'struct PackedUserOperation[]',
            name: 'userOps',
            type: 'tuple[]',
          },
          {
            internalType: 'contract IAggregator',
            name: 'aggregator',
            type: 'address',
          },
          { internalType: 'bytes', name: 'signature', type: 'bytes' },
        ],
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        name: 'opsPerAggregator',
        type: 'tuple[]',
      },
      { internalType: 'address payable', name: 'beneficiary', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
          { internalType: 'bytes', name: 'initCode', type: 'bytes' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' },
          {
            internalType: 'bytes32',
            name: 'accountGasLimits',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'preVerificationGas',
            type: 'uint256',
          },
          { internalType: 'bytes32', name: 'gasFees', type: 'bytes32' },
          { internalType: 'bytes', name: 'paymasterAndData', type: 'bytes' },
          { internalType: 'bytes', name: 'signature', type: 'bytes' },
        ],
        internalType: 'struct PackedUserOperation[]',
        name: 'ops',
        type: 'tuple[]',
      },
      { internalType: 'address payable', name: 'beneficiary', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint192', name: 'key', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'callData', type: 'bytes' },
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'sender', type: 'address' },
              { internalType: 'uint256', name: 'nonce', type: 'uint256' },
              {
                internalType: 'uint256',
                name: 'verificationGasLimit',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'callGasLimit',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'paymasterVerificationGasLimit',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'paymasterPostOpGasLimit',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'preVerificationGas',
                type: 'uint256',
              },
              { internalType: 'address', name: 'paymaster', type: 'address' },
              {
                internalType: 'uint256',
                name: 'maxFeePerGas',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'maxPriorityFeePerGas',
                type: 'uint256',
              },
            ],
            internalType: 'struct EntryPoint.MemoryUserOp',
            name: 'mUserOp',
            type: 'tuple',
          },
          { internalType: 'bytes32', name: 'userOpHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'prefund', type: 'uint256' },
          { internalType: 'uint256', name: 'contextOffset', type: 'uint256' },
          { internalType: 'uint256', name: 'preOpGas', type: 'uint256' },
        ],
        internalType: 'struct EntryPoint.UserOpInfo',
        name: 'opInfo',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'context', type: 'bytes' },
    ],
    name: 'innerHandleOp',
    outputs: [
      { internalType: 'uint256', name: 'actualGasCost', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint192', name: '', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'senderCreator',
    outputs: [
      { internalType: 'contract ISenderCreator', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unlockStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'withdrawAddress',
        type: 'address',
      },
    ],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'withdrawAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'withdrawAmount', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

/** EntryPoint 0.6 address. */
export const addressV06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const

/** EntryPoint 0.7 address. */
export const addressV07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const

/** EntryPoint 0.8 address. */
export const addressV08 = '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108' as const
