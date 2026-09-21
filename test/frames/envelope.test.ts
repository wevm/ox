import {
  Address,
  Blobs,
  Frame,
  FrameSignature,
  P256,
  RpcTransport,
  Secp256k1,
  TxEnvelopeEip8141,
} from 'ox'
import { Setups } from 'ox/trusted-setups'
import { Kzg } from 'ox/wasm'
import { expect, test } from 'vite-plus/test'
import { accounts } from '../constants/accounts.js'
import { rpcUrl } from './prool.js'

const rpc = RpcTransport.fromHttp(rpcUrl)

type Receipt = { frameReceipts: { status: number }[]; payer: Address.Address }

async function prepare(frames: readonly Frame.Frame[], sponsored = false) {
  return TxEnvelopeEip8141.from({
    chainId: 8141,
    frames,
    maxFeePerGas: 10_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
    nonce: BigInt(
      await rpc.request({
        method: 'eth_getTransactionCount',
        params: [accounts[0].address, 'latest'],
      }),
    ),
    sender: accounts[0].address,
    signatures: [
      FrameSignature.from({ scheme: 'secp256k1' }),
      ...(sponsored
        ? [
            FrameSignature.from({
              scheme: 'secp256k1',
              signer: accounts[1].address,
            }),
          ]
        : []),
    ],
  })
}

function sign(envelope: TxEnvelopeEip8141.TxEnvelopeEip8141) {
  const payload = TxEnvelopeEip8141.getSignPayload(envelope)
  return TxEnvelopeEip8141.from({
    ...envelope,
    signatures: envelope.signatures!.map((entry, index) =>
      FrameSignature.fromSecp256k1(
        Secp256k1.sign({ payload, privateKey: accounts[index]!.privateKey }),
        { signer: entry.signer },
      ),
    ),
  })
}

async function submit(envelope: TxEnvelopeEip8141.TxEnvelopeEip8141) {
  const hash = await rpc.request({
    method: 'eth_sendRawTransaction',
    params: [TxEnvelopeEip8141.serialize(envelope)],
  })
  expect(hash).toBe(TxEnvelopeEip8141.hash(envelope))
  await expect
    .poll(
      () =>
        rpc.request({ method: 'eth_getTransactionReceipt', params: [hash] }),
      { timeout: 30_000 },
    )
    .not.toBeNull()
  return (await rpc.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  })) as unknown as Receipt
}

const approval = {
  flags: 'approveExecutionAndPayment',
  gas: 50_000n,
  mode: 'verify',
} as const

test('signs, submits, and mines a sender-paid frame transaction', async () => {
  const target = accounts[1].address
  const before = BigInt(
    await rpc.request({ method: 'eth_getBalance', params: [target, 'latest'] }),
  )
  const receipt = await submit(
    sign(
      await prepare([
        approval,
        { gas: 50_000n, mode: 'sender', target, value: 1n },
      ]),
    ),
  )
  expect(receipt.payer.toLowerCase()).toBe(accounts[0].address.toLowerCase())
  expect(receipt.frameReceipts.map((frame) => frame.status)).toEqual([1, 1])
  expect(
    BigInt(
      await rpc.request({
        method: 'eth_getBalance',
        params: [target, 'latest'],
      }),
    ),
  ).toBe(before + 1n)
})

test('charges a separate sponsor', async () => {
  const senderBefore = BigInt(
    await rpc.request({
      method: 'eth_getBalance',
      params: [accounts[0].address, 'latest'],
    }),
  )
  const payerBefore = BigInt(
    await rpc.request({
      method: 'eth_getBalance',
      params: [accounts[1].address, 'latest'],
    }),
  )
  const receipt = await submit(
    sign(
      await prepare(
        [
          { flags: 'approveExecution', gas: 50_000n, mode: 'verify' },
          {
            flags: 'approvePayment',
            gas: 50_000n,
            mode: 'verify',
            target: accounts[1].address,
          },
          {
            gas: 50_000n,
            mode: 'sender',
            target: accounts[1].address,
            value: 1n,
          },
        ],
        true,
      ),
    ),
  )
  expect(receipt.payer.toLowerCase()).toBe(accounts[1].address.toLowerCase())
  expect(
    BigInt(
      await rpc.request({
        method: 'eth_getBalance',
        params: [accounts[0].address, 'latest'],
      }),
    ),
  ).toBe(senderBefore - 1n)
  expect(
    BigInt(
      await rpc.request({
        method: 'eth_getBalance',
        params: [accounts[1].address, 'latest'],
      }),
    ),
  ).toBeLessThan(payerBefore)
})

