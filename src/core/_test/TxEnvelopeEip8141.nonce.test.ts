import { encodeRlp, keccak256 } from 'ethers'
import {
  Blobs,
  Hex,
  Secp256k1,
  Transaction,
  TransactionRequest,
  TxEnvelopeEip8141,
} from 'ox'
import { describe, expect, test } from 'vitest'

const sender = '0x1111111111111111111111111111111111111111'
const envelope = TxEnvelopeEip8141.from({
  chainId: 1,
  frames: [{ mode: 'sender' }],
  sender,
  signatures: [{ scheme: 'arbitrary', signature: '0xdeadbeef' }],
})

// Generated independently with ethers 6.17 from the literal EIP-8250 RLP layout.
const vectors = [
  {
    nonceKeys: undefined,
    nonce: 0n,
    serialized:
      '0x06f00180941111111111111111111111111111111111111111c9c8028080c280808080c9c880808084deadbeefc3808080c0',
    hash: '0xa14c90dee4c545369e201e4975ee2ef415357df20a0a183d1be9f602bac9a47d',
    signHash:
      '0x5682abf965767351637964eed1fe3f775ab45de426def7da68736cf2ae0a43b5',
  },
  {
    nonceKeys: [0n],
    nonce: 0n,
    serialized:
      '0x06f201c18080941111111111111111111111111111111111111111c9c8028080c280808080c9c880808084deadbeefc3808080c0',
    hash: '0x069a1528377db98ed06429aab0dad8043315859ac454ce3e1f5a250e365d072d',
    signHash:
      '0xd573654ae8d57432b3856b0078fb98f2f3e4d3f73a023d7ba8a952a16d0f4726',
  },
  {
    nonceKeys: [1n, 128n, 2n ** 256n - 1n],
    nonce: 2n ** 64n - 2n,
    serialized:
      '0x06f85d01e4018180a0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff88fffffffffffffffe941111111111111111111111111111111111111111c9c8028080c280808080c9c880808084deadbeefc3808080c0',
    hash: '0x620915f063bdd017a09ae856d0043d064568b3455aba741d7ebc748731fc503f',
    signHash:
      '0x3d28f5f76f353611385be1512c2832220686b27cad3c53d5b07941de1515319b',
  },
] as const

describe('serialize', () => {
  test.each(vectors)('independent encoding and signing vector %#', (vector) => {
    const value = {
      ...envelope,
      nonce: vector.nonce,
      nonceKeys: vector.nonceKeys,
    }
    expect(TxEnvelopeEip8141.serialize(value)).toBe(vector.serialized)
    expect(TxEnvelopeEip8141.hash(value)).toBe(vector.hash)
    expect(TxEnvelopeEip8141.getSignPayload(value)).toBe(vector.signHash)
    const decoded = TxEnvelopeEip8141.deserialize(vector.serialized)
    expect(TxEnvelopeEip8141.serialize(decoded)).toBe(vector.serialized)
    expect(decoded.nonceKeys).toEqual(vector.nonceKeys)
    expect(decoded.nonce).toBe(vector.nonce)
    expect(TxEnvelopeEip8141.getSignPayload(decoded)).toBe(vector.signHash)
  })

  test('matches independent literal RLP layout', () => {
    const body = [
      '0x01',
      ['0x01', '0x8180'],
      '0x05',
      sender,
      [['0x02', '0x', '0x', ['0x', '0x'], '0x', '0x']],
      [['0x', '0x', '0x', '0xdeadbeef']],
      ['0x', '0x', '0x'],
      [],
    ]
    const serialized = `0x06${encodeRlp(body).slice(2)}`
    const value = { ...envelope, nonceKeys: [1n, 33152n], nonce: 5n }
    expect(TxEnvelopeEip8141.serialize(value)).toBe(serialized)
    expect(TxEnvelopeEip8141.hash(value)).toBe(keccak256(serialized))
  })

  test('keyed PeerDAS wrapper preserves keys and excludes sidecars from hashes', () => {
    const commitment = `0x${'00'.repeat(48)}` as const
    const value = {
      ...envelope,
      nonceKeys: [1n],
      blobVersionedHashes: [Blobs.commitmentToVersionedHash(commitment)],
      sidecars: {
        blobs: [`0x${'00'.repeat(Blobs.bytesPerBlob)}` as const],
        commitments: [commitment],
        cellProofs: Array.from({ length: 128 }, () => commitment),
      },
    }
    const serialized = TxEnvelopeEip8141.serialize(value)
    const decoded = TxEnvelopeEip8141.deserialize(serialized)
    expect(decoded.nonceKeys).toMatchInlineSnapshot(`
      [
        1n,
      ]
    `)
    expect(TxEnvelopeEip8141.serialize(decoded)).toBe(serialized)
    expect(TxEnvelopeEip8141.hash(value)).toBe(
      TxEnvelopeEip8141.hash({ ...value, sidecars: undefined }),
    )
    expect(TxEnvelopeEip8141.getSignPayload(value)).toBe(
      TxEnvelopeEip8141.getSignPayload({ ...value, sidecars: undefined }),
    )
  })
})

