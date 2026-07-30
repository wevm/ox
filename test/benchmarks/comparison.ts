import { bench, describe } from 'vp/test'
import { seaportContractConfig } from '../constants/abis.js'

export type Operations = {
  abiEventEncode: () => unknown
  abiFunctionEncodeDataCached: () => unknown
  abiFunctionEncodeDataDynamic: () => unknown
  contractAddressFromCreate2: () => unknown
  keystoreDecrypt: () => unknown
  mnemonicToPrivateKey: () => unknown
  personalMessageGetSignPayload: () => unknown
  secp256k1RandomPrivateKey: () => unknown
  transactionEnvelopeGetSignPayload: () => unknown
  typedDataGetSignPayload: () => unknown
}

export function register(provider: string, operations: Operations) {
  describe(provider, () => {
    bench('AbiFunction.encodeData (cached)', () => {
      operations.abiFunctionEncodeDataCached()
    })
    bench('AbiFunction.encodeData (dynamic)', () => {
      operations.abiFunctionEncodeDataDynamic()
    })
    bench('TransactionEnvelope.getSignPayload', () => {
      operations.transactionEnvelopeGetSignPayload()
    })
    bench('PersonalMessage.getSignPayload', () => {
      operations.personalMessageGetSignPayload()
    })
    bench('ContractAddress.fromCreate2', () => {
      operations.contractAddressFromCreate2()
    })
    bench('AbiEvent.encode', () => {
      operations.abiEventEncode()
    })
    bench('TypedData.getSignPayload', () => {
      operations.typedDataGetSignPayload()
    })
    bench('Keystore.decrypt', () => {
      operations.keystoreDecrypt()
    })
    bench('Mnemonic.toPrivateKey', () => {
      operations.mnemonicToPrivateKey()
    })
    bench('Secp256k1.randomPrivateKey', () => {
      operations.secp256k1RandomPrivateKey()
    })
  })
}

export const seaportAbi = seaportContractConfig.abi

export const seaportArgs = [
  {
    parameters: {
      conduitKey:
        '0x511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511aaa511a',
      consideration: [
        {
          endAmount: 420n,
          identifierOrCriteria: 69n,
          itemType: 1,
          recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          startAmount: 6n,
          token: '0x0000000000000000000000000000000000000000',
        },
        {
          endAmount: 141n,
          identifierOrCriteria: 55n,
          itemType: 0,
          recipient: '0x000000000000000000000000000000000000dEaD',
          startAmount: 15n,
          token: '0x0000000000000000000000000000000000000000',
        },
      ],
      endTime: 1_800_000_000n,
      offer: [
        {
          endAmount: 1n,
          identifierOrCriteria: 1234n,
          itemType: 2,
          startAmount: 1n,
          token: '0x1234567890123456789012345678901234567890',
        },
        {
          endAmount: 1_000_000n,
          identifierOrCriteria: 0n,
          itemType: 1,
          startAmount: 1_000_000n,
          token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
      ],
      offerer: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      orderType: 0,
      salt: 123_456_789n,
      startTime: 1_700_000_000n,
      totalOriginalConsiderationItems: 2n,
      zone: '0x0000000000000000000000000000000000000000',
      zoneHash:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    signature:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
  },
  '0x0000000000000000000000000000000000000000000000000000000000000000',
] as const

export const event = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'sender', type: 'address' },
    { indexed: true, name: 'contents', type: 'string' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
  name: 'Message',
  type: 'event',
} as const

export const eventArgs = {
  contents: 'Ox benchmark message',
  sender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  value: 42n,
} as const

export const transactionEnvelope = {
  chainId: 1,
  gas: 21_000n,
  maxFeePerGas: 20_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  nonce: 42n,
  to: '0x1234567890123456789012345678901234567890',
  type: 'eip1559',
  value: 1_000_000_000_000_000_000n,
} as const

export const personalMessage =
  '0x4f782062656e63686d61726b7320686967682d6c6576656c2063727970746f67726170686963206f7065726174696f6e732e' as const

export const create2Options = {
  bytecode: '0x6394198df16000526103ff60206004601c335afa6040516060f3',
  from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
  salt: '0x68656c6c6f20776f726c64',
} as const

export const typedData = {
  domain: {
    chainId: 1,
    name: 'Ether Mail',
    verifyingContract: '0x0000000000000000000000000000000000000000',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
  },
  primaryType: 'Mail',
  types: {
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
} as const

export const keystore = {
  crypto: {
    cipher: 'aes-128-ctr',
    cipherparams: {
      iv: '6087dab2f9fdbbfaddc31a909735c1e6',
    },
    ciphertext:
      '583d14406889943bd38ddbb3207d966f4e797e1064a5ee9761b859c68d5e9c70',
    kdf: 'pbkdf2',
    kdfparams: {
      c: 8192,
      dklen: 32,
      prf: 'hmac-sha256',
      salt: 'ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
    },
    mac: 'ba98d7d25b0be12a943cb75a0689e33bbc6781c53ccc2cd708a3b41f4ede72d8',
  },
  id: '7e59dc02-8d42-409d-b29a-a8a0f862cc81',
  version: 3,
} as const

export const keystoreKeyOptions = {
  iterations: 8192,
  iv: '0x6087dab2f9fdbbfaddc31a909735c1e6',
  password: 'testpassword',
  salt: '0xae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd',
} as const

export const mnemonic =
  'test test test test test test test test test test test junk'
