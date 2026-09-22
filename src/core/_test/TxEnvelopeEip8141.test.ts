import {
  Address,
  Blobs,
  Frame,
  FrameSignature,
  Hex,
  P256,
  Rlp,
  RpcTransport,
  Secp256k1,
  Transaction,
  TransactionEnvelope,
  TransactionReceipt,
  TransactionRequest,
  TxEnvelopeEip8141,
} from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'
import { accounts } from '../../../test/constants/accounts.js'
import { rpcUrl } from '../../../test/frames/prool.js'

const rpc = RpcTransport.fromHttp(rpcUrl)

test('exports', () => {
  expect(Object.keys(TxEnvelopeEip8141).sort()).toMatchInlineSnapshot(`
    [
      "InvalidError",
      "assert",
      "deserialize",
      "from",
      "fromRpc",
      "getSignPayload",
      "hash",
      "serialize",
      "serializedType",
      "toRpc",
      "type",
      "validate",
    ]
  `)
})

describe('assert', () => {
  test('negative chainId', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: -1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: chainId must be an unsigned 256-bit integer; use bigint for large IDs.]`,
    )
  })

  test('fractional chainId', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1.5,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: chainId must be an unsigned 256-bit integer; use bigint for large IDs.]`,
    )
  })

  test('unsafe numeric chainId', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: Number.MAX_SAFE_INTEGER + 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: chainId must be an unsigned 256-bit integer; use bigint for large IDs.]`,
    )
  })

  test('chainId exceeds 256 bits', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 2n ** 256n,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: chainId must be an unsigned 256-bit integer; use bigint for large IDs.]`,
    )
  })

  test('negative nonce', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        nonce: -1n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: nonce must be an unsigned 64-bit integer.]`,
    )
  })

  test('nonce exceeds 64 bits', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        nonce: 2n ** 64n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: nonce must be an unsigned 64-bit integer.]`,
    )
  })

  test('null nonce', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        nonce: null,
        sender: accounts[0].address,
      } as unknown as TxEnvelopeEip8141.TxEnvelopeEip8141),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: nonce must be an unsigned 64-bit integer.]`,
    )
  })

  test('negative fee cap', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        maxFeePerGas: -1n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: maxFeePerGas must be an unsigned 256-bit integer.]`,
    )
  })

  test('fee cap exceeds 256 bits', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        maxFeePerGas: 2n ** 256n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: maxFeePerGas must be an unsigned 256-bit integer.]`,
    )
  })

  test('tip above fee cap', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        maxPriorityFeePerGas: 1n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: maxPriorityFeePerGas exceeds maxFeePerGas.]`,
    )
  })

  test('blob fee without blobs', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{}],
        maxFeePerBlobGas: 1n,
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: maxFeePerBlobGas must be zero without blobs.]`,
    )
  })

  test('invalid blob hash size', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        blobVersionedHashes: ['0x01'],
        chainId: 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Blob versioned hashes must contain 32 bytes and version 0x01.]`,
    )
  })

  test('invalid blob hash version', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        blobVersionedHashes: [`0x02${'00'.repeat(31)}`],
        chainId: 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Blob versioned hashes must contain 32 bytes and version 0x01.]`,
    )
  })

  test('empty frames', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected between 1 and 64 frames.]`,
    )
  })

  test('too many frames', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: Array.from({ length: 65 }, () => ({})),
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected between 1 and 64 frames.]`,
    )
  })

  test('combined gas exceeds 64 bits', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ gas: 2n ** 64n - 1n }, { stateGas: 1n }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Combined frame gas must be less than 2^64.]`,
    )
  })

  test('execution gas exceeds transaction cap', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ gas: 16_777_216n }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Transaction execution gas exceeds 16777216.]`,
    )
  })

  test('execution approval targets another account', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ flags: 'approveExecution', target: accounts[1].address }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Execution approval must target the sender.]`,
    )
  })

  test('atomic batch without a following frame', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: An atomic batch requires a following non-verify frame.]`,
    )
  })

  test('atomic batch followed by verification', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }, { mode: 'verify' }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: An atomic batch requires a following non-verify frame.]`,
    )
  })

  test('approval inside an atomic batch', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }, { flags: 'approvePayment' }],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Atomic batches cannot contain approval frames.]`,
    )
  })

  test('invalid expiry calldata', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({
        chainId: 1,
        frames: [
          {
            mode: 'verify',
            target: '0x0000000000000000000000000000000000008141',
          },
        ],
        sender: accounts[0].address,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Invalid or duplicate expiry verifier frame.]`,
    )
  })

  test('invalid sender', () => {
    expect(() =>
      TxEnvelopeEip8141.assert({ chainId: 1, frames: [{}], sender: '0x' }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)
  })
})

