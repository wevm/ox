import { AbiFunction, Address, Hex, Secp256k1, Value } from 'ox'
import { getTransactionCount } from 'viem/actions'
import { describe, expect, test } from 'vitest'
import { chain, client, fundAddress } from '../../test/tempo/config.js'
import { KeyAuthorization, MultisigConfig, SignatureEnvelope } from './index.js'
import * as Transaction from './Transaction.js'
import * as TransactionReceipt from './TransactionReceipt.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const chainId = chain.id
const updateConfig = AbiFunction.from(
  'function updateConfig(uint8 threshold, (address owner, uint8 weight)[] owners)',
)

describe('behavior: multisig (TIP-1061)', () => {
  function createKey() {
    const privateKey = Secp256k1.randomPrivateKey()
    const address = Address.fromPublicKey(
      Secp256k1.getPublicKey({ privateKey }),
    )
    return { address, privateKey } as const
  }

  function setup(parameters: {
    count: number
    threshold: number
    weights?: readonly number[] | undefined
  }) {
    const { count, threshold, weights = Array(count).fill(1) } = parameters
    const ownerKeys = Array.from({ length: count }, () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      return { address, privateKey } as const
    }).sort((a, b) => a.address.localeCompare(b.address))

    const initialConfig = MultisigConfig.from({
      salt: Hex.random(32),
      threshold,
      owners: ownerKeys.map((key, index) => ({
        owner: key.address,
        weight: weights[index]!,
      })),
    })
    const account = MultisigConfig.getAddress(initialConfig)

    return { account, initialConfig, ownerKeys } as const
  }

  function approve(parameters: {
    initialConfig: MultisigConfig.Config
    payload: Hex.Hex
    signers: readonly { privateKey: Hex.Hex }[]
    version?: bigint | undefined
  }) {
    const { initialConfig, payload, signers, version = 0n } = parameters
    const digest = MultisigConfig.getSignPayload({
      payload,
      initialConfig,
      version,
    })
    const signatures = signers.map((signer) =>
      SignatureEnvelope.from(
        Secp256k1.sign({ payload: digest, privateKey: signer.privateKey }),
      ),
    )
    // The node requires approvals ordered by recovered owner address.
    return SignatureEnvelope.sortMultisigApprovals({
      initialConfig,
      payload,
      signatures,
      version,
    })
  }

  function multisigSignature(parameters: {
    initialConfig: MultisigConfig.Config
    payload: Hex.Hex
    signers: readonly { privateKey: Hex.Hex }[]
    init?: boolean | undefined
    version?: bigint | undefined
  }) {
    const { init = false, ...approval } = parameters
    return SignatureEnvelope.from({
      initialConfig: parameters.initialConfig,
      ...(init ? { init: true } : {}),
      signatures: approve(approval),
    })
  }

  async function send(serialized: Hex.Hex) {
    return (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized],
      })
      .then((transaction) => TransactionReceipt.fromRpc(transaction as any)))!
  }

  async function bootstrap(multisig: ReturnType<typeof setup>) {
    await fundAddress(client, { address: multisig.account })
    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const receipt = await send(
      TxEnvelopeTempo.serialize(transaction, {
        signature: multisigSignature({
          initialConfig: multisig.initialConfig,
          init: true,
          payload: TxEnvelopeTempo.getSignPayload(transaction),
          signers: multisig.ownerKeys,
        }),
      }),
    )
    expect(receipt.status).toBe('success')
  }

  function accessKeySignature(parameters: {
    accessKey: { privateKey: Hex.Hex }
    account: Address.Address
    transaction: TxEnvelopeTempo.TxEnvelopeTempo
  }) {
    const { accessKey, account, transaction } = parameters
    return SignatureEnvelope.from({
      inner: SignatureEnvelope.from(
        Secp256k1.sign({
          payload: TxEnvelopeTempo.getSignPayload(transaction, {
            from: account,
          }),
          privateKey: accessKey.privateKey,
        }),
      ),
      type: 'keychain',
      userAddress: account,
    })
  }

  test('examples: bootstrap, initialized, and configuration rotation', async () => {
    const { account, initialConfig, ownerKeys } = setup({
      count: 3,
      threshold: 2,
    })
    const replacement = createKey()
    const rotatedConfig = MultisigConfig.from({
      salt: initialConfig.salt,
      threshold: 1,
      owners: [{ owner: replacement.address, weight: 1 }],
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
        initialConfig,
        init: true,
        signatures: approve({
          initialConfig,
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
      ).toEqual(initialConfig)
    }

    const updateNonce = await getTransactionCount(client, {
      address: account,
      blockTag: 'pending',
    })
    const update = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0xaacc000000000000000000000000000000000000',
          data: AbiFunction.encodeData(updateConfig, [
            rotatedConfig.threshold,
            rotatedConfig.owners,
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
    const updateSigned = TxEnvelopeTempo.serialize(update, {
      signature: SignatureEnvelope.from({
        initialConfig,
        signatures: approve({
          initialConfig,
          payload: TxEnvelopeTempo.getSignPayload(update),
          signers: [ownerKeys[0]!, ownerKeys[1]!],
        }),
      }),
    })
    const updateReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [updateSigned],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(updateReceipt.status).toBe('success')

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
        initialConfig,
        signatures: approve({
          initialConfig,
          payload: TxEnvelopeTempo.getSignPayload(spend),
          signers: [replacement],
          version: 1n,
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

  test('example: nested ownership', async () => {
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
        initialConfig: child.initialConfig,
        init: true,
        signatures: approve({
          initialConfig: child.initialConfig,
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

    const initialConfig = MultisigConfig.from({
      salt: Hex.random(32),
      threshold: 1,
      owners: [{ owner: child.account, weight: 1 }],
    })
    const account = MultisigConfig.getAddress(initialConfig)
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
      initialConfig,
      payload: TxEnvelopeTempo.getSignPayload(bootstrap),
    })
    const nested = SignatureEnvelope.from({
      initialConfig: child.initialConfig,
      signatures: approve({
        initialConfig: child.initialConfig,
        payload: digest,
        signers: child.ownerKeys,
      }),
    })
    const bootstrapSigned = TxEnvelopeTempo.serialize(bootstrap, {
      signature: SignatureEnvelope.from({
        initialConfig,
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

    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 1n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const parentDigest = MultisigConfig.getSignPayload({
      initialConfig,
      payload: TxEnvelopeTempo.getSignPayload(transaction),
    })
    const childSignature = multisigSignature({
      initialConfig: child.initialConfig,
      payload: parentDigest,
      signers: child.ownerKeys,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction, {
      signature: SignatureEnvelope.from({
        initialConfig,
        signatures: [childSignature],
      }),
    })
    const nestedReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialized],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(nestedReceipt.status).toBe('success')
    expect(nestedReceipt.from).toBe(account)
  })

  test('example: fee sponsorship (owners sign first)', async () => {
    const multisig = setup({ count: 2, threshold: 2 })
    const feePayer = createKey()
    await Promise.all([
      bootstrap(multisig),
      fundAddress(client, { address: feePayer.address }),
    ])

    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feePayerSignature: null,
      nonce: 1n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const signedByOwners = TxEnvelopeTempo.from(transaction, {
      signature: multisigSignature({
        initialConfig: multisig.initialConfig,
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        signers: multisig.ownerKeys,
      }),
    })
    const sponsored = TxEnvelopeTempo.from({
      ...signedByOwners,
      feeToken: '0x20c0000000000000000000000000000000000001',
    })
    const feePayerSignature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getFeePayerSignPayload(sponsored, {
        sender: multisig.account,
      }),
      privateKey: feePayer.privateKey,
    })
    const receipt = await send(
      TxEnvelopeTempo.serialize(sponsored, { feePayerSignature }),
    )
    expect(receipt.status).toBe('success')
    expect(receipt.from).toBe(multisig.account)
    expect(receipt.feePayer).toBe(feePayer.address)
  })

  test('example: fee sponsorship (fee payer signs first)', async () => {
    const multisig = setup({ count: 2, threshold: 2 })
    const feePayer = createKey()
    await Promise.all([
      bootstrap(multisig),
      fundAddress(client, { address: feePayer.address }),
    ])

    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feePayerSignature: null,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 1n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const feePayerSignature = Secp256k1.sign({
      payload: TxEnvelopeTempo.getFeePayerSignPayload(transaction, {
        sender: multisig.account,
      }),
      privateKey: feePayer.privateKey,
    })
    const sponsored = TxEnvelopeTempo.from(transaction, { feePayerSignature })
    const receipt = await send(
      TxEnvelopeTempo.serialize(sponsored, {
        signature: multisigSignature({
          initialConfig: multisig.initialConfig,
          payload: TxEnvelopeTempo.getSignPayload(sponsored),
          signers: multisig.ownerKeys,
        }),
      }),
    )
    expect(receipt.status).toBe('success')
    expect(receipt.from).toBe(multisig.account)
    expect(receipt.feePayer).toBe(feePayer.address)
  })

  test('example: weighted quorum', async () => {
    const { account, initialConfig, ownerKeys } = setup({
      count: 3,
      threshold: 3,
      weights: [2, 1, 1],
    })

    await fundAddress(client, { address: account })

    const transaction = (nonce: bigint) =>
      TxEnvelopeTempo.from({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId,
        feeToken: '0x20c0000000000000000000000000000000000001',
        nonce,
        gas: 5_000_000n,
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })
    const serialize = (
      value: ReturnType<typeof transaction>,
      signers: readonly { privateKey: Hex.Hex }[],
      init = false,
    ) =>
      TxEnvelopeTempo.serialize(value, {
        signature: multisigSignature({
          initialConfig,
          init,
          payload: TxEnvelopeTempo.getSignPayload(value),
          signers,
        }),
      })

    const bootstrap = transaction(0n)
    const bootstrapReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialize(bootstrap, [ownerKeys[0]!, ownerKeys[1]!], true)],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(bootstrapReceipt.status).toBe('success')

    const valid = transaction(1n)
    const validReceipt = (await client
      .request({
        method: 'eth_sendRawTransactionSync',
        params: [serialize(valid, [ownerKeys[0]!, ownerKeys[2]!])],
      })
      .then((tx) => TransactionReceipt.fromRpc(tx as any)))!
    expect(validReceipt.status).toBe('success')

    const belowThreshold = transaction(2n)
    await expect(
      client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialize(belowThreshold, [ownerKeys[1]!, ownerKeys[2]!])],
      }),
    ).rejects.toThrow()

    await expect(
      client.request({
        method: 'eth_sendRawTransactionSync',
        params: [serialize(belowThreshold, ownerKeys)],
      }),
    ).rejects.toThrow()
  })

  test('behavior: keychain access key (authorize, spend, reject config update)', async () => {
    const { account, initialConfig, ownerKeys } = setup({
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
        initialConfig,
        init: true,
        signatures: approve({
          initialConfig,
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
        initialConfig,
        signatures: approve({
          initialConfig,
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

    const updateNonce = await getTransactionCount(client, {
      address: account,
      blockTag: 'pending',
    })
    const update = TxEnvelopeTempo.from({
      calls: [
        {
          to: '0xaacc000000000000000000000000000000000000',
          data: AbiFunction.encodeData(updateConfig, [
            initialConfig.threshold,
            initialConfig.owners,
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

  test('example: bootstrap and immediate access key use', async () => {
    const multisig = setup({ count: 2, threshold: 2 })
    const accessKey = createKey()
    await fundAddress(client, { address: multisig.account })

    const keyAuthorization = KeyAuthorization.from({
      account: multisig.account,
      address: accessKey.address,
      chainId: BigInt(chainId),
      isAdmin: false,
      type: 'secp256k1',
    })
    const keyAuthorizationSigned = KeyAuthorization.from(keyAuthorization, {
      signature: multisigSignature({
        initialConfig: multisig.initialConfig,
        init: true,
        payload: KeyAuthorization.getSignPayload(keyAuthorization),
        signers: multisig.ownerKeys,
      }),
    })
    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuthorizationSigned,
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const receipt = await send(
      TxEnvelopeTempo.serialize(transaction, {
        signature: accessKeySignature({
          accessKey,
          account: multisig.account,
          transaction,
        }),
      }),
    )
    expect(receipt.status).toBe('success')
    expect(receipt.from).toBe(multisig.account)
  })

  test('example: bootstrap and subsequent access key use', async () => {
    const multisig = setup({ count: 2, threshold: 2 })
    const accessKey = createKey()
    await fundAddress(client, { address: multisig.account })

    const keyAuthorization = KeyAuthorization.from({
      account: multisig.account,
      address: accessKey.address,
      chainId: BigInt(chainId),
      isAdmin: false,
      type: 'secp256k1',
    })
    const keyAuthorizationSigned = KeyAuthorization.from(keyAuthorization, {
      signature: multisigSignature({
        initialConfig: multisig.initialConfig,
        payload: KeyAuthorization.getSignPayload(keyAuthorization),
        signers: multisig.ownerKeys,
      }),
    })
    const bootstrapTransaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      keyAuthorization: keyAuthorizationSigned,
      nonce: 0n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const bootstrapReceipt = await send(
      TxEnvelopeTempo.serialize(bootstrapTransaction, {
        signature: multisigSignature({
          initialConfig: multisig.initialConfig,
          init: true,
          payload: TxEnvelopeTempo.getSignPayload(bootstrapTransaction),
          signers: multisig.ownerKeys,
        }),
      }),
    )
    expect(bootstrapReceipt.status).toBe('success')

    const transaction = TxEnvelopeTempo.from({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId,
      feeToken: '0x20c0000000000000000000000000000000000001',
      nonce: 1n,
      gas: 5_000_000n,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })
    const receipt = await send(
      TxEnvelopeTempo.serialize(transaction, {
        signature: accessKeySignature({
          accessKey,
          account: multisig.account,
          transaction,
        }),
      }),
    )
    expect(receipt.status).toBe('success')
    expect(receipt.from).toBe(multisig.account)
  })
})