describe('assert', () => {
  test.each([
    [],
    [0n, 1n],
    [1n, 1n],
    [2n, 1n],
    [-1n],
    [2n ** 256n],
    Array.from({ length: 17 }, (_, i) => BigInt(i + 1)),
  ])('rejects invalid keys %#', (...nonceKeys) => {
    expect(TxEnvelopeEip8141.validate({ ...envelope, nonceKeys })).toBe(false)
    expect(() =>
      TxEnvelopeEip8141.serialize({ ...envelope, nonceKeys }),
    ).toThrow()
  })

  test('accepts 16 keys and the maximum key', () => {
    expect(
      TxEnvelopeEip8141.validate({
        ...envelope,
        nonceKeys: Array.from({ length: 16 }, (_, i) => BigInt(i + 1)),
      }),
    ).toBe(true)
    expect(
      TxEnvelopeEip8141.validate({ ...envelope, nonceKeys: [2n ** 256n - 1n] }),
    ).toBe(true)
  })

  test.each([-1n, 2n ** 64n - 1n, 2n ** 64n])(
    'rejects invalid shared sequence %s',
    (nonce) => {
      expect(() =>
        TxEnvelopeEip8141.assert({ ...envelope, nonceKeys: [1n], nonce }),
      ).toThrow('Nonce must be less than 2^64 - 1 and nonnegative.')
    },
  )

  test('rejects a numeric key or null list', () => {
    // @ts-expect-error invalid runtime input
    expect(TxEnvelopeEip8141.validate({ ...envelope, nonceKeys: [1] })).toBe(
      false,
    )
    // @ts-expect-error invalid runtime input
    expect(TxEnvelopeEip8141.validate({ ...envelope, nonceKeys: null })).toBe(
      false,
    )
  })

  test('charges encoded nonce calldata against the transaction gas cap', () => {
    const value = {
      ...envelope,
      signatures: [],
      frames: [{ executionGas: 16_764_741n }],
    }
    expect(TxEnvelopeEip8141.validate(value)).toBe(true)
    expect(TxEnvelopeEip8141.validate({ ...value, nonceKeys: [0n] })).toBe(
      false,
    )
    // rlp([0]) || rlp(0) = c1 80 80, three nonzero bytes at 16 gas each.
    expect(
      TxEnvelopeEip8141.validate({
        ...value,
        nonceKeys: [0n],
        frames: [{ executionGas: 16_764_693n }],
      }),
    ).toBe(true)
  })
})

