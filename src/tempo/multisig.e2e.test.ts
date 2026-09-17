import { AbiFunction, Address, Hex, Secp256k1, Value } from 'ox'
import { describe, expect, test } from 'vitest'
import { chain, client, fundAddress } from '../../test/tempo/config.js'
import { factory } from '../../test/tempo/multisig.js'
import {
  KeyAuthorization,
  MultisigConfig,
  MultisigOperation,
  SignatureEnvelope,
} from './index.js'
import * as Transaction from './Transaction.js'
import * as TransactionReceipt from './TransactionReceipt.js'
import * as TransactionRequest from './TransactionRequest.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const precompile = '0xaacc000000000000000000000000000000000000'
const updateConfig = AbiFunction.from(
  'function updateConfig((bytes32 salt, uint64 version, uint8 threshold, (address owner, uint8 weight)[] owners) current, uint8 threshold, (address owner, uint8 weight)[] owners)',
)

async function setup() {
  const keys = Array.from({ length: 3 }, () => {
    const privateKey = Secp256k1.randomPrivateKey()
    return {
      privateKey,
      address: Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey })),
    }
  })
  const config: MultisigConfig.Config = MultisigConfig.from({
    salt: Hex.random(32),
    threshold: 2,
    owners: keys.map((key) => ({ owner: key.address, weight: 1 })),
  })
  const account = MultisigConfig.getAddress(config, { factory })
  await fundAddress(client, { address: account })
  return { account, config, keys }
}

function transaction(
  nonce: bigint,
  calls: TxEnvelopeTempo.TxEnvelopeTempo['calls'] = [
    { to: '0x0000000000000000000000000000000000000000' },
  ],
) {
  return TxEnvelopeTempo.from({
    calls,
    chainId: chain.id,
    feeToken: '0x20c0000000000000000000000000000000000001',
    nonce,
    gas: 5_000_000n,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })
}

function sign(account: Awaited<ReturnType<typeof setup>>, payload: Hex.Hex) {
  const value = {
    account: account.account,
    config: account.config,
    payload,
  }
  const digest = MultisigConfig.getSignPayload(value)
  return SignatureEnvelope.from({
    account: account.account,
    config: account.config,
    signatures: SignatureEnvelope.sortMultisigApprovals({
      ...value,
      signatures: account.keys
        .slice(0, 2)
        .map((key) =>
          SignatureEnvelope.from(
            Secp256k1.sign({ payload: digest, privateKey: key.privateKey }),
          ),
        ),
    }),
  })
}

async function submit(
  tx: TxEnvelopeTempo.TxEnvelopeTempo,
  signature: SignatureEnvelope.SignatureEnvelope,
) {
  const result = await client.request({
    method: 'eth_sendRawTransactionSync',
    params: [TxEnvelopeTempo.serialize(tx, { signature })],
  })
  return TransactionReceipt.fromRpc(result as unknown as TransactionReceipt.Rpc)
}

