import {
  AbiFunction,
  Address,
  Hex,
  P256,
  RpcTransport,
  Secp256k1,
  Value,
  WebAuthnP256,
  WebCryptoP256,
} from 'ox'
import { getTransactionCount } from 'viem/actions'
import { beforeEach, describe, expect, test } from 'vitest'
import { chain, client, fundAddress, nodeEnv } from '../../test/tempo/config.js'
import {
  AuthorizationTempo,
  KeyAuthorization,
  Period,
  SignatureEnvelope,
  ZoneRpcAuthentication,
} from './index.js'
import * as Transaction from './Transaction.js'
import * as TransactionReceipt from './TransactionReceipt.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const chainId = chain.id

test('behavior: default (secp256k1)', async () => {
  const privateKey = Secp256k1.randomPrivateKey()
  const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

  await fundAddress(client, {
    address,
  })

  const nonce = await getTransactionCount(client, {
    address,
    blockTag: 'pending',
  })

  const transaction = TxEnvelopeTempo.from({
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feeToken: '0x20c0000000000000000000000000000000000001',
    nonce: BigInt(nonce),
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    privateKey,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
    signature: SignatureEnvelope.from(signature),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
  expect(receipt).toBeDefined()

  {
    const response = await client
      .request({
        method: 'eth_getTransactionByHash',
        params: [receipt.transactionHash],
      })
      .then((tx) => Transaction.fromRpc(tx as any))
    if (!response) throw new Error()

    const {
      blockNumber,
      blockHash,
      chainId,
      hash,
      feeToken: _,
      from,
      keyAuthorization: __,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature,
      transactionIndex,
      ...rest
    } = response

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(chainId).toBe(chainId)
    expect(hash).toBe(receipt.transactionHash)
    expect(from).toBe(address)
    expect(maxFeePerGas).toBeDefined()
    expect(maxPriorityFeePerGas).toBeDefined()
    expect(nonce).toBeDefined()
    expect(signature).toBeDefined()
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "calls": [
          {
            "data": "0x",
            "to": "0x0000000000000000000000000000000000000000",
            "value": 0n,
          },
        ],
        "data": undefined,
        "feePayerSignature": null,
        "gas": 500000n,
        "gasPrice": 20000000000n,
        "nonceKey": 0n,
        "type": "tempo",
        "validAfter": null,
        "validBefore": null,
        "value": 0n,
      }
    `)
  }

  const {
    blockNumber,
    blockHash,
    cumulativeGasUsed,
    feePayer,
    feeToken: _,
    from,
    gasUsed,
    logs,
    logsBloom,
    transactionHash,
    transactionIndex,
    ...rest
  } = receipt

  expect(blockNumber).toBeDefined()
  expect(blockHash).toBeDefined()
  expect(cumulativeGasUsed).toBeDefined()
  expect(feePayer).toBeDefined()
  expect(from).toBe(address)
  expect(gasUsed).toBeDefined()
  expect(logs).toBeDefined()
  expect(logsBloom).toBeDefined()
  expect(transactionHash).toBe(receipt.transactionHash)
  expect(transactionIndex).toBeDefined()
  expect(rest).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "contractAddress": null,
      "effectiveGasPrice": 20000000000n,
      "status": "success",
      "to": "0x0000000000000000000000000000000000000000",
      "type": "0x76",
    }
  `)
})

test('behavior: authorizationList (secp256k1)', async () => {
  const privateKey = Secp256k1.randomPrivateKey()
  const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

  await fundAddress(client, {
    address,
  })

  const nonce = await getTransactionCount(client, {
    address,
    blockTag: 'pending',
  })

  const authorization = AuthorizationTempo.from({
    address: '0x0000000000000000000000000000000000000001',
    chainId: 0,
    nonce: BigInt(nonce + 1),
  })

  const authorizationSigned = AuthorizationTempo.from(authorization, {
    signature: SignatureEnvelope.from(
      Secp256k1.sign({
        payload: AuthorizationTempo.getSignPayload(authorization),
        privateKey,
      }),
    ),
  })

  const transaction = TxEnvelopeTempo.from({
    authorizationList: [authorizationSigned],
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feeToken: '0x20c0000000000000000000000000000000000001',
    nonce: BigInt(nonce),
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    privateKey,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
    signature: SignatureEnvelope.from(signature),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
  expect(receipt).toBeDefined()

  const code = await client.request({
    method: 'eth_getCode',
    params: [address, 'latest'],
  })
  expect(Hex.slice(code, 3)).toBe('0x0000000000000000000000000000000000000001')
})

test('behavior: default (p256)', async () => {
  const privateKey = P256.randomPrivateKey()
  const publicKey = P256.getPublicKey({ privateKey })
  const address = Address.fromPublicKey(publicKey)

  await fundAddress(client, {
    address,
  })

  const transaction = TxEnvelopeTempo.from({
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feeToken: '0x20c0000000000000000000000000000000000001',
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = P256.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    privateKey,
    hash: false,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
    signature: SignatureEnvelope.from({
      signature,
      publicKey,
      prehash: false,
    }),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!

  expect(receipt).toBeDefined()

  {
    const response = await client
      .request({
        method: 'eth_getTransactionByHash',
        params: [receipt.transactionHash],
      })
      .then((tx) => Transaction.fromRpc(tx as any))
    if (!response) throw new Error()

    const {
      blockNumber,
      blockHash,
      chainId,
      feeToken: _,
      from,
      keyAuthorization: __,
      hash,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature,
      transactionIndex,
      ...rest
    } = response

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(chainId).toBe(chainId)
    expect(from).toBe(address)
    expect(hash).toBe(receipt.transactionHash)
    expect(nonce).toBeDefined()
    expect(maxFeePerGas).toBeDefined()
    expect(maxPriorityFeePerGas).toBeDefined()
    expect(signature).toBeDefined()
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "calls": [
          {
            "data": "0x",
            "to": "0x0000000000000000000000000000000000000000",
            "value": 0n,
          },
        ],
        "data": undefined,
        "feePayerSignature": null,
        "gas": 500000n,
        "gasPrice": 20000000000n,
        "nonceKey": 0n,
        "type": "tempo",
        "validAfter": null,
        "validBefore": null,
        "value": 0n,
      }
    `)
  }

  const {
    blockNumber,
    blockHash,
    cumulativeGasUsed,
    feePayer,
    feeToken: _,
    from,
    gasUsed,
    logs,
    logsBloom,
    transactionHash,
    transactionIndex,
    ...rest
  } = receipt

  expect(blockNumber).toBeDefined()
  expect(blockHash).toBeDefined()
  expect(cumulativeGasUsed).toBeDefined()
  expect(feePayer).toBeDefined()
  expect(from).toBe(address)
  expect(gasUsed).toBeDefined()
  expect(logs).toBeDefined()
  expect(logsBloom).toBeDefined()
  expect(transactionHash).toBe(receipt.transactionHash)
  expect(transactionIndex).toBeDefined()
  expect(rest).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "contractAddress": null,
      "effectiveGasPrice": 20000000000n,
      "status": "success",
      "to": "0x0000000000000000000000000000000000000000",
      "type": "0x76",
    }
  `)
})

test('behavior: default (p256 - webcrypto)', async () => {
  const keyPair = await WebCryptoP256.createKeyPair()
  const address = Address.fromPublicKey(keyPair.publicKey)

  await fundAddress(client, {
    address,
  })

  const transaction = TxEnvelopeTempo.from({
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feeToken: '0x20c0000000000000000000000000000000000001',
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = await WebCryptoP256.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    privateKey: keyPair.privateKey,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
    signature: SignatureEnvelope.from({
      signature,
      publicKey: keyPair.publicKey,
      prehash: true,
      type: 'p256',
    }),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!

  expect(receipt).toBeDefined()

  {
    const response = await client
      .request({
        method: 'eth_getTransactionByHash',
        params: [receipt.transactionHash],
      })
      .then((tx) => Transaction.fromRpc(tx as any))
    if (!response) throw new Error()

    const {
      blockNumber,
      blockHash,
      chainId,
      feeToken: _,
      from,
      keyAuthorization: __,
      hash,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature,
      transactionIndex,
      ...rest
    } = response as any

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(chainId).toBeDefined()
    expect(from).toBeDefined()
    expect(hash).toBe(receipt.transactionHash)
    expect(nonce).toBeDefined()
    expect(maxFeePerGas).toBeDefined()
    expect(maxPriorityFeePerGas).toBeDefined()
    expect(signature).toBeDefined()
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "calls": [
          {
            "data": "0x",
            "to": "0x0000000000000000000000000000000000000000",
            "value": 0n,
          },
        ],
        "data": undefined,
        "feePayerSignature": null,
        "gas": 500000n,
        "gasPrice": 20000000000n,
        "nonceKey": 0n,
        "type": "tempo",
        "validAfter": null,
        "validBefore": null,
        "value": 0n,
      }
    `)
  }

  const {
    blockNumber,
    blockHash,
    cumulativeGasUsed,
    feePayer,
    feeToken: _,
    from,
    gasUsed,
    logs,
    logsBloom,
    transactionHash,
    transactionIndex,
    ...rest
  } = receipt

  expect(blockNumber).toBeDefined()
  expect(blockHash).toBeDefined()
  expect(cumulativeGasUsed).toBeDefined()
  expect(feePayer).toBeDefined()
  expect(from).toBeDefined()
  expect(gasUsed).toBeDefined()
  expect(logs).toBeDefined()
  expect(logsBloom).toBeDefined()
  expect(transactionHash).toBe(receipt.transactionHash)
  expect(transactionIndex).toBeDefined()
  expect(rest).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "contractAddress": null,
      "effectiveGasPrice": 20000000000n,
      "status": "success",
      "to": "0x0000000000000000000000000000000000000000",
      "type": "0x76",
    }
  `)
})

test('behavior: default (webauthn)', async () => {
  const privateKey = P256.randomPrivateKey()
  const publicKey = P256.getPublicKey({ privateKey })
  const address = Address.fromPublicKey(publicKey)

  await fundAddress(client, {
    address,
  })

  const transaction = TxEnvelopeTempo.from({
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feeToken: '0x20c0000000000000000000000000000000000001',
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const { metadata, payload } = WebAuthnP256.getSignPayload({
    challenge: TxEnvelopeTempo.getSignPayload(transaction),
    rpId: 'localhost',
    origin: 'http://localhost',
  })

  const signature = P256.sign({
    payload,
    privateKey,
    hash: true,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
    signature: SignatureEnvelope.from({
      signature,
      publicKey,
      metadata,
    }),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!

  expect(receipt).toBeDefined()

  {
    const response = await client
      .request({
        method: 'eth_getTransactionByHash',
        params: [receipt.transactionHash],
      })
      .then((tx) => Transaction.fromRpc(tx as any))
    if (!response) throw new Error()

    const {
      blockNumber,
      blockHash,
      chainId,
      feeToken: _,
      from,
      keyAuthorization: __,
      hash,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      transactionIndex,
      signature,
      ...rest
    } = response

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(chainId).toBe(chainId)
    expect(from).toBeDefined()
    expect(hash).toBe(receipt.transactionHash)
    expect(nonce).toBeDefined()
    expect(maxFeePerGas).toBeDefined()
    expect(maxPriorityFeePerGas).toBeDefined()
    expect(signature).toBeDefined()
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "calls": [
          {
            "data": "0x",
            "to": "0x0000000000000000000000000000000000000000",
            "value": 0n,
          },
        ],
        "data": undefined,
        "feePayerSignature": null,
        "gas": 500000n,
        "gasPrice": 20000000000n,
        "nonceKey": 0n,
        "type": "tempo",
        "validAfter": null,
        "validBefore": null,
        "value": 0n,
      }
    `)
  }

  const {
    blockNumber,
    blockHash,
    cumulativeGasUsed,
    feePayer,
    feeToken: _,
    from,
    gasUsed,
    logs,
    logsBloom,
    transactionHash,
    transactionIndex,
    ...rest
  } = receipt

  expect(blockNumber).toBeDefined()
  expect(blockHash).toBeDefined()
  expect(cumulativeGasUsed).toBeDefined()
  expect(feePayer).toBeDefined()
  expect(from).toBe(address)
  expect(gasUsed).toBeDefined()
  expect(logs).toBeDefined()
  expect(logsBloom).toBeDefined()
  expect(transactionHash).toBe(receipt.transactionHash)
  expect(transactionIndex).toBeDefined()
  expect(rest).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "contractAddress": null,
      "effectiveGasPrice": 20000000000n,
      "status": "success",
      "to": "0x0000000000000000000000000000000000000000",
      "type": "0x76",
    }
  `)
})

test('behavior: feePayerSignature (user → feePayer)', async () => {
  const feePayerPrivateKey = Secp256k1.randomPrivateKey()
  const feePayerAddress = Address.fromPublicKey(
    Secp256k1.getPublicKey({ privateKey: feePayerPrivateKey }),
  )

  const senderPrivateKey = Secp256k1.randomPrivateKey()
  const senderAddress = Address.fromPublicKey(
    Secp256k1.getPublicKey({ privateKey: senderPrivateKey }),
  )

  await fundAddress(client, {
    address: feePayerAddress,
  })

  const nonce = await client.request({
    method: 'eth_getTransactionCount',
    params: [senderAddress, 'pending'],
  })

  //////////////////////////////////////////////////////////////////
  // Sender flow

  const transaction = TxEnvelopeTempo.from({
    calls: [{ to: '0x0000000000000000000000000000000000000000', value: 0n }],
    chainId,
    feePayerSignature: null,
    nonce: BigInt(nonce),
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    // unfunded PK
    privateKey: senderPrivateKey,
  })

  const transaction_signed = TxEnvelopeTempo.from(transaction, {
    signature: SignatureEnvelope.from(signature),
  })

  //////////////////////////////////////////////////////////////////
  // Fee payer flow

  const transaction_feePayer = TxEnvelopeTempo.from({
    ...transaction_signed,
    feeToken: '0x20c0000000000000000000000000000000000001',
  })

  const feePayerSignature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getFeePayerSignPayload(transaction_feePayer, {
      sender: senderAddress,
    }),
    privateKey: feePayerPrivateKey,
  })

  const serialized_signed = TxEnvelopeTempo.serialize(transaction_feePayer, {
    feePayerSignature,
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!

  {
    const {
      blockNumber,
      blockHash,
      cumulativeGasUsed,
      feePayer,
      feeToken: _,
      from,
      gasUsed,
      logs,
      logsBloom,
      transactionHash,
      transactionIndex,
      ...rest
    } = receipt

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(cumulativeGasUsed).toBeDefined()
    expect(feePayer).toBe(feePayerAddress)
    expect(from).toBe(senderAddress)
    expect(gasUsed).toBeDefined()
    expect(logs).toBeDefined()
    expect(logsBloom).toBeDefined()
    expect(transactionHash).toBe(receipt.transactionHash)
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "blobGasPrice": undefined,
        "blobGasUsed": undefined,
        "contractAddress": null,
        "effectiveGasPrice": 20000000000n,
        "status": "success",
        "to": "0x0000000000000000000000000000000000000000",
        "type": "0x76",
      }
    `)
  }

  const { feeToken, from } = (await client
    .request({
      method: 'eth_getTransactionByHash',
      params: [receipt.transactionHash],
    })
    .then((tx) => Transaction.fromRpc(tx as any))) as any

  expect(feeToken).toBe('0x20c0000000000000000000000000000000000001')
  expect(from).toBe(senderAddress)
})

test('behavior: feePayerSignature (feePayer → user)', async () => {
  const userPrivateKey = Secp256k1.randomPrivateKey()
  const userAddress = Address.fromPublicKey(
    Secp256k1.getPublicKey({ privateKey: userPrivateKey }),
  )

  const feePayerPrivateKey = Secp256k1.randomPrivateKey()
  const feePayerAddress = Address.fromPublicKey(
    Secp256k1.getPublicKey({ privateKey: feePayerPrivateKey }),
  )

  await Promise.all([
    fundAddress(client, { address: userAddress }),
    fundAddress(client, { address: feePayerAddress }),
  ])

  const nonce = await getTransactionCount(client, {
    address: userAddress,
    blockTag: 'pending',
  })

  //////////////////////////////////////////////////////////////////
  // Fee payer flow

  // 1. Build the transaction with `feePayerSignature: null` to indicate
  //    fee sponsorship intent. The user does NOT commit to `feeToken`.
  const transaction = TxEnvelopeTempo.from({
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
      },
    ],
    chainId,
    feePayerSignature: null,
    feeToken: '0x20c0000000000000000000000000000000000001',
    nonce: BigInt(nonce),
    gas: 500_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  // 2. Fee payer signs first — commits to the sender address and fee token.
  const feePayerSignature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getFeePayerSignPayload(transaction, {
      sender: userAddress,
    }),
    privateKey: feePayerPrivateKey,
  })

  // 3. Attach fee payer signature to the transaction.
  const transaction_feePayer = TxEnvelopeTempo.from(transaction, {
    feePayerSignature,
  })

  //////////////////////////////////////////////////////////////////
  // User flow

  // 4. User signs second — `feePayerSignature` presence causes `feeToken`
  //    to be skipped from the user's signing payload.
  const userSignature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction_feePayer),
    privateKey: userPrivateKey,
  })

  // 5. Serialize with both signatures.
  const serialized_signed = TxEnvelopeTempo.serialize(transaction_feePayer, {
    signature: SignatureEnvelope.from(userSignature),
  })

  const receipt = (await client
    .request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })
    .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
  expect(receipt).toBeDefined()
  expect(receipt.status).toBe('success')
  expect(receipt.from).toBe(userAddress)
  expect(receipt.feePayer).toBe(feePayerAddress)
})

describe('behavior: keyAuthorization', () => {
  const privateKey = Secp256k1.randomPrivateKey()
  const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
  const root = {
    address,
    privateKey,
  } as const

  beforeEach(async () => {
    await fundAddress(client, {
      address,
    })
  })

  test('behavior: secp256k1 access key', async () => {
    const privateKey =
      '0x06a952d58c24d287245276dd8b4272d82a921d27d90874a6c27a3bc19ff4bfde'
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const address = Address.fromPublicKey(publicKey)
    const access = {
      address,
      publicKey,
      privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chain.id),
      type: 'secp256k1',
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: access.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from(signature),
        type: 'keychain',
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      const {
        blockNumber,
        blockHash,
        chainId: _,
        gasPrice,
        hash,
        from,
        keyAuthorization,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        signature,
        transactionIndex,
        ...rest
      } = response

      expect(blockNumber).toBeDefined()
      expect(blockHash).toBeDefined()
      expect(gasPrice).toBeDefined()
      expect(maxFeePerGas).toBeDefined()
      expect(maxPriorityFeePerGas).toBeDefined()
      expect(nonce).toBeDefined()
      expect(from).toBe(root.address)
      expect(hash).toBe(receipt.transactionHash)
      expect(keyAuthorization).toBeDefined()
      expect(signature).toBeDefined()
      expect(transactionIndex).toBeDefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "accessList": [],
          "authorizationList": [],
          "calls": [
            {
              "data": "0x",
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "data": undefined,
          "feePayerSignature": null,
          "feeToken": "0x20c0000000000000000000000000000000000001",
          "gas": 1000000n,
          "nonceKey": 0n,
          "type": "tempo",
          "validAfter": null,
          "validBefore": null,
          "value": 0n,
        }
      `)
    }

    const {
      blockNumber,
      blockHash,
      cumulativeGasUsed,
      feePayer,
      feeToken,
      from,
      gasUsed,
      logs,
      logsBloom,
      transactionHash,
      transactionIndex,
      ...rest
    } = receipt

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(cumulativeGasUsed).toBeDefined()
    expect(feeToken).toBeDefined()
    expect(feePayer).toBeDefined()
    expect(gasUsed).toBeDefined()
    expect(from).toBeDefined()
    expect(logs).toBeDefined()
    expect(logsBloom).toBeDefined()
    expect(transactionHash).toBe(receipt.transactionHash)
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "blobGasPrice": undefined,
        "blobGasUsed": undefined,
        "contractAddress": null,
        "effectiveGasPrice": 20000000000n,
        "status": "success",
        "to": "0x0000000000000000000000000000000000000000",
        "type": "0x76",
      }
    `)

    // Test a subsequent tx signed by access key with no keyAuthorization
    {
      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
          },
        ],
        chainId,
        feeToken: '0x20c0000000000000000000000000000000000001',
        nonce: BigInt(nonce),
        gas: 500_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: access.privateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      const receipt = await client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })

      expect(receipt).toBeDefined()
    }
  })

  test('behavior: p256 access key', async () => {
    const privateKey =
      '0x06a952d58c24d287245276dd8b4272d82a921d27d90874a6c27a3bc19ff4bfde'
    const publicKey = P256.getPublicKey({ privateKey })
    const address = Address.fromPublicKey(publicKey)
    const access = {
      address,
      publicKey,
      privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'p256',
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 500_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = P256.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: access.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from({
          prehash: false,
          publicKey: access.publicKey,
          signature,
          type: 'p256',
        }),
        type: 'keychain',
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(receipt).toBeDefined()

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      const {
        blockNumber,
        blockHash,
        chainId: _,
        gasPrice,
        hash,
        from,
        keyAuthorization,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        signature,
        transactionIndex,
        ...rest
      } = response

      expect(blockNumber).toBeDefined()
      expect(blockHash).toBeDefined()
      expect(gasPrice).toBeDefined()
      expect(hash).toBe(receipt.transactionHash)
      expect(from).toBe(root.address)
      expect(keyAuthorization).toBeDefined()
      expect(maxFeePerGas).toBeDefined()
      expect(maxPriorityFeePerGas).toBeDefined()
      expect(nonce).toBeDefined()
      expect(signature).toBeDefined()
      expect(transactionIndex).toBeDefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "accessList": [],
          "authorizationList": [],
          "calls": [
            {
              "data": "0x",
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "data": undefined,
          "feePayerSignature": null,
          "feeToken": "0x20c0000000000000000000000000000000000001",
          "gas": 500000n,
          "nonceKey": 0n,
          "type": "tempo",
          "validAfter": null,
          "validBefore": null,
          "value": 0n,
        }
      `)
    }

    const {
      blockNumber,
      blockHash,
      cumulativeGasUsed,
      feePayer,
      feeToken,
      from,
      gasUsed,
      logs,
      logsBloom,
      transactionHash,
      transactionIndex,
      ...rest
    } = receipt

    expect(blockNumber).toBeDefined()
    expect(blockHash).toBeDefined()
    expect(cumulativeGasUsed).toBeDefined()
    expect(feePayer).toBeDefined()
    expect(feeToken).toBeDefined()
    expect(from).toBeDefined()
    expect(gasUsed).toBeDefined()
    expect(logs).toBeDefined()
    expect(logsBloom).toBeDefined()
    expect(transactionHash).toBe(receipt.transactionHash)
    expect(transactionIndex).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "blobGasPrice": undefined,
        "blobGasUsed": undefined,
        "contractAddress": null,
        "effectiveGasPrice": 20000000000n,
        "status": "success",
        "to": "0x0000000000000000000000000000000000000000",
        "type": "0x76",
      }
    `)

    // Test a subsequent tx signed by access key with no keyAuthorization
    {
      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
          },
        ],
        chainId,
        feeToken: '0x20c0000000000000000000000000000000000001',
        nonce: BigInt(nonce),
        gas: 500_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = P256.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: access.privateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from({
            prehash: false,
            publicKey: access.publicKey,
            signature,
            type: 'p256',
          }),
          type: 'keychain',
        }),
      })

      const receipt = await client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })

      expect(receipt).toBeDefined()
    }
  })

  test('behavior: webcrypto access key', async () => {
    const keyPair = await WebCryptoP256.createKeyPair()
    const address = Address.fromPublicKey(keyPair.publicKey)
    const access = {
      address,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'p256',
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 500_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = await WebCryptoP256.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: keyPair.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from({
          prehash: true,
          publicKey: access.publicKey,
          signature,
          type: 'p256',
        }),
        type: 'keychain',
      }),
    })

    const receipt = await client.request({
      method: 'eth_sendRawTransactionSync',
      params: [serialized_signed],
    })

    expect(receipt).toBeDefined()

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      const {
        blockNumber,
        blockHash,
        chainId: _,
        gasPrice,
        hash,
        from,
        keyAuthorization,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        signature,
        transactionIndex,
        ...rest
      } = response

      expect(blockNumber).toBeDefined()
      expect(blockHash).toBeDefined()
      expect(gasPrice).toBeDefined()
      expect(hash).toBe(receipt.transactionHash)
      expect(from).toBe(root.address)
      expect(keyAuthorization).toBeDefined()
      expect(maxFeePerGas).toBeDefined()
      expect(maxPriorityFeePerGas).toBeDefined()
      expect(nonce).toBeDefined()
      expect(signature).toBeDefined()
      expect(transactionIndex).toBeDefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "accessList": [],
          "authorizationList": [],
          "calls": [
            {
              "data": "0x",
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "data": undefined,
          "feePayerSignature": null,
          "feeToken": "0x20c0000000000000000000000000000000000001",
          "gas": 500000n,
          "nonceKey": 0n,
          "type": "tempo",
          "validAfter": null,
          "validBefore": null,
          "value": 0n,
        }
      `)
    }

    // Test a subsequent tx signed by access key with no keyAuthorization
    {
      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
          },
        ],
        chainId,
        feeToken: '0x20c0000000000000000000000000000000000001',
        nonce: BigInt(nonce),
        gas: 500_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = await WebCryptoP256.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: keyPair.privateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from({
            prehash: true,
            publicKey: access.publicKey,
            signature,
            type: 'p256',
          }),
          type: 'keychain',
        }),
      })

      const receipt = await client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })

      expect(receipt).toBeDefined()
    }
  })

  test('behavior: access key with limits + expiry', async () => {
    const privateKey = P256.randomPrivateKey()
    const publicKey = P256.getPublicKey({ privateKey })
    const address = Address.fromPublicKey(publicKey)
    const access = {
      address,
      publicKey,
      privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'p256',
      expiry: Math.floor(Date.now() / 1000) + 60 * 60,
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('1000', 6),
        },
      ],
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = P256.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: access.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from({
          prehash: false,
          publicKey: access.publicKey,
          signature,
          type: 'p256',
        }),
        type: 'keychain',
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(receipt).toBeDefined()
    expect(receipt.status).toBe('success')

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      expect(response.from).toBe(root.address)
      expect(response.keyAuthorization).toBeDefined()
      expect(response.keyAuthorization?.expiry).toBe(keyAuth.expiry)
      expect(response.keyAuthorization?.limits).toEqual(keyAuth.limits)
    }
  })

  test('behavior: access key with limits (no expiry)', async () => {
    const privateKey = Secp256k1.randomPrivateKey()
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const address = Address.fromPublicKey(publicKey)
    const access = {
      address,
      publicKey,
      privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('1000', 6),
        },
      ],
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: access.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from(signature),
        type: 'keychain',
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(receipt).toBeDefined()
    expect(receipt.status).toBe('success')

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      expect(response.from).toBe(root.address)
      expect(response.keyAuthorization).toBeDefined()
      expect(response.keyAuthorization?.expiry).toBeUndefined()
      expect(response.keyAuthorization?.limits).toEqual(keyAuth.limits)
    }
  })

  test('behavior: access key with expiry (no limits)', async () => {
    const privateKey = Secp256k1.randomPrivateKey()
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const address = Address.fromPublicKey(publicKey)
    const access = {
      address,
      publicKey,
      privateKey,
    } as const

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'secp256k1',
      expiry: Math.floor(Date.now() / 1000) + 60 * 60,
    })

    const keyAuth_signature = Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(keyAuth),
      privateKey: root.privateKey,
    })

    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(keyAuth_signature),
    })

    const nonce = await getTransactionCount(client, {
      address: root.address,
      blockTag: 'pending',
    })

    const transaction = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(transaction, {
        from: root.address,
      }),
      privateKey: access.privateKey,
    })

    const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        userAddress: root.address,
        inner: SignatureEnvelope.from(signature),
        type: 'keychain',
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(receipt).toBeDefined()
    expect(receipt.status).toBe('success')

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()

      expect(response.from).toBe(root.address)
      expect(response.keyAuthorization).toBeDefined()
      expect(response.keyAuthorization?.expiry).toBe(keyAuth.expiry)
      expect(response.keyAuthorization?.limits).toBeUndefined()
    }
  })

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: access key with periodic spending limit',
    async () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const publicKey = Secp256k1.getPublicKey({ privateKey })
      const address = Address.fromPublicKey(publicKey)
      const access = {
        address,
        publicKey,
        privateKey,
      } as const

      const keyAuth = KeyAuthorization.from({
        address: access.address,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        limits: [
          {
            token: '0x20c0000000000000000000000000000000000001',
            limit: Value.from('1000', 6),
            period: Period.months(1),
          },
        ],
      })

      const keyAuth_signature = Secp256k1.sign({
        payload: KeyAuthorization.getSignPayload(keyAuth),
        privateKey: root.privateKey,
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(keyAuth_signature),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
          },
        ],
        chainId,
        feeToken: '0x20c0000000000000000000000000000000000001',
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 1_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: access.privateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      const receipt = (await client
        .request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        })
        .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
      expect(receipt).toBeDefined()
      expect(receipt.status).toBe('success')

      {
        const response = await client
          .request({
            method: 'eth_getTransactionByHash',
            params: [receipt.transactionHash],
          })
          .then((tx) => Transaction.fromRpc(tx as any))
        if (!response) throw new Error()

        expect(response.from).toBe(root.address)
        expect(response.keyAuthorization).toBeDefined()
        expect(response.keyAuthorization?.limits?.[0]?.limit).toBe(
          Value.from('1000', 6),
        )
        expect(response.keyAuthorization?.limits?.[0]?.period).toBe(2592000)
      }
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: rejects transfer exceeding periodic spending limit',
    async () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const publicKey = Secp256k1.getPublicKey({ privateKey })
      const address = Address.fromPublicKey(publicKey)
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )

      // Key with a 5 USDC periodic limit
      const keyAuth = KeyAuthorization.from({
        address,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        limits: [
          {
            token,
            limit: Value.from('5', 6),
            period: Period.months(1),
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      // Try to transfer 10 USDC (exceeds 5 USDC limit)
      const transferData = AbiFunction.encodeData(transfer, [
        '0x0000000000000000000000000000000000000001',
        Value.from('10', 6),
      ])

      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: transferData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      const receipt = (await client
        .request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        })
        .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
      expect(receipt).toBeDefined()
      expect(receipt.status).toBe('reverted')
    },
  )

  test.runIf(nodeEnv === 'localnet')(
    'behavior: periodic spending limit resets after period',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const recipient = '0x0000000000000000000000000000000000000001'

      // Key with a 5 USDC limit that resets every 5 seconds
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        limits: [
          {
            token,
            limit: Value.from('5', 6),
            period: Period.seconds(5),
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      // 1. Provision key + transfer 4 USDC
      {
        const nonce = await getTransactionCount(client, {
          address: root.address,
          blockTag: 'pending',
        })

        const transferData = AbiFunction.encodeData(transfer, [
          recipient,
          Value.from('4', 6),
        ])

        const transaction = TxEnvelopeTempo.from({
          calls: [{ to: token, data: transferData }],
          chainId,
          feeToken: token,
          keyAuthorization: keyAuth_signed,
          nonce: BigInt(nonce),
          gas: 5_000_000n,
          maxFeePerGas: Value.fromGwei('20'),
          maxPriorityFeePerGas: Value.fromGwei('10'),
        })

        const signature = Secp256k1.sign({
          payload: TxEnvelopeTempo.getSignPayload(transaction, {
            from: root.address,
          }),
          privateKey: accessPrivateKey,
        })

        const serialized = TxEnvelopeTempo.serialize(transaction, {
          signature: SignatureEnvelope.from({
            userAddress: root.address,
            inner: SignatureEnvelope.from(signature),
            type: 'keychain',
          }),
        })

        const receipt = (await client
          .request({
            method: 'eth_sendRawTransactionSync',
            params: [serialized],
          })
          .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
        expect(receipt.status).toBe('success')
      }

      // 2. Immediately try another 4 USDC transfer (should revert — limit exhausted)
      {
        const nonce = await getTransactionCount(client, {
          address: root.address,
          blockTag: 'pending',
        })

        const transferData = AbiFunction.encodeData(transfer, [
          recipient,
          Value.from('4', 6),
        ])

        const transaction = TxEnvelopeTempo.from({
          calls: [{ to: token, data: transferData }],
          chainId,
          feeToken: token,
          nonce: BigInt(nonce),
          gas: 5_000_000n,
          maxFeePerGas: Value.fromGwei('20'),
          maxPriorityFeePerGas: Value.fromGwei('10'),
        })

        const signature = Secp256k1.sign({
          payload: TxEnvelopeTempo.getSignPayload(transaction, {
            from: root.address,
          }),
          privateKey: accessPrivateKey,
        })

        const serialized = TxEnvelopeTempo.serialize(transaction, {
          signature: SignatureEnvelope.from({
            userAddress: root.address,
            inner: SignatureEnvelope.from(signature),
            type: 'keychain',
          }),
        })

        const receipt = (await client
          .request({
            method: 'eth_sendRawTransactionSync',
            params: [serialized],
          })
          .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
        expect(receipt.status).toBe('reverted')
      }

      // 3. Wait for period to reset
      await new Promise((resolve) => setTimeout(resolve, 6000))

      // 4. Transfer 4 USDC again (should succeed — period reset)
      {
        const nonce = await getTransactionCount(client, {
          address: root.address,
          blockTag: 'pending',
        })

        const transferData = AbiFunction.encodeData(transfer, [
          recipient,
          Value.from('4', 6),
        ])

        const transaction = TxEnvelopeTempo.from({
          calls: [{ to: token, data: transferData }],
          chainId,
          feeToken: token,
          nonce: BigInt(nonce),
          gas: 5_000_000n,
          maxFeePerGas: Value.fromGwei('20'),
          maxPriorityFeePerGas: Value.fromGwei('10'),
        })

        const signature = Secp256k1.sign({
          payload: TxEnvelopeTempo.getSignPayload(transaction, {
            from: root.address,
          }),
          privateKey: accessPrivateKey,
        })

        const serialized = TxEnvelopeTempo.serialize(transaction, {
          signature: SignatureEnvelope.from({
            userAddress: root.address,
            inner: SignatureEnvelope.from(signature),
            type: 'keychain',
          }),
        })

        const receipt = (await client
          .request({
            method: 'eth_sendRawTransactionSync',
            params: [serialized],
          })
          .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
        expect(receipt.status).toBe('success')
      }
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: access key with call scopes (transfer)',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const recipient = '0x0000000000000000000000000000000000000001'
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const transferData = AbiFunction.encodeData(transfer, [
        recipient,
        Value.from('1', 6),
      ])

      // Scope key: only transfer() on token contract, with sufficient spending limit
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        limits: [{ token, limit: Value.from('10000', 6) }],
        scopes: [
          {
            address: token,
            selector: AbiFunction.getSelector(transfer),
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: transferData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      const receipt = (await client
        .request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        })
        .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
      expect(receipt).toBeDefined()
      expect(receipt.status).toBe('success')

      {
        const response = await client
          .request({
            method: 'eth_getTransactionByHash',
            params: [receipt.transactionHash],
          })
          .then((tx) => Transaction.fromRpc(tx as any))
        if (!response) throw new Error()

        expect(response.from).toBe(root.address)
        expect(response.keyAuthorization).toBeDefined()
        expect(response.keyAuthorization?.scopes?.[0]?.address).toBe(token)
        expect(response.keyAuthorization?.scopes?.[0]?.selector).toBe(
          '0xa9059cbb',
        )
      }
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: access key with call scopes + recipient allowlist (transfer)',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const recipient = '0x0000000000000000000000000000000000000001'
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const transferData = AbiFunction.encodeData(transfer, [
        recipient,
        Value.from('1', 6),
      ])

      // Scope key: transfer() on token, only to recipient, with sufficient spending limit
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        limits: [{ token, limit: Value.from('10000', 6) }],
        scopes: [
          {
            address: token,
            selector: AbiFunction.getSelector(transfer),
            recipients: [recipient],
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: transferData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      const receipt = (await client
        .request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        })
        .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
      expect(receipt).toBeDefined()
      expect(receipt.status).toBe('success')

      {
        const response = await client
          .request({
            method: 'eth_getTransactionByHash',
            params: [receipt.transactionHash],
          })
          .then((tx) => Transaction.fromRpc(tx as any))
        if (!response) throw new Error()

        expect(response.from).toBe(root.address)
        expect(response.keyAuthorization).toBeDefined()
        expect(response.keyAuthorization?.scopes?.[0]?.selector).toBe(
          '0xa9059cbb',
        )
        expect(response.keyAuthorization?.scopes?.[0]?.recipients).toEqual([
          recipient,
        ])
      }
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: rejects transfer to wrong contract (outside scope)',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const token1 = '0x20c0000000000000000000000000000000000001'
      const token2 = '0x20c0000000000000000000000000000000000002'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const transferData = AbiFunction.encodeData(transfer, [
        '0x0000000000000000000000000000000000000001',
        Value.from('1', 6),
      ])

      // Scope key to only token1
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        scopes: [
          {
            address: token1,
            selector: AbiFunction.getSelector(transfer),
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      // Call transfer on token2 (not scoped) — should be rejected
      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token2, data: transferData }],
        chainId,
        feeToken: token1,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      await expect(
        client.request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        }),
      ).rejects.toThrow()
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: rejects approve when only transfer is scoped',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const approve = AbiFunction.from(
        'function approve(address spender, uint256 amount)',
      )
      const approveData = AbiFunction.encodeData(approve, [
        '0x0000000000000000000000000000000000000001',
        Value.from('1', 6),
      ])

      // Scope key to only transfer()
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        scopes: [
          {
            address: token,
            selector: AbiFunction.getSelector(transfer),
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      // Call approve() instead — should be rejected
      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: approveData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      await expect(
        client.request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        }),
      ).rejects.toThrow()
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: rejects transfer to wrong recipient',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const token = '0x20c0000000000000000000000000000000000001'
      const allowedRecipient = '0x0000000000000000000000000000000000000001'
      const wrongRecipient = '0x0000000000000000000000000000000000000002'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const transferData = AbiFunction.encodeData(transfer, [
        wrongRecipient,
        Value.from('1', 6),
      ])

      // Scope key: transfer only to allowedRecipient
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        scopes: [
          {
            address: token,
            selector: AbiFunction.getSelector(transfer),
            recipients: [allowedRecipient],
          },
        ],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      // transfer to wrongRecipient — should be rejected
      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: transferData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      await expect(
        client.request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        }),
      ).rejects.toThrow()
    },
  )

  // TODO: remove skipIf when testnet has T3
  test.skipIf(nodeEnv === 'testnet')(
    'behavior: rejects any call when scopes = [] (empty)',
    async () => {
      const accessPrivateKey = Secp256k1.randomPrivateKey()
      const accessAddress = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey: accessPrivateKey }),
      )
      const token = '0x20c0000000000000000000000000000000000001'
      const transfer = AbiFunction.from(
        'function transfer(address to, uint256 amount)',
      )
      const transferData = AbiFunction.encodeData(transfer, [
        '0x0000000000000000000000000000000000000001',
        Value.from('1', 6),
      ])

      // scopes = [] → scoped mode with NO calls allowed
      const keyAuth = KeyAuthorization.from({
        address: accessAddress,
        chainId: BigInt(chainId),
        type: 'secp256k1',
        scopes: [],
      })

      const keyAuth_signed = KeyAuthorization.from(keyAuth, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            payload: KeyAuthorization.getSignPayload(keyAuth),
            privateKey: root.privateKey,
          }),
        ),
      })

      const nonce = await getTransactionCount(client, {
        address: root.address,
        blockTag: 'pending',
      })

      const transaction = TxEnvelopeTempo.from({
        calls: [{ to: token, data: transferData }],
        chainId,
        feeToken: token,
        keyAuthorization: keyAuth_signed,
        nonce: BigInt(nonce),
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction, {
          from: root.address,
        }),
        privateKey: accessPrivateKey,
      })

      const serialized_signed = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          userAddress: root.address,
          inner: SignatureEnvelope.from(signature),
          type: 'keychain',
        }),
      })

      await expect(
        client.request({
          method: 'eth_sendRawTransactionSync',
          params: [serialized_signed],
        }),
      ).rejects.toThrow()
    },
  )
})
