import { afterAll, bench, describe } from 'vp/test'
import { seaportContractConfig } from '../constants/abis.js'

export type Operations = {
  abiEventEncode: () => unknown
  abiFunctionEncodeDataCached: () => unknown
  abiFunctionEncodeDataDynamic: () => unknown
  abiFunctionEncodeDataUniswapCached: () => unknown
  abiFunctionEncodeDataUniswapDynamic: () => unknown
  contractAddressFromCreate2: () => unknown
  hashKeccak256: () => unknown
  keystoreDecrypt: () => unknown
  mnemonicToPrivateKey: () => unknown
  personalMessageGetSignPayload: () => unknown
  rlpDecode: () => unknown
  rlpEncode: () => unknown
  secp256k1RandomPrivateKey: () => unknown
  secp256k1RecoverPublicKey: () => unknown
  secp256k1Sign: () => unknown
  secp256k1Verify: () => unknown
  transactionEnvelopeGetSignPayload: () => unknown
  typedDataGetSignPayload: () => unknown
  u256GetAmountIn: () => unknown
  u256GetAmountOut: () => unknown
}

export function register(provider: string, operations: Operations) {
  describe(provider, () => {
    let result: unknown

    const registerOperation = (name: string, operation: () => unknown) =>
      bench(name, () => {
        result = operation()
      })

    registerOperation(
      'AbiFunction.encodeData (cached)',
      operations.abiFunctionEncodeDataCached,
    )
    registerOperation(
      'AbiFunction.encodeData (dynamic)',
      operations.abiFunctionEncodeDataDynamic,
    )
    registerOperation(
      'AbiFunction.encodeData (Uniswap cached)',
      operations.abiFunctionEncodeDataUniswapCached,
    )
    registerOperation(
      'AbiFunction.encodeData (Uniswap dynamic)',
      operations.abiFunctionEncodeDataUniswapDynamic,
    )
    registerOperation(
      'TransactionEnvelope.getSignPayload',
      operations.transactionEnvelopeGetSignPayload,
    )
    registerOperation(
      'PersonalMessage.getSignPayload',
      operations.personalMessageGetSignPayload,
    )
    registerOperation(
      'ContractAddress.fromCreate2',
      operations.contractAddressFromCreate2,
    )
    registerOperation('AbiEvent.encode', operations.abiEventEncode)
    registerOperation(
      'TypedData.getSignPayload',
      operations.typedDataGetSignPayload,
    )
    registerOperation('Hash.keccak256 (32 B)', operations.hashKeccak256)
    registerOperation('Keystore.decrypt', operations.keystoreDecrypt)
    registerOperation('Mnemonic.toPrivateKey', operations.mnemonicToPrivateKey)
    registerOperation(
      'Secp256k1.randomPrivateKey',
      operations.secp256k1RandomPrivateKey,
    )
    registerOperation(
      'Secp256k1.recoverPublicKey (32 B)',
      operations.secp256k1RecoverPublicKey,
    )
    registerOperation('Secp256k1.sign (32 B message)', operations.secp256k1Sign)
    registerOperation(
      'Secp256k1.verify (32 B message)',
      operations.secp256k1Verify,
    )
    registerOperation('getAmountIn (bigint)', operations.u256GetAmountIn)
    registerOperation('getAmountOut (bigint)', operations.u256GetAmountOut)
    registerOperation('Rlp.fromBytes', operations.rlpEncode)
    registerOperation('Rlp.toBytes', operations.rlpDecode)

    afterAll(() => {
      if (result === undefined)
        throw new Error(`${provider} produced no benchmark result.`)
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

export const secp256k1Payload = Uint8Array.from(
  { length: 32 },
  (_, index) => index,
)

export const secp256k1PrivateKey = Uint8Array.from({ length: 32 }, (_, index) =>
  index === 31 ? 1 : 0,
)

export const uniswapSwapAbi = {
  inputs: [
    {
      internalType: 'uint256',
      name: 'amount0Out',
      type: 'uint256',
    },
    {
      internalType: 'uint256',
      name: 'amount1Out',
      type: 'uint256',
    },
    {
      internalType: 'address',
      name: 'to',
      type: 'address',
    },
    {
      internalType: 'bytes',
      name: 'data',
      type: 'bytes',
    },
  ],
  name: 'swap',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
} as const

export const uniswapSwapJson = `{
  "type": "function",
  "name": "swap",
  "inputs": [
    {
      "name": "amount0Out",
      "type": "uint256",
      "internalType": "uint256"
    },
    {
      "name": "amount1Out",
      "type": "uint256",
      "internalType": "uint256"
    },
    {
      "name": "to",
      "type": "address",
      "internalType": "address"
    },
    {
      "name": "data",
      "type": "bytes",
      "internalType": "bytes"
    }
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
}`

export const uniswapSwapTo =
  '0x4242424242424242424242424242424242424242' as const

export const uniswapReserve0 = 6_227_630_995_751_221_000_110_015n
export const uniswapReserve1 = 2_634_810_784_674_972_449_382n
export const sushiReserve0 = 4_314_397_529_132_715_691_120_541n
export const sushiReserve1 = 1_845_242_683_965_617_816_423n
export const uniswapAmountIn = 1_000_000_000_000_000_000n

export const rlpValue = [
  Uint8Array.of(42),
  Uint8Array.of(1, 2, 3, 4, 5),
] as const

export function getAmountOut(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
) {
  const amountInWithFee = amountIn * 997n
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * 1_000n + amountInWithFee
  return numerator / denominator
}

export function getAmountIn(
  reserves00: bigint,
  reserves01: bigint,
  isWeth0: boolean,
  reserves10: bigint,
  reserves11: bigint,
) {
  const fee = 997n
  const numerator = (() => {
    if (isWeth0) {
      const presqrt =
        (fee * fee * reserves01 * reserves10) / reserves11 / reserves00
      return (sqrt(presqrt) - 1_000n) * reserves11 * reserves00
    }
    const presqrt =
      (fee * fee * reserves00 * reserves11) / reserves10 / reserves01
    return (sqrt(presqrt) - 1_000n) * reserves10 * reserves01
  })()
  const denominator = isWeth0
    ? fee * reserves11 * 1_000n + fee * fee * reserves01
    : fee * reserves10 * 1_000n + fee * fee * reserves00
  return (numerator * 1_000n) / denominator
}

function sqrt(value: bigint) {
  if (value === 0n) return 0n
  let z = (value + 1n) / 2n
  let y = value
  while (z < y) {
    y = z
    z = (value / z + z) / 2n
  }
  return y
}