describe('deserialize', () => {
  test.each([
    ['0x', '0x'],
    [[], '0x'],
    [['0x00'], '0x'],
    [['0x0001'], '0x'],
    [[['0x01']], '0x'],
    [['0x01'], '0x00'],
    [['0x01'], '0x0001'],
    [['0x01'], []],
    [['0x01', '0x01'], '0x'],
    [['0x02', '0x01'], '0x'],
    [['0x', '0x01'], '0x'],
    [[`0x01${'00'.repeat(32)}`], '0x'],
    [['0x01'], '0x010000000000000000'],
  ])('rejects malformed nonce fields %#', (keys, nonce) => {
    const serialized =
      `0x06${encodeRlp(['0x01', keys, nonce, sender, [['0x02', '0x', '0x', ['0x', '0x'], '0x', '0x']], [], ['0x', '0x', '0x'], []]).slice(2)}` as const
    expect(() => TxEnvelopeEip8141.deserialize(serialized)).toThrow()
  })

  test('rejects nonminimal RLP string and list lengths', () => {
    const canonical = vectors[1].serialized
    expect(() =>
      TxEnvelopeEip8141.deserialize(
        canonical.replace(
          'f201c180',
          'f301c28100',
        ) as TxEnvelopeEip8141.Serialized,
      ),
    ).toThrow()
    expect(() =>
      TxEnvelopeEip8141.deserialize(
        canonical.replace(
          'f201c180',
          'f301f80180',
        ) as TxEnvelopeEip8141.Serialized,
      ),
    ).toThrow()
    expect(() =>
      TxEnvelopeEip8141.deserialize(
        canonical.replace('f201', 'f83201') as TxEnvelopeEip8141.Serialized,
      ),
    ).toThrow()
  })
})

describe('getSignPayload', () => {
  test('signatures bind the complete key set and sequence', () => {
    const value = {
      ...envelope,
      nonceKeys: [1n, 2n],
      nonce: 0n,
      signatures: [{ scheme: 'secp256k1' } as const],
    }
    const privateKey =
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const signature = Secp256k1.sign({
      privateKey,
      payload: TxEnvelopeEip8141.getSignPayload(value),
    })
    const signed = {
      ...value,
      signatures: [{ scheme: 'secp256k1', signature } as const],
    }
    expect(
      Secp256k1.verify({
        publicKey,
        signature,
        payload: TxEnvelopeEip8141.getSignPayload(signed),
      }),
    ).toBe(true)
    expect(
      Secp256k1.verify({
        publicKey,
        signature,
        payload: TxEnvelopeEip8141.getSignPayload({
          ...signed,
          nonceKeys: [1n, 3n],
        }),
      }),
    ).toBe(false)
    expect(
      Secp256k1.verify({
        publicKey,
        signature,
        payload: TxEnvelopeEip8141.getSignPayload({ ...signed, nonce: 1n }),
      }),
    ).toBe(false)
  })

  test('commits to keys and shared sequence without mutating signatures', () => {
    const value = { ...envelope, nonceKeys: [1n, 2n], nonce: 3n }
    const hash = TxEnvelopeEip8141.getSignPayload(value)
    expect(
      TxEnvelopeEip8141.getSignPayload({ ...value, nonceKeys: [1n, 3n] }),
    ).not.toBe(hash)
    expect(TxEnvelopeEip8141.getSignPayload({ ...value, nonce: 4n })).not.toBe(
      hash,
    )
    expect(
      TxEnvelopeEip8141.getSignPayload({ ...value, nonceKeys: [1n] }),
    ).not.toBe(hash)
    expect(
      TxEnvelopeEip8141.getSignPayload({
        ...value,
        signatures: [{ scheme: 'arbitrary', signature: '0xabcdef' }],
      }),
    ).toBe(hash)
    expect(value.signatures[0].signature).toBe('0xdeadbeef')
  })

  test('retains explicit-message signatures', () => {
    const value = {
      ...envelope,
      nonceKeys: [1n],
      signatures: [
        {
          scheme: 'arbitrary',
          payload: `0x${'11'.repeat(32)}`,
          signature: '0xdeadbeef',
        } as const,
      ],
    }
    expect(TxEnvelopeEip8141.getSignPayload(value)).toBe(
      TxEnvelopeEip8141.hash(value),
    )
    expect(
      TxEnvelopeEip8141.getSignPayload({
        ...value,
        signatures: [{ ...value.signatures[0]!, signature: '0xabcdef' }],
      }),
    ).not.toBe(TxEnvelopeEip8141.getSignPayload(value))
  })
})