test('rolls back an atomic batch and skips its remaining frames', async () => {
  const before = await rpc.request({
    method: 'eth_getBalance',
    params: [accounts[1].address, 'latest'],
  })
  const receipt = await submit(
    sign(
      await prepare([
        approval,
        {
          flags: 'atomicBatch',
          gas: 50_000n,
          mode: 'sender',
          target: accounts[1].address,
          value: 1n,
        },
        {
          flags: 'atomicBatch',
          gas: 50_000n,
          mode: 'sender',
          target: '0x0000000000000000000000000000000000001000',
        },
        {
          gas: 50_000n,
          mode: 'sender',
          target: accounts[1].address,
          value: 2n,
        },
      ]),
    ),
  )
  expect(receipt.frameReceipts.map((frame) => frame.status)).toEqual([
    1, 1, 0, 2,
  ])
  expect(
    await rpc.request({
      method: 'eth_getBalance',
      params: [accounts[1].address, 'latest'],
    }),
  ).toBe(before)
})

test('rejects a signature from the wrong sender', async () => {
  const envelope = await prepare([approval])
  const signature = Secp256k1.sign({
    payload: TxEnvelopeEip8141.getSignPayload(envelope),
    privateKey: accounts[1].privateKey,
  })
  await expect(
    rpc.request({
      method: 'eth_sendRawTransaction',
      params: [
        TxEnvelopeEip8141.serialize({
          ...envelope,
          signatures: [FrameSignature.fromSecp256k1(signature)],
        }),
      ],
    }),
  ).rejects.toThrow(/signer does not match the recovered address/i)
})

test('rejects an expired transaction', async () => {
  const envelope = sign(
    await prepare([
      {
        data: '0x0000000000000001',
        gas: 50_000n,
        mode: 'verify',
        target: '0x0000000000000000000000000000000000008141',
      },
      approval,
    ]),
  )
  await expect(
    rpc.request({
      method: 'eth_sendRawTransaction',
      params: [TxEnvelopeEip8141.serialize(envelope)],
    }),
  ).rejects.toThrow(/expir|valid|revert/i)
})

test('authorizes P-256 through signature introspection', async () => {
  const privateKey = accounts[0].privateKey
  const publicKey = P256.getPublicKey({ privateKey })
  const sender = Address.fromPublicKey(publicKey)
  // Genesis verifier checks SIGPARAM signer, scheme, and payload before APPROVE(3).
  const envelope = TxEnvelopeEip8141.from({
    chainId: 8141,
    frames: [
      approval,
      { gas: 50_000n, mode: 'sender', target: accounts[1].address, value: 1n },
    ],
    maxFeePerGas: 10_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
    nonce: BigInt(
      await rpc.request({
        method: 'eth_getTransactionCount',
        params: [sender, 'latest'],
      }),
    ),
    sender,
    signatures: [FrameSignature.from({ scheme: 'p256' })],
  })
  const signature = P256.sign({
    payload: TxEnvelopeEip8141.getSignPayload(envelope),
    privateKey,
  })
  const before = BigInt(
    await rpc.request({
      method: 'eth_getBalance',
      params: [accounts[1].address, 'latest'],
    }),
  )
  const receipt = await submit({
    ...envelope,
    signatures: [FrameSignature.fromP256(signature, { publicKey })],
  })
  expect(receipt.frameReceipts.map((frame) => frame.status)).toEqual([1, 1])
  expect(
    BigInt(
      await rpc.request({
        method: 'eth_getBalance',
        params: [accounts[1].address, 'latest'],
      }),
    ),
  ).toBe(before + 1n)
})

// TODO: enable once the NethDev harness mines blob-carrying frame transactions.
test.skip('submits a PeerDAS blob wrapper and retrieves the mined body', async () => {
  const kzg = await Kzg.create({ trustedSetup: Setups.mainnet })
  try {
    const blobs = Blobs.from('0xdeadbeef')
    const commitments = Blobs.toCommitments(blobs, { kzg })
    const envelope = sign(
      TxEnvelopeEip8141.from({
        ...(await prepare([approval])),
        blobVersionedHashes: Blobs.commitmentsToVersionedHashes(commitments),
        maxFeePerBlobGas: 1_000_000_000n,
        sidecars: {
          blobs,
          cellProofs: Blobs.toCellProofs(blobs, { kzg }),
          commitments,
        },
      }),
    )
    await submit(envelope)
    const transaction = await rpc.request({
      method: 'eth_getTransactionByHash',
      params: [TxEnvelopeEip8141.hash(envelope)],
    })
    expect(transaction?.blobVersionedHashes).toEqual(
      envelope.blobVersionedHashes,
    )
  } finally {
    kzg.dispose()
  }
})