describe('deserialize', () => {
  test('default', () => {
    expect(
      TxEnvelopeEip8141.deserialize(
        '0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0',
      ),
    ).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [],
        "chainId": 1,
        "frames": [
          {
            "data": "0x",
            "flags": 0,
            "gas": 0n,
            "mode": 0,
            "stateGas": 0n,
            "value": 0n,
          },
        ],
        "maxFeePerBlobGas": 0n,
        "maxFeePerGas": 0n,
        "maxPriorityFeePerGas": 0n,
        "nonce": 0n,
        "sender": "0x1111111111111111111111111111111111111111",
        "signatures": [],
        "type": "eip8141",
      }
    `)
  })

  test('unsigned signatures and large chainId', () => {
    const envelope = { chainId: 1, frames: [{}], sender: accounts[0].address }

    const input = {
      ...envelope,
      chainId: 2n ** 256n - 1n,
      signatures: [
        FrameSignature.from({ scheme: 'p256' }),
        FrameSignature.from({ scheme: 'secp256k1' }),
      ],
    }
    const decoded = TxEnvelopeEip8141.deserialize(
      TxEnvelopeEip8141.serialize(input),
    )
    expect(decoded.chainId).toBe(input.chainId)
    expect(decoded.signatures).toEqual(input.signatures)
  })

  test('missing body', () => {
    expect(() =>
      TxEnvelopeEip8141.deserialize('0x06' as TxEnvelopeEip8141.Serialized),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Hex.SliceOffsetOutOfBoundsError: Slice starting at offset \`1\` is out-of-bounds (size: \`1\`).]`,
    )
  })

  test('empty list', () => {
    expect(() =>
      TxEnvelopeEip8141.deserialize('0x06c0' as TxEnvelopeEip8141.Serialized),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected seven transaction fields.]`,
    )
  })

  test('truncated scalar', () => {
    expect(() =>
      TxEnvelopeEip8141.deserialize('0x06a0' as TxEnvelopeEip8141.Serialized),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Cursor.PositionOutOfBoundsError: Position \`32\` is out of bounds (\`0 < position < 1\`).]`,
    )
  })

  test('incorrect type', () => {
    expect(() =>
      TxEnvelopeEip8141.deserialize('0x05c0' as TxEnvelopeEip8141.Serialized),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected transaction type 0x06.]`,
    )
  })

  test('missing fields', () => {
    expect(() =>
      TxEnvelopeEip8141.deserialize('0x06c180' as TxEnvelopeEip8141.Serialized),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected seven transaction fields.]`,
    )
  })

  test('nonminimal integers', () => {
    const serialized =
      '0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0'
    const fields = Rlp.toHex(Hex.slice(serialized, 1)) as Hex.Hex[]
    fields[0] = '0x0001'
    expect(() =>
      TxEnvelopeEip8141.deserialize(
        Hex.concat('0x06', Rlp.fromHex(fields)) as TxEnvelopeEip8141.Serialized,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeEip8141.InvalidError: Expected a minimally encoded integer.]`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    expect(
      TxEnvelopeEip8141.from({
        chainId: 1,
        frames: [{ gas: 50000n }],
        sender: accounts[0].address,
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "frames": [
          {
            "gas": 50000n,
          },
        ],
        "sender": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "type": "eip8141",
      }
    `)
  })

  test('serialized', () => {
    expect(
      TxEnvelopeEip8141.from(
        '0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0',
      ),
    ).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [],
        "chainId": 1,
        "frames": [
          {
            "data": "0x",
            "flags": 0,
            "gas": 0n,
            "mode": 0,
            "stateGas": 0n,
            "value": 0n,
          },
        ],
        "maxFeePerBlobGas": 0n,
        "maxFeePerGas": 0n,
        "maxPriorityFeePerGas": 0n,
        "nonce": 0n,
        "sender": "0x1111111111111111111111111111111111111111",
        "signatures": [],
        "type": "eip8141",
      }
    `)
  })
})

describe('getSignPayload', () => {
  test('omitted nested defaults preserve the signing hash and encoding', () => {
    const envelope = TxEnvelopeEip8141.from({
      chainId: 1,
      frames: [{ gas: 50_000n, mode: 'sender' }],
      sender: accounts[0].address,
      signatures: [{ scheme: 'secp256k1' }],
    })
    const explicit = TxEnvelopeEip8141.from({
      ...envelope,
      frames: [Frame.from({ gas: 50_000n, mode: 'sender' })],
      signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
    })
    expect(TxEnvelopeEip8141.getSignPayload(envelope)).toBe(
      TxEnvelopeEip8141.getSignPayload(explicit),
    )
    expect(TxEnvelopeEip8141.serialize(envelope)).toBe(
      TxEnvelopeEip8141.serialize(explicit),
    )
  })

  test('default', () => {
    const envelope = {
      chainId: 1,
      frames: [{}],
      sender: '0x1111111111111111111111111111111111111111' as const,
    }
    expect(TxEnvelopeEip8141.getSignPayload(envelope)).toMatchInlineSnapshot(
      '"0xa795b6de44696d46c096aaa3d6401d6eaa21b9b639408c82be7e9e60358e4387"',
    )
  })

  test('elides only canonical-payload signature bytes without mutation', () => {
    const envelope = {
      chainId: 1,
      frames: [{}],
      sender: '0x1111111111111111111111111111111111111111' as const,
    }

    const canonical = FrameSignature.from('0xaabb')
    const explicit = FrameSignature.from({
      payload: `0x${'ab'.repeat(32)}`,
      signature: '0xccdd',
    })
    const input = { ...envelope, signatures: [canonical, explicit] }
    expect(TxEnvelopeEip8141.hash(input)).toBe(
      '0xee871bbb2466152f79e357e1cfcbdd71b1587c5b3a9060d9cd91545c1a3a5220',
    )
    const original = structuredClone(input)
    const expected =
      '0x85ec4544ddb227c5425add4b606f71ddfc0852100d14066d0061a1b092bad6d3'
    expect(TxEnvelopeEip8141.getSignPayload(input)).toBe(expected)
    expect(TxEnvelopeEip8141.hash(input, { presign: true })).toBe(expected)
    expect(TxEnvelopeEip8141.hash(input)).not.toBe(expected)
    expect(input).toEqual(original)
    expect(
      TxEnvelopeEip8141.getSignPayload({
        ...input,
        signatures: [
          canonical,
          FrameSignature.from({ ...explicit, signature: '0xee' }),
        ],
      }),
    ).not.toBe(expected)
  })

  test('signing digest remains stable after attaching a protocol signature', () => {
    const envelope = { chainId: 1, frames: [{}], sender: accounts[0].address }

    const input = {
      ...envelope,
      signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
    }
    const payload = TxEnvelopeEip8141.getSignPayload(input)
    const signature = Secp256k1.sign({
      payload,
      privateKey: accounts[0].privateKey,
    })
    const signed = {
      ...input,
      signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })],
    }
    expect(TxEnvelopeEip8141.getSignPayload(signed)).toBe(payload)
    expect(
      TxEnvelopeEip8141.deserialize(TxEnvelopeEip8141.serialize(signed))
        .signatures,
    ).toEqual(signed.signatures)
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = {
      chainId: 1,
      frames: [{}],
      sender: '0x1111111111111111111111111111111111111111' as const,
    }
    expect(TxEnvelopeEip8141.hash(envelope)).toMatchInlineSnapshot(
      '"0xa795b6de44696d46c096aaa3d6401d6eaa21b9b639408c82be7e9e60358e4387"',
    )
  })

  test('presign', () => {
    const envelope = {
      chainId: 1,
      frames: [{}],
      sender: '0x1111111111111111111111111111111111111111' as const,
    }
    expect(
      TxEnvelopeEip8141.hash(envelope, { presign: true }),
    ).toMatchInlineSnapshot(
      '"0xa795b6de44696d46c096aaa3d6401d6eaa21b9b639408c82be7e9e60358e4387"',
    )
  })
})

describe('serialize', () => {
  describe('e2e', () => {
    test('fills, signs, and mines a frame transaction', async () => {
      const sender = accounts[0].address
      const target = accounts[1].address
      const balance = await rpc.request({
        method: 'eth_getBalance',
        params: [target, 'latest'],
      })
      const nonce = await rpc.request({
        method: 'eth_getTransactionCount',
        params: [sender, 'pending'],
      })
      const request = TransactionRequest.toRpc({
        frames: [
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
          Frame.from({ gas: 50_000n, mode: 'sender', target, value: 1n }),
        ],
        from: sender,
        signatures: [{ scheme: 'secp256k1' }],
        // Nethermind's simulation mapping requires an outer recipient before processing frames.
        to: sender,
        type: 'eip8141',
      })
      // TODO: remove once migrated to reth or anvil.
      // Nethermind validates signatures when filling gas, before the transaction can be signed.
      await expect(
        rpc.request({ method: 'eth_fillTransaction', params: [request] }),
      ).rejects.toThrow('frame transaction signature has the wrong length')
      const { tx } = await rpc.request({
        method: 'eth_fillTransaction',
        params: [{ ...request, gas: Hex.fromNumber(100_000n) }],
      })
      expect(tx.type).toBe('0x6')
      if (tx.type !== '0x6' || !tx.frames)
        throw new Error('Expected a frame transaction')
      expect(tx.chainId).toBe('0x1fcd')
      expect(tx.nonce).toBe(nonce)
      expect(tx.frames).toEqual(request.frames)
      expect(tx.signatures).toEqual(request.signatures)
      expect(Hex.toBigInt(tx.gas)).toBe(100_000n)
      expect(Hex.toBigInt(tx.maxFeePerGas)).toBeGreaterThan(0n)
      expect(Hex.toBigInt(tx.maxPriorityFeePerGas)).toBeGreaterThanOrEqual(0n)
      expect(Hex.toBigInt(tx.maxFeePerGas)).toBeGreaterThanOrEqual(
        Hex.toBigInt(tx.maxPriorityFeePerGas),
      )
      expect(
        await rpc.request({
          method: 'eth_getTransactionCount',
          params: [sender, 'pending'],
        }),
      ).toBe(nonce)
      expect(
        await rpc.request({
          method: 'eth_getBalance',
          params: [target, 'latest'],
        }),
      ).toBe(balance)

      const envelope = TxEnvelopeEip8141.fromRpc(tx)
      const signature = Secp256k1.sign({
        payload: TxEnvelopeEip8141.getSignPayload(envelope),
        privateKey: accounts[0].privateKey,
      })
      const signed = TxEnvelopeEip8141.from({
        ...envelope,
        signatures: [{ scheme: 'secp256k1', signature }],
      })
      const hash = await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [TxEnvelopeEip8141.serialize(signed)],
      })
      expect(hash).toBe(TxEnvelopeEip8141.hash(signed))
      await expect
        .poll(
          () =>
            rpc.request({
              method: 'eth_getTransactionReceipt',
              params: [hash],
            }),
          { timeout: 30_000 },
        )
        .toMatchObject({ status: '0x1' })
      expect(
        Hex.toBigInt(
          await rpc.request({
            method: 'eth_getBalance',
            params: [target, 'latest'],
          }),
        ),
      ).toBe(Hex.toBigInt(balance) + 1n)
    })

    test.each(['eth_call', 'eth_estimateGas'] as const)(
      '%s handles frame transactions without changing state',
      async (method) => {
        const sender = accounts[0].address
        const target = accounts[1].address
        const balance = await rpc.request({
          method: 'eth_getBalance',
          params: [target, 'latest'],
        })
        const nonce = await rpc.request({
          method: 'eth_getTransactionCount',
          params: [sender, 'latest'],
        })
        const envelope = TxEnvelopeEip8141.from({
          chainId: 8141,
          frames: [
            Frame.from({
              flags: 'approveExecutionAndPayment',
              gas: 50_000n,
              mode: 'verify',
            }),
            Frame.from({ gas: 50_000n, mode: 'sender', target, value: 1n }),
            Frame.from({
              data: '0xdeadbeef',
              gas: 50_000n,
              mode: 'sender',
              target: '0x0000000000000000000000000000000000000004',
            }),
          ],
          maxFeePerGas: 10_000_000_000n,
          maxPriorityFeePerGas: 1_000_000_000n,
          nonce: Hex.toBigInt(nonce),
          sender,
          signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
        })
        const signature = Secp256k1.sign({
          payload: TxEnvelopeEip8141.getSignPayload(envelope),
          privateKey: accounts[0].privateKey,
        })
        const signed = TxEnvelopeEip8141.from({
          ...envelope,
          signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })],
        })
        const request = TransactionRequest.toRpc({
          ...TransactionEnvelope.toTransactionRequest(signed),
          // Nethermind's simulation mapping requires an outer recipient before processing frames.
          to: sender,
        })
        const result = await rpc.request({
          method,
          params: [request, 'latest'],
        })
        // Frame return data is not exposed by Nethermind's transaction-level call result.
        if (method === 'eth_call') expect(result).toBe('0x')
        else {
          // Estimation includes all signed frame budgets plus intrinsic gas.
          expect(Hex.toBigInt(result)).toBeGreaterThan(150_000n)
          expect(Hex.toBigInt(result)).toBeLessThan(200_000n)
        }
        await expect(
          rpc.request({
            method,
            params: [
              { ...request, frames: [{ ...request.frames![0]!, mode: 255 }] },
              'latest',
            ],
          }),
        ).rejects.toThrow('frame mode')
        expect(
          await rpc.request({
            method: 'eth_getBalance',
            params: [target, 'latest'],
          }),
        ).toBe(balance)
        expect(
          await rpc.request({
            method: 'eth_getTransactionCount',
            params: [sender, 'latest'],
          }),
        ).toBe(nonce)
      },
    )

    test('signs, submits, and mines through the generic envelope API', async () => {
      const target = accounts[1].address
      const before = BigInt(
        await rpc.request({
          method: 'eth_getBalance',
          params: [target, 'latest'],
        }),
      )
      const envelope = TransactionEnvelope.from({
        chainId: 8141,
        frames: [
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
          Frame.from({ gas: 50_000n, mode: 'sender', target, value: 1n }),
        ],
        maxFeePerGas: 10_000_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        nonce: BigInt(
          await rpc.request({
            method: 'eth_getTransactionCount',
            params: [accounts[0].address, 'latest'],
          }),
        ),
        sender: accounts[0].address,
        signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
      })
      const payload = TransactionEnvelope.getSignPayload(envelope)
      const signature = Secp256k1.sign({
        payload,
        privateKey: accounts[0].privateKey,
      })

      const signed = TransactionEnvelope.from({
        ...envelope,
        signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })],
      })
      const serialized = TransactionEnvelope.serialize(signed)
      const hash = await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [serialized],
      })
      expect(hash).toBe(TransactionEnvelope.hash(signed))
      expect(
        TransactionRequest.toEnvelope(
          TransactionEnvelope.toTransactionRequest(signed),
        ),
      ).toEqual(signed)
      expect(TxEnvelopeEip8141.toRpc(signed)).toMatchObject(
        TransactionRequest.toRpc(
          TransactionEnvelope.toTransactionRequest(signed),
        ),
      )
      await expect
        .poll(
          () =>
            rpc.request({
              method: 'eth_getTransactionReceipt',
              params: [hash],
            }),
          { timeout: 30_000 },
        )
        .not.toBeNull()
      const receiptRpc = await rpc.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      })
      const receipt = TransactionReceipt.fromRpc(receiptRpc)!
      expect(receipt.payer!.toLowerCase()).toBe(
        accounts[0].address.toLowerCase(),
      )
      const transactionRpc = await rpc.request({
        method: 'eth_getTransactionByHash',
        params: [hash],
      })
      expect(transactionRpc).not.toBeNull()
      const transaction = Transaction.fromRpc(transactionRpc)!
      expect(transaction.type).toBe('eip8141')
      const schemaTransaction = z.decode(
        z.Transaction.Transaction,
        transactionRpc!,
      )
      if (schemaTransaction.type !== 'eip8141')
        throw new Error('Expected a frame transaction')
      expect(schemaTransaction.frames).toEqual(transaction.frames)
      expect(schemaTransaction.signatures).toEqual(transaction.signatures)
      expect(
        z.decode(z.TransactionReceipt.TransactionReceipt, receiptRpc!)
          .frameReceipts,
      ).toEqual(receipt.frameReceipts)
      expect(
        z.encode(z.TransactionReceipt.TransactionReceipt, receipt)
          .frameReceipts,
      ).toEqual(receiptRpc!.frameReceipts)

      if (transaction.type !== 'eip8141')
        throw new Error('Expected a frame transaction')
      const decoded = TxEnvelopeEip8141.fromRpc(
        transactionRpc as Transaction.Eip8141Rpc,
      )
      expect(TxEnvelopeEip8141.hash(decoded)).toBe(hash)
      expect(transaction.frames).toEqual(decoded.frames)
      expect(transaction.signatures).toEqual(decoded.signatures)
      expect(Transaction.toRpc(transaction)).toMatchObject(
        TxEnvelopeEip8141.toRpc(decoded),
      )
      expect(receipt.type).toBe('eip8141')
      expect(receipt.frameReceipts![0]!.gasUsed).toBeGreaterThan(0n)
      expect(receipt.frameReceipts![0]!.stateGasUsed).toBe(0n)
      expect(TransactionReceipt.toRpc(receipt).frameReceipts).toEqual(
        receiptRpc!.frameReceipts,
      )
      expect(receipt.frameReceipts!.map((frame) => frame.status)).toEqual([
        'success',
        'success',
      ])
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
      const envelope = TxEnvelopeEip8141.from({
        chainId: 8141,
        frames: [
          Frame.from({
            flags: 'approveExecution',
            gas: 50_000n,
            mode: 'verify',
          }),
          Frame.from({
            flags: 'approvePayment',
            gas: 50_000n,
            mode: 'verify',
            target: accounts[1].address,
          }),
          Frame.from({
            gas: 50_000n,
            mode: 'sender',
            target: accounts[1].address,
            value: 1n,
          }),
        ],
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
          FrameSignature.from({
            scheme: 'secp256k1',
            signer: accounts[1].address,
          }),
        ],
      })
      const payload = TxEnvelopeEip8141.getSignPayload(envelope)
      const signature = Secp256k1.sign({
        payload,
        privateKey: accounts[0].privateKey,
      })
      const payerSignature = Secp256k1.sign({
        payload,
        privateKey: accounts[1].privateKey,
      })
      const signed = TxEnvelopeEip8141.from({
        ...envelope,
        signatures: [
          FrameSignature.from({ scheme: 'secp256k1', signature }),
          FrameSignature.from({
            scheme: 'secp256k1',
            signature: payerSignature,
            signer: accounts[1].address,
          }),
        ],
      })
      const serialized = TxEnvelopeEip8141.serialize(signed)
      const hash = await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [serialized],
      })
      expect(hash).toBe(TxEnvelopeEip8141.hash(signed))
      await expect
        .poll(
          () =>
            rpc.request({
              method: 'eth_getTransactionReceipt',
              params: [hash],
            }),
          { timeout: 30_000 },
        )
        .not.toBeNull()
      const receipt = TransactionReceipt.fromRpc(
        await rpc.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        }),
      )!
      expect(receipt.payer!.toLowerCase()).toBe(
        accounts[1].address.toLowerCase(),
      )
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
      const envelope = TxEnvelopeEip8141.from({
        chainId: 8141,
        frames: [
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
          Frame.from({
            flags: 'atomicBatch',
            gas: 50_000n,
            mode: 'sender',
            target: accounts[1].address,
            value: 1n,
          }),
          Frame.from({
            flags: 'atomicBatch',
            gas: 50_000n,
            mode: 'sender',
            target: '0x0000000000000000000000000000000000001000',
          }),
          Frame.from({
            gas: 50_000n,
            mode: 'sender',
            target: accounts[1].address,
            value: 2n,
          }),
        ],
        maxFeePerGas: 10_000_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        nonce: BigInt(
          await rpc.request({
            method: 'eth_getTransactionCount',
            params: [accounts[0].address, 'latest'],
          }),
        ),
        sender: accounts[0].address,
        signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
      })
      const payload = TxEnvelopeEip8141.getSignPayload(envelope)
      const signature = Secp256k1.sign({
        payload,
        privateKey: accounts[0].privateKey,
      })

      const signed = TxEnvelopeEip8141.from({
        ...envelope,
        signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })],
      })
      const serialized = TxEnvelopeEip8141.serialize(signed)
      const hash = await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [serialized],
      })
      expect(hash).toBe(TxEnvelopeEip8141.hash(signed))
      await expect
        .poll(
          () =>
            rpc.request({
              method: 'eth_getTransactionReceipt',
              params: [hash],
            }),
          { timeout: 30_000 },
        )
        .not.toBeNull()
      const receipt = TransactionReceipt.fromRpc(
        await rpc.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        }),
      )!
      expect(receipt.frameReceipts!.map((frame) => frame.status)).toEqual([
        'success',
        'success',
        'reverted',
        'skipped',
      ])
      expect(
        await rpc.request({
          method: 'eth_getBalance',
          params: [accounts[1].address, 'latest'],
        }),
      ).toBe(before)
    })

    test('rejects a signature from the wrong sender', async () => {
      const envelope = TxEnvelopeEip8141.from({
        chainId: 8141,
        frames: [
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
        ],
        maxFeePerGas: 10_000_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        nonce: BigInt(
          await rpc.request({
            method: 'eth_getTransactionCount',
            params: [accounts[0].address, 'latest'],
          }),
        ),
        sender: accounts[0].address,
        signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
      })
      const signature = Secp256k1.sign({
        payload: TxEnvelopeEip8141.getSignPayload(envelope),
        privateKey: accounts[1].privateKey,
      })
      await expect(
        rpc.request({
          method: 'eth_sendRawTransaction',
          params: [
            TxEnvelopeEip8141.serialize(
              TxEnvelopeEip8141.from({
                ...envelope,
                signatures: [
                  FrameSignature.from({ scheme: 'secp256k1', signature }),
                ],
              }),
            ),
          ],
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[RpcResponse.InvalidInputError: transaction invalid, frame transaction SECP256K1 signer does not match the recovered address]`,
      )
    })

    test('rejects an expired transaction', async () => {
      const envelope = TxEnvelopeEip8141.from({
        chainId: 8141,
        frames: [
          Frame.from({
            data: '0x0000000000000001',
            gas: 50_000n,
            mode: 'verify',
            target: '0x0000000000000000000000000000000000008141',
          }),
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
        ],
        maxFeePerGas: 10_000_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        nonce: BigInt(
          await rpc.request({
            method: 'eth_getTransactionCount',
            params: [accounts[0].address, 'latest'],
          }),
        ),
        sender: accounts[0].address,
        signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
      })
      const payload = TxEnvelopeEip8141.getSignPayload(envelope)
      const signature = Secp256k1.sign({
        payload,
        privateKey: accounts[0].privateKey,
      })

      const signed = TxEnvelopeEip8141.from({
        ...envelope,
        signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })],
      })
      await expect(
        rpc.request({
          method: 'eth_sendRawTransaction',
          params: [TxEnvelopeEip8141.serialize(signed)],
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[RpcResponse.InvalidInputError: frame transaction expired]`,
      )
    })

    test('authorizes P-256 through signature introspection', async () => {
      const privateKey = accounts[0].privateKey
      const publicKey = P256.getPublicKey({ privateKey })
      const sender = Address.fromPublicKey(publicKey)
      // Genesis verifier checks SIGPARAM signer, scheme, and payload before APPROVE(3).
      const envelope = TxEnvelopeEip8141.from({
        chainId: 8141,
        frames: [
          Frame.from({
            flags: 'approveExecutionAndPayment',
            gas: 50_000n,
            mode: 'verify',
          }),
          Frame.from({
            gas: 50_000n,
            mode: 'sender',
            target: accounts[1].address,
            value: 1n,
          }),
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
      const signed = TxEnvelopeEip8141.from({
        ...envelope,
        signatures: [
          FrameSignature.from({ publicKey, scheme: 'p256', signature }),
        ],
      })
      const serialized = TxEnvelopeEip8141.serialize(signed)
      const hash = await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [serialized],
      })
      expect(hash).toBe(TxEnvelopeEip8141.hash(signed))
      await expect
        .poll(
          () =>
            rpc.request({
              method: 'eth_getTransactionReceipt',
              params: [hash],
            }),
          { timeout: 30_000 },
        )
        .not.toBeNull()
      const receipt = TransactionReceipt.fromRpc(
        await rpc.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        }),
      )!
      expect(receipt.frameReceipts!.map((frame) => frame.status)).toEqual([
        'success',
        'success',
      ])
      expect(
        BigInt(
          await rpc.request({
            method: 'eth_getBalance',
            params: [accounts[1].address, 'latest'],
          }),
        ),
      ).toBe(before + 1n)
    })
  })

  test('default', () => {
    const envelope = {
      chainId: 1,
      frames: [{}],
      sender: '0x1111111111111111111111111111111111111111' as const,
    }
    expect(TxEnvelopeEip8141.serialize(envelope)).toMatchInlineSnapshot(
      '"0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0"',
    )
  })
  describe('sidecars', () => {
    const envelope = { chainId: 1, frames: [{}], sender: accounts[0].address }
    const commitment = `0x${'00'.repeat(48)}` as const
    const sidecars = {
      blobs: [`0x${'00'.repeat(131072)}` as const],
      cellProofs: Array.from({ length: 128 }, () => commitment),
      commitments: [commitment],
    }
    const input = {
      ...envelope,
      blobVersionedHashes: [Blobs.commitmentToVersionedHash(commitment)],
      sidecars,
    }
    test('round-trips the version 1 network wrapper', () => {
      const encoded = TxEnvelopeEip8141.serialize(input)
      const tuple = Rlp.toHex(Hex.slice(encoded, 1))
      expect(tuple[1]).toBe('0x01')
      expect(tuple.length).toBe(5)
      expect(
        z.decode(z.TxEnvelopeEip8141.serialized, encoded).sidecars,
      ).toEqual(sidecars)
      expect(TxEnvelopeEip8141.deserialize(encoded).sidecars).toEqual(sidecars)
      expect(
        TransactionEnvelope.serialize(
          TxEnvelopeEip8141.from({ ...input, sidecars: undefined }),
          { sidecars },
        ),
      ).toBe(encoded)
      expect(TxEnvelopeEip8141.hash(input)).toBe(
        TxEnvelopeEip8141.hash({ ...input, sidecars: undefined }),
      )
      expect(TxEnvelopeEip8141.getSignPayload(input)).toBe(
        TxEnvelopeEip8141.getSignPayload({ ...input, sidecars: undefined }),
      )
    })
    test('missing blobs', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, blobs: [] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: PeerDAS sidecar counts do not match blob hashes.]`,
      )
    })

    test('missing commitments', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, commitments: [] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: PeerDAS sidecar counts do not match blob hashes.]`,
      )
    })

    test('missing cell proofs', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, cellProofs: [] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: PeerDAS sidecar counts do not match blob hashes.]`,
      )
    })

    test('invalid blob size', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, blobs: ['0x'] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: Invalid blob size or commitment.]`,
      )
    })

    test('invalid commitment size', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, commitments: ['0x'] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: Invalid blob size or commitment.]`,
      )
    })

    test('invalid proof size', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: {
            ...sidecars,
            cellProofs: Array.from({ length: 128 }, () => '0x' as const),
          },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: Cell proofs must contain 48 bytes.]`,
      )
    })

    test('commitment does not match versioned hash', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({
          ...input,
          sidecars: { ...sidecars, commitments: [`0x${'11'.repeat(48)}`] },
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: Invalid blob size or commitment.]`,
      )
    })
    test('rejects a wrapper without blob hashes', () => {
      expect(() =>
        TxEnvelopeEip8141.serialize({ ...envelope, sidecars }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeEip8141.InvalidError: PeerDAS sidecar counts do not match blob hashes.]`,
      )
    })
  })
})

describe('validate', () => {
  test('negative chainId', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: -1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('fractional chainId', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1.5,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('unsafe numeric chainId', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: Number.MAX_SAFE_INTEGER + 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('chainId exceeds 256 bits', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 2n ** 256n,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('negative nonce', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        nonce: -1n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('nonce exceeds 64 bits', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        nonce: 2n ** 64n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('null nonce', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        nonce: null,
        sender: accounts[0].address,
      } as unknown as TxEnvelopeEip8141.TxEnvelopeEip8141),
    ).toBe(false)
  })

  test('negative fee cap', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        maxFeePerGas: -1n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('fee cap exceeds 256 bits', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        maxFeePerGas: 2n ** 256n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('tip above fee cap', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        maxPriorityFeePerGas: 1n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('blob fee without blobs', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{}],
        maxFeePerBlobGas: 1n,
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('invalid blob hash size', () => {
    expect(
      TxEnvelopeEip8141.validate({
        blobVersionedHashes: ['0x01'],
        chainId: 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('invalid blob hash version', () => {
    expect(
      TxEnvelopeEip8141.validate({
        blobVersionedHashes: [`0x02${'00'.repeat(31)}`],
        chainId: 1,
        frames: [{}],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('empty frames', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('too many frames', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: Array.from({ length: 65 }, () => ({})),
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('combined gas exceeds 64 bits', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ gas: 2n ** 64n - 1n }, { stateGas: 1n }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('execution gas exceeds transaction cap', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ gas: 16_777_216n }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('execution approval targets another account', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ flags: 'approveExecution', target: accounts[1].address }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('atomic batch without a following frame', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('atomic batch followed by verification', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }, { mode: 'verify' }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('approval inside an atomic batch', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [{ flags: 'atomicBatch' }, { flags: 'approvePayment' }],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('invalid expiry calldata', () => {
    expect(
      TxEnvelopeEip8141.validate({
        chainId: 1,
        frames: [
          {
            mode: 'verify',
            target: '0x0000000000000000000000000000000000008141',
          },
        ],
        sender: accounts[0].address,
      }),
    ).toBe(false)
  })

  test('invalid sender', () => {
    expect(
      TxEnvelopeEip8141.validate({ chainId: 1, frames: [{}], sender: '0x' }),
    ).toBe(false)
  })

  test('accepts atomic batches and implicit sender approval', () => {
    const envelope = { chainId: 1, frames: [{}], sender: accounts[0].address }

    expect(
      TxEnvelopeEip8141.validate({
        ...envelope,
        frames: [{ flags: 'approveExecution' }, { flags: 'atomicBatch' }, {}],
      }),
    ).toBe(true)
  })

  test('validates expiry shape and uniqueness', () => {
    const envelope = { chainId: 1, frames: [{}], sender: accounts[0].address }

    const frame = {
      data: '0x0000000000000001',
      gas: 5000n,
      mode: 'verify',
      target: '0x0000000000000000000000000000000000008141',
    } as const
    expect(TxEnvelopeEip8141.validate({ ...envelope, frames: [frame] })).toBe(
      true,
    )
    expect(
      TxEnvelopeEip8141.validate({ ...envelope, frames: [frame, frame] }),
    ).toBe(false)
    expect(
      TxEnvelopeEip8141.validate({
        ...envelope,
        frames: [{ ...frame, stateGas: 1n }],
      }),
    ).toBe(false)
  })
})

describe('toRpc', () => {
  test('maps sender and defaults without an outer signature', () => {
    const envelope = TxEnvelopeEip8141.from({
      chainId: 1,
      frames: [Frame.from({})],
      sender: accounts[0].address,
    })
    expect(TxEnvelopeEip8141.toRpc(envelope)).toEqual({
      blobVersionedHashes: [],
      chainId: '0x1',
      frames: [
        {
          data: '0x',
          executionGasLimit: '0x0',
          flags: 0,
          mode: 0,
          stateGasLimit: '0x0',
          value: '0x0',
        },
      ],
      from: accounts[0].address,
      maxFeePerBlobGas: '0x0',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      nonce: '0x0',
      signatures: [],
      type: '0x6',
    })
  })
})

describe('fromRpc', () => {
  test('retains large chain IDs and canonical bytes', () => {
    const envelope = TxEnvelopeEip8141.from({
      chainId: 9007199254740993n,
      frames: [Frame.from({})],
      sender: accounts[0].address,
      signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
    })
    const rpc = TxEnvelopeEip8141.toRpc(envelope)
    expect(rpc.chainId).toBe('0x20000000000001')
    const result = TxEnvelopeEip8141.fromRpc(rpc)
    expect(result.chainId).toBe(9007199254740993n)
    expect(TxEnvelopeEip8141.serialize(result)).toBe(
      TxEnvelopeEip8141.serialize(envelope),
    )
  })
})
