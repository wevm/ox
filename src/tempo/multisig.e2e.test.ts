import { AbiFunction, Address, Hex, Secp256k1, Value } from 'ox'
import { getTransactionCount } from 'viem/actions'
import { describe, expect, test } from 'vitest'
import { chain, client, fundAddress } from '../../test/tempo/config.js'
import { KeyAuthorization, MultisigConfig, SignatureEnvelope } from './index.js'
import * as Transaction from './Transaction.js'
import * as TransactionReceipt from './TransactionReceipt.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const chainId = chain.id

describe('behavior: multisig (TIP-1061)', () => {
  function setup(parameters: { count: number; threshold: number }) {
    const { count, threshold } = parameters
    const ownerKeys = Array.from({ length: count }, () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      return { address, privateKey } as const
    })

    const genesisConfig = MultisigConfig.from({
      salt: Hex.random(32),
      threshold,
      owners: ownerKeys.map((key) => ({
        owner: key.address,
        weight: 1,
      })),
    })
    const account = MultisigConfig.getAddress(genesisConfig)

    return { account, genesisConfig, ownerKeys } as const
  }

  function approve(parameters: {
    genesisConfig: MultisigConfig.Config
    payload: Hex.Hex
    signers: readonly { privateKey: Hex.Hex }[]
  }) {
    const { genesisConfig, payload, signers } = parameters
    const digest = MultisigConfig.getSignPayload({ payload, genesisConfig })
    const signatures = signers.map((signer) =>
      SignatureEnvelope.from(
        Secp256k1.sign({ payload: digest, privateKey: signer.privateKey }),
      ),
    )
    // The node requires approvals ordered by recovered owner address.
    return SignatureEnvelope.sortMultisigApprovals({
      genesisConfig,
      payload,
      signatures,
    })
  }

  test('behavior: bootstrap + spend (2-of-3 secp256k1)', async () => {
    const { account, genesisConfig, ownerKeys } = setup({
      count: 3,
      threshold: 2,
    })

    await fundAddress(client, { address: account })

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const bootstrap_signed = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        init: true,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(bootstrap),
          signers: [ownerKeys[0]!, ownerKeys[1]!],
        }),
      }),
    })

    const bootstrap_receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [bootstrap_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(bootstrap_receipt).toBeDefined()
    expect(bootstrap_receipt.status).toBe('success')
    expect(bootstrap_receipt.from).toBe(account)

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [bootstrap_receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()
      expect(response.from).toBe(account)
      expect(response.signature?.type).toBe('multisig')
      expect(
        (response.signature as SignatureEnvelope.Multisig | undefined)?.init,
      ).toEqual(genesisConfig)
    }

    const nonce = await getTransactionCount(client, {
      address: account,
      blockTag: 'pending',
    })

    const spend = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: BigInt(nonce),
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const spend_signed = TxEnvelopeTempo.serialize(spend, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(spend),
          signers: [ownerKeys[1]!, ownerKeys[2]!],
        }),
      }),
    })

    const spend_receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [spend_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(spend_receipt).toBeDefined()
    expect(spend_receipt.status).toBe('success')
    expect(spend_receipt.from).toBe(account)
  })

  test('behavior: nested multisig owner', async () => {
    const child = setup({ count: 1, threshold: 1 })
    await fundAddress(client, { address: child.account })

    const childBootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const childBootstrapSigned = TxEnvelopeTempo.serialize(childBootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig: child.genesisConfig,
        init: true,
        signatures: approve({
          genesisConfig: child.genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(childBootstrap),
          signers: child.ownerKeys,
        }),
      }),
    })
    const childReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [childBootstrapSigned],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(childReceipt.status).toBe('success')

    const genesisConfig = MultisigConfig.from({
      salt: Hex.random(32),
      threshold: 1,
      owners: [{ owner: child.account, weight: 1 }],
    })
    const account = MultisigConfig.getAddress(genesisConfig)
    await fundAddress(client, { address: account })

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const digest = MultisigConfig.getSignPayload({
      genesisConfig,
      payload: TxEnvelopeTempo.getSignPayload(bootstrap),
    })
    const nested = SignatureEnvelope.from({
      genesisConfig: child.genesisConfig,
      signatures: approve({
        genesisConfig: child.genesisConfig,
        payload: digest,
        signers: child.ownerKeys,
      }),
    })
    const bootstrapSigned = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        init: true,
        signatures: [nested],
      }),
    })

    const receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [bootstrapSigned],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(receipt.status).toBe('success')
    expect(receipt.from).toBe(account)
  })

  test('behavior: rejects below-threshold approvals', async () => {
    const { account, genesisConfig, ownerKeys } = setup({
      count: 3,
      threshold: 2,
    })

    await fundAddress(client, { address: account })

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const serialized_signed = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        init: true,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(bootstrap),
          signers: [ownerKeys[0]!],
        }),
      }),
    })

    await expect(
      client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      }),
    ).rejects.toThrow()
  })

  test('behavior: keychain access key (authorize, spend, reject config update)', async () => {
    const { account, genesisConfig, ownerKeys } = setup({
      count: 2,
      threshold: 2,
    })

    await fundAddress(client, { address: account })

    const access = (() => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      return { address, privateKey } as const
    })()

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const bootstrap_signed = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        init: true,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(bootstrap),
          signers: ownerKeys,
        }),
      }),
    })

    const bootstrap_receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [bootstrap_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(bootstrap_receipt.status).toBe('success')

    // Multisig accounts authorize access keys through AccountKeychain.
    const authorizeKey = AbiFunction.from(
      'function authorizeKey(address keyId, uint8 signatureType, (uint64 expiry, bool enforceLimits, (address token, uint256 amount, uint64 period)[] limits, bool allowAnyCalls, (address target, (bytes4 selector, address[] recipients)[] selectorRules)[] allowedCalls) config)',
    )

    const authorize = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0xaaaaaaaa00000000000000000000000000000000',
          data: AbiFunction.encodeData(authorizeKey, [
            access.address,
            0, // secp256k1
            {
              expiry: 18446744073709551615n, // u64 max (never expires)
              enforceLimits: false,
              limits: [],
              allowAnyCalls: true,
              allowedCalls: [],
            },
          ]),
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 1n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const authorize_signed = TxEnvelopeTempo.serialize(authorize, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(authorize),
          signers: ownerKeys,
        }),
      }),
    })

    const authorize_receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [authorize_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(authorize_receipt.status).toBe('success')
    expect(authorize_receipt.from).toBe(account)

    const nonce = await getTransactionCount(client, {
      address: account,
      blockTag: 'pending',
    })

    const spend = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: BigInt(nonce),
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const spend_signature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(spend, { from: account }),
      privateKey: access.privateKey,
    })

    const spend_signed = TxEnvelopeTempo.serialize(spend, {
      signature: SignatureEnvelope.from({
        userAddress: account,
        inner: SignatureEnvelope.from(spend_signature),
        type: 'keychain',
      }),
    })

    const spend_receipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [spend_signed],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(spend_receipt.status).toBe('success')
    expect(spend_receipt.from).toBe(account)

    {
      const response = await client
        .request({
          method: 'eth_getTransactionByHash',
          params: [spend_receipt.transactionHash],
        })
        .then((tx) => Transaction.fromRpc(tx as any))
      if (!response) throw new Error()
      expect(response.from).toBe(account)
      expect(response.signature?.type).toBe('keychain')
      expect(
        (response.signature as SignatureEnvelope.Keychain | undefined)
          ?.userAddress,
      ).toBe(account)
    }

    const updateMultisigConfig = AbiFunction.from(
      'function updateMultisigConfig(uint8 threshold, (address owner, uint8 weight)[] owners)',
    )
    const updateNonce = await getTransactionCount(client, {
      address: account,
      blockTag: 'pending',
    })
    const update = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0xaacc000000000000000000000000000000000000',
          data: AbiFunction.encodeData(updateMultisigConfig, [
            genesisConfig.threshold,
            genesisConfig.owners,
          ]),
        },
      ],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: BigInt(updateNonce),
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const updateSignature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(update, { from: account }),
      privateKey: access.privateKey,
    })
    const updateSigned = TxEnvelopeTempo.serialize(update, {
      signature: SignatureEnvelope.from({
        userAddress: account,
        inner: SignatureEnvelope.from(updateSignature),
        type: 'keychain',
      }),
    })

    const updateReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [updateSigned],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(updateReceipt.status).toBe('reverted')
  })

  test('behavior: rejects owner-signed `keyAuthorization` executed by multisig during bootstrap', async () => {
    const { account, genesisConfig, ownerKeys } = setup({
      count: 1,
      threshold: 1,
    })

    await fundAddress(client, { address: account })

    const access = (() => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      return { address, privateKey } as const
    })()

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'secp256k1',
    })
    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(
        Secp256k1.sign({
          payload: KeyAuthorization.getSignPayload(keyAuth),
          privateKey: ownerKeys[0]!.privateKey,
        }),
      ),
    })

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const serialized_signed = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        genesisConfig,
        init: true,
        signatures: approve({
          genesisConfig,
          payload: TxEnvelopeTempo.getSignPayload(bootstrap),
          signers: ownerKeys,
        }),
      }),
    })

    await expect(
      client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      }),
    ).rejects.toThrow(
      'native multisig transactions cannot carry key_authorization',
    )
  })

  test('behavior: rejects owner-signed `keyAuthorization` executed by access key before bootstrap', async () => {
    const { account, ownerKeys } = setup({
      count: 1,
      threshold: 1,
    })

    await fundAddress(client, { address: account })

    const access = (() => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      return { address, privateKey } as const
    })()

    const keyAuth = KeyAuthorization.from({
      address: access.address,
      chainId: BigInt(chainId),
      type: 'secp256k1',
    })
    const keyAuth_signed = KeyAuthorization.from(keyAuth, {
      signature: SignatureEnvelope.from(
        Secp256k1.sign({
          payload: KeyAuthorization.getSignPayload(keyAuth),
          privateKey: ownerKeys[0]!.privateKey,
        }),
      ),
    })

    const bootstrap = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuth_signed,
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getSignPayload(bootstrap, { from: account }),
      privateKey: access.privateKey,
    })
    const serialized_signed = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        userAddress: account,
        inner: SignatureEnvelope.from(signature),
        type: 'keychain',
      }),
    })

    await expect(
      client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized_signed],
      }),
    ).rejects.toThrow('admin-signed key authorization account mismatch')
  })
})