describe('behavior: configurable accounts', () => {
  test('registers, spends, and round-trips the RPC signature', async () => {
    const account = await setup()
    for (const nonce of [0n, 1n]) {
      const tx = transaction(nonce)
      const signature = sign(account, TxEnvelopeTempo.getSignPayload(tx))
      const receipt = await submit(tx, signature)
      expect(receipt.status).toMatchInlineSnapshot('"success"')
      expect(receipt.from).toBe(account.account)
      const rpc = await client.request({
        method: 'eth_getTransactionByHash',
        params: [receipt.transactionHash],
      })
      const returned = Transaction.fromRpc(rpc as unknown as Transaction.Rpc)
      expect(returned.signature).toEqual(signature)
    }
  })

  test('selects operation approvals and submits the serialized transaction', async () => {
    const account = await setup()
    const tx = transaction(0n)
    const serialized = TxEnvelopeTempo.serialize(tx)
    const hash = MultisigOperation.getHash({
      account: account.account,
      config: account.config,
      transaction: serialized,
      type: 'transaction',
    })
    const selected = await MultisigOperation.selectApprovals({
      account: account.account,
      approvals: account.keys.map(({ privateKey }) =>
        SignatureEnvelope.serialize(
          SignatureEnvelope.from(Secp256k1.sign({ payload: hash, privateKey })),
        ),
      ),
      config: account.config,
      hash,
    })
    const operation = MultisigOperation.from({
      account: account.account,
      approvals: selected.approvals,
      config: account.config,
      createdAt: 1,
      hash,
      signatureCount: selected.signatureCount,
      status: 'pending',
      threshold: selected.threshold,
      transaction: serialized,
      type: 'transaction',
      updatedAt: 1,
      weight: selected.weight,
    })
    const signed = MultisigOperation.serializeTransaction(operation, {
      approvals: selected.selectedApprovals,
    })
    const result = await client.request({
      method: 'eth_sendRawTransactionSync',
      params: [signed],
    })
    const receipt = TransactionReceipt.fromRpc(
      result as unknown as TransactionReceipt.Rpc,
    )
    expect(receipt.status).toMatchInlineSnapshot('"success"')
    expect(receipt.from).toBe(account.account)
  })

  test('simulates registration with the full config without persisting it', async () => {
    const account = await setup()
    const data = AbiFunction.encodeData(
      AbiFunction.from(
        'function getConfigCommitment(address account) view returns (bytes32)',
      ),
      [account.account],
    )
    const request = TransactionRequest.toRpc({
      from: account.account,
      to: precompile,
      data,
      gas: 5_000_000n,
      feeToken: '0x20c0000000000000000000000000000000000001',
      multisigSimulation: {
        config: account.config,
        approvals: account.config.owners
          .slice(0, 2)
          .map(({ owner }) => ({ owner, keyType: 'secp256k1' })),
      },
    })
    const simulated = await client.request({
      method: 'eth_call',
      params: [request as never, 'latest'],
    })
    expect(simulated).not.toBe(MultisigConfig.zeroSalt)
    const estimate = await client.request({
      method: 'eth_estimateGas',
      params: [request as never],
    })
    expect(Hex.toBigInt(estimate)).toBeGreaterThan(0n)
    const persisted = await client.request({
      method: 'eth_call',
      params: [{ to: precompile, data }, 'latest'],
    })
    expect(persisted).toBe(MultisigConfig.zeroSalt)
    const tx = transaction(0n)
    await submit(tx, sign(account, TxEnvelopeTempo.getSignPayload(tx)))
    expect(
      await client.request({
        method: 'eth_call',
        params: [{ to: precompile, data }, 'latest'],
      }),
    ).toBe(simulated)
  })

  test('rotates config and rejects stale witnesses and signatures', async () => {
    const account = await setup()
    const replacement = account
    const tx = transaction(0n, [
      {
        to: precompile,
        data: AbiFunction.encodeData(updateConfig, [
          { ...account.config, salt: account.config.salt!, version: 0n },
          2,
          replacement.config.owners,
        ]),
      },
    ])
    expect(
      (await submit(tx, sign(account, TxEnvelopeTempo.getSignPayload(tx))))
        .status,
    ).toMatchInlineSnapshot('"success"')
    const spend = transaction(1n)
    const old = sign(account, TxEnvelopeTempo.getSignPayload(spend))
    await expect(submit(spend, old)).rejects.toThrow(/commitment mismatch/)
    const rotated = {
      ...replacement,
      account: account.account,
      config: { ...replacement.config, salt: account.config.salt, version: 1n },
    }
    await expect(
      submit(spend, { ...old, config: rotated.config }),
    ).rejects.toThrow()
    expect(
      (
        await submit(
          spend,
          sign(rotated, TxEnvelopeTempo.getSignPayload(spend)),
        )
      ).status,
    ).toMatchInlineSnapshot('"success"')
  })

  test('rejects insufficient approvals without registering the account', async () => {
    const account = await setup()
    const tx = transaction(0n)
    const signature = sign(account, TxEnvelopeTempo.getSignPayload(tx))
    await expect(
      submit(tx, {
        ...signature,
        signatures: signature.signatures.slice(0, 1),
      }),
    ).rejects.toThrow(/threshold|weight|quorum/)
    expect((await submit(tx, signature)).status).toMatchInlineSnapshot(
      '"success"',
    )
  })

  test('authorizes a multisig delegate and preserves the grant after delegate rotation', async () => {
    const parent = await setup()
    const delegate = await setup()
    const grant = KeyAuthorization.from({
      address: delegate.account,
      account: parent.account,
      chainId: BigInt(chain.id),
      type: 'multisig',
    })
    const signed = KeyAuthorization.from(grant, {
      signature: sign(parent, KeyAuthorization.getSignPayload(grant)),
    })
    const tx = { ...transaction(0n), keyAuthorization: signed }
    const signature = SignatureEnvelope.from({
      userAddress: parent.account,
      version: 'v2',
      inner: sign(
        delegate,
        TxEnvelopeTempo.getSignPayload(tx, { from: parent.account }),
      ),
    })
    expect((await submit(tx, signature)).status).toMatchInlineSnapshot(
      '"success"',
    )

    const replacement = await setup()
    const rotation = transaction(0n, [
      {
        to: precompile,
        data: AbiFunction.encodeData(updateConfig, [
          { ...delegate.config, salt: delegate.config.salt!, version: 0n },
          2,
          replacement.config.owners,
        ]),
      },
    ])
    expect(
      (
        await submit(
          rotation,
          sign(delegate, TxEnvelopeTempo.getSignPayload(rotation)),
        )
      ).status,
    ).toMatchInlineSnapshot('"success"')
    const spend = transaction(1n)
    const rotated = {
      ...replacement,
      account: delegate.account,
      config: {
        ...replacement.config,
        salt: delegate.config.salt,
        version: 1n,
      },
    }
    const payload = TxEnvelopeTempo.getSignPayload(spend, {
      from: parent.account,
    })
    await expect(
      submit(
        spend,
        SignatureEnvelope.from({
          userAddress: parent.account,
          version: 'v2',
          inner: sign(delegate, payload),
        }),
      ),
    ).rejects.toThrow(/commitment mismatch/)
    expect(
      (
        await submit(
          spend,
          SignatureEnvelope.from({
            userAddress: parent.account,
            version: 'v2',
            inner: sign(rotated, payload),
          }),
        )
      ).status,
    ).toMatchInlineSnapshot('"success"')
    const unauthorized = transaction(2n, [
      {
        to: precompile,
        data: AbiFunction.encodeData(updateConfig, [
          { ...parent.config, salt: parent.config.salt!, version: 0n },
          1,
          parent.config.owners,
        ]),
      },
    ])
    const unauthorizedSignature = SignatureEnvelope.from({
      userAddress: parent.account,
      version: 'v2',
      inner: sign(
        rotated,
        TxEnvelopeTempo.getSignPayload(unauthorized, { from: parent.account }),
      ),
    })
    expect(
      (await submit(unauthorized, unauthorizedSignature)).status,
    ).toMatchInlineSnapshot('"reverted"')
  })

  test('rejects a grant signed by an individual owner instead of the account quorum', async () => {
    const account = await setup()
    const key = account.keys[0]!
    const grant = KeyAuthorization.from({
      address: key.address,
      account: account.account,
      chainId: BigInt(chain.id),
      type: 'secp256k1',
    })
    const signed = KeyAuthorization.from(grant, {
      signature: Secp256k1.sign({
        payload: KeyAuthorization.getSignPayload(grant),
        privateKey: key.privateKey,
      }),
    })
    const tx = { ...transaction(0n), keyAuthorization: signed }
    await expect(
      submit(tx, sign(account, TxEnvelopeTempo.getSignPayload(tx))),
    ).rejects.toThrow()
  })
})
