import {
  Address,
  Hex,
  P256,
  Secp256k1,
  Value,
  WebAuthnP256,
  WebCryptoP256,
} from 'ox'
import { getTransactionCount } from 'viem/actions'
import { beforeEach, describe, expect, test } from 'vitest'
import { chain, client, fundAddress } from '../../test/tempo/config.js'
import {
  AuthorizationTempo,
  KeyAuthorization,
  SignatureEnvelope,
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
      payload: TxEnvelopeTempo.getSignPayload(transaction),
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
        payload: TxEnvelopeTempo.getSignPayload(transaction),
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
      payload: TxEnvelopeTempo.getSignPayload(transaction),
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
        payload: TxEnvelopeTempo.getSignPayload(transaction),
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
      payload: TxEnvelopeTempo.getSignPayload(transaction),
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
        payload: TxEnvelopeTempo.getSignPayload(transaction),
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
})
