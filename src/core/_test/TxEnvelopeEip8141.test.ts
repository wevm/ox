import {
  Blobs,
  FrameSignature,
  Hex,
  Rlp,
  Secp256k1,
  TxEnvelopeEip8141,
} from 'ox'
import { describe, expect, test } from 'vp/test'
import { accounts } from '../../../test/constants/accounts.js'

test('exports', () => {
  expect(Object.keys(TxEnvelopeEip8141).sort()).toMatchInlineSnapshot(`
    [
      "InvalidError",
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "hash",
      "serialize",
      "serializedType",
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
      signatures: [FrameSignature.fromSecp256k1(signature)],
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
      expect(TxEnvelopeEip8141.deserialize(encoded).sidecars).toEqual(sidecars)
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