describe('toRpc', () => {
  test.each(vectors)('preserves absent or explicit nonce keys %#', (vector) => {
    const value = {
      ...envelope,
      nonceKeys: vector.nonceKeys,
      nonce: vector.nonce,
    }
    const rpc = TxEnvelopeEip8141.toRpc(value)
    expect('nonceSeq' in rpc).toBe(false)
    expect('nonceKeys' in rpc).toBe(vector.nonceKeys !== undefined)
    expect(rpc.nonceKeys).toEqual(
      vector.nonceKeys?.map((key) => Hex.fromNumber(key)),
    )
    expect(rpc.nonce).toBe(Hex.fromNumber(vector.nonce))
    expect(TxEnvelopeEip8141.serialize(TxEnvelopeEip8141.fromRpc(rpc))).toBe(
      vector.serialized,
    )
  })

  test('request conversion preserves omitted sequence and frame gas', () => {
    const request = {
      type: 'eip8141',
      nonceKeys: [1n, 2n],
      frames: [{ mode: 'sender' }, { mode: 'sender', executionGas: 0n }],
    } as const
    const rpc = TransactionRequest.toRpc(request)
    expect(rpc.nonce).toBeUndefined()
    expect(rpc.nonceKeys).toMatchInlineSnapshot(`
      [
        "0x1",
        "0x2",
      ]
    `)
    expect(rpc.frames?.map((frame) => frame.executionGas)).toEqual([
      undefined,
      '0x0',
    ])
    expect(TransactionRequest.fromRpc(rpc).nonceKeys).toEqual(request.nonceKeys)
    expect(TransactionRequest.toRpc({ ...request, nonce: 0n }).nonce).toBe(
      '0x0',
    )
  })

  test('transaction result conversion retains keyed nonces', () => {
    const rpc = {
      ...TxEnvelopeEip8141.toRpc({
        ...envelope,
        nonceKeys: [1n, 2n],
        nonce: 3n,
      }),
      gas: '0x0' as const,
      input: '0x' as const,
      to: null,
      value: '0x0' as const,
      blockHash: null,
      blockNumber: null,
      transactionIndex: null,
      hash: `0x${'11'.repeat(32)}` as const,
    }
    const value = Transaction.fromRpc(rpc, { pending: true })!
    expect(value.nonceKeys).toMatchInlineSnapshot(`
      [
        1n,
        2n,
      ]
    `)
    expect(Transaction.toRpc(value, { pending: true }).nonceKeys).toEqual(
      rpc.nonceKeys,
    )
    expect(value.nonce).toBe(3n)
  })

  test('accepts numberish keys without losing uint256 precision', () => {
    expect(
      TxEnvelopeEip8141.toRpc({
        ...envelope,
        nonceKeys: ['0x1', 128, 2n ** 256n - 1n],
        nonce: '0x0',
      }).nonceKeys,
    ).toEqual(['0x1', '0x80', `0x${'ff'.repeat(32)}`])
  })
})

describe('fromRpc', () => {
  test('requires the sequence in keyed transaction results', () => {
    const value = {
      ...TxEnvelopeEip8141.toRpc({ ...envelope, nonceKeys: [1n] }),
      nonce: undefined,
    }
    expect(() =>
      Transaction.fromRpc(value as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[FrameNonce.InvalidError: A keyed transaction result requires nonce.]`,
    )
  })

  test.each([
    '0x00',
    '0x01',
    '0x',
    '0x10000000000000000',
    '0xffffffffffffffff',
  ])('rejects invalid keyed sequence %s', (nonce) => {
    expect(() =>
      TxEnvelopeEip8141.fromRpc({
        ...TxEnvelopeEip8141.toRpc(envelope),
        nonceKeys: ['0x1'],
        nonce: nonce as Hex.Hex,
      }),
    ).toThrow()
    expect(() =>
      TransactionRequest.fromRpc({
        nonceKeys: ['0x1'],
        nonce: nonce as Hex.Hex,
      }),
    ).toThrow()
  })
  test.each([['0x01'], ['0x'], ['0x0', '0x1'], ['0x2', '0x1']])(
    'rejects invalid RPC keys %j',
    (...nonceKeys) => {
      expect(() =>
        TransactionRequest.fromRpc({ nonceKeys: nonceKeys as Hex.Hex[] }),
      ).toThrow()
    },
  )
})
