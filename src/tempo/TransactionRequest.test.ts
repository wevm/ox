import { TransactionRequest } from 'ox/tempo'
import { describe, expect, test } from 'vp/test'

describe('fromRpc', () => {
  test('default', () => {
    const request = TransactionRequest.fromRpc({
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
        },
      ],
      feeToken: '0x20c0000000000000000000000000000000000000',
      type: '0x76',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0xcafebabecafebabecafebabecafebabecafebabe",
          },
        ],
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "type": "tempo",
      }
    `)
  })

  test('behavior: calls with value', () => {
    const request = TransactionRequest.fromRpc({
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
          value: '0x2386f26fc10000',
        },
      ],
      type: '0x76',
    })
    expect(request.calls).toMatchInlineSnapshot(`
      [
        {
          "data": "0xdeadbeef",
          "to": "0xcafebabecafebabecafebabecafebabecafebabe",
          "value": 10000000000000000n,
        },
      ]
    `)
  })

  test('behavior: validBefore + validAfter', () => {
    const request = TransactionRequest.fromRpc({
      calls: [],
      validBefore: '0x64',
      validAfter: '0x32',
      type: '0x76',
    })
    expect(request.validBefore).toBe(100)
    expect(request.validAfter).toBe(50)
  })

  test('behavior: nonceKey', () => {
    const request = TransactionRequest.fromRpc({
      calls: [],
      nonceKey: '0xff',
      type: '0x76',
    })
    expect(request.nonceKey).toBe(255n)
  })

  test('behavior: gas-model hints and capabilities pass through', () => {
    const request = TransactionRequest.fromRpc({
      calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      capabilities: { balanceDiffs: true },
      feePayer: true,
      keyData: '0x0578',
      keyId: '0xcccccccccccccccccccccccccccccccccccccccc',
      keyType: 'webAuthn',
      multisigInit: {
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        threshold: 2,
        owners: [
          {
            owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            weight: 1,
          },
          {
            owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            weight: 1,
          },
        ],
      },
      multisigSignatureCount: 2,
      type: '0x76',
    })
    expect(request.capabilities).toEqual({ balanceDiffs: true })
    expect(request.feePayer).toBe(true)
    expect(request.keyData).toBe('0x0578')
    expect(request.keyId).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(request.keyType).toBe('webAuthn')
    expect(request.multisigInit).toMatchObject({ threshold: 2 })
    expect(request.multisigSignatureCount).toBe(2)
  })

  test('behavior: empty', () => {
    const request = TransactionRequest.fromRpc({})
    expect(request).toMatchInlineSnapshot('{}')
  })
})

describe('toRpc', () => {
  test('default', () => {
    const request = TransactionRequest.toRpc({
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
        },
      ],
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0xcafebabecafebabecafebabecafebabecafebabe",
            "value": "0x",
          },
        ],
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "type": "0x76",
      }
    `)
  })

  test('behavior: to/data/value folded into calls', () => {
    const request = TransactionRequest.toRpc({
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
      data: '0xdeadbeef',
      value: 1000n,
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0xcafebabecafebabecafebabecafebabecafebabe",
            "value": "0x3e8",
          },
        ],
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "type": "0x76",
      }
    `)
  })

  test('behavior: gas-model hints and capabilities are carried', () => {
    const request = TransactionRequest.toRpc({
      calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      capabilities: { balanceDiffs: true },
      feePayer: false,
      keyData: '0x0578',
      keyId: '0xcccccccccccccccccccccccccccccccccccccccc',
      keyType: 'webAuthn',
      multisigInit: {
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        threshold: 2,
        owners: [
          {
            owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            weight: 1,
          },
          {
            owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            weight: 1,
          },
        ],
      },
      multisigSignatureCount: 2,
    })
    expect(request.capabilities).toEqual({ balanceDiffs: true })
    expect(request.feePayer).toBe(false)
    expect(request.keyData).toBe('0x0578')
    expect(request.keyId).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(request.keyType).toBe('webAuthn')
    expect(request.multisigInit).toMatchObject({ threshold: 2 })
    expect(request.multisigSignatureCount).toBe(2)
    expect(request.type).toBe('0x76')
  })

  test('behavior: key data longer than 4 bytes shims into a length hint', () => {
    const request = TransactionRequest.toRpc({
      calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      keyData: `0x${'aa'.repeat(1400)}`,
      keyType: 'webAuthn',
    })
    // 1400 bytes -> 0x0578 big-endian length hint.
    expect(request.keyData).toBe('0x0578')
  })

  test('behavior: feeToken is withheld until the fee payer signs (TIP-76)', () => {
    const pending = TransactionRequest.toRpc({
      calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      feePayer: true,
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    expect(pending.feeToken).toBeUndefined()
    expect(pending.feePayer).toBe(true)

    const signed = TransactionRequest.toRpc({
      calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      feePayer: true,
      feePayerSignature: {
        r: '0x0000000000000000000000000000000000000000000000000000000000000001',
        s: '0x0000000000000000000000000000000000000000000000000000000000000002',
        yParity: 1,
      },
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    expect(signed.feeToken).toBe('0x20c0000000000000000000000000000000000000')
  })

  test('behavior: data-less call defaults to the zero address', () => {
    const flat = TransactionRequest.toRpc({
      feeToken: '0x20c0000000000000000000000000000000000000',
      value: 100n,
    })
    expect(flat.calls).toMatchInlineSnapshot(`
      [
        {
          "data": "0x",
          "to": "0x0000000000000000000000000000000000000000",
          "value": "0x64",
        },
      ]
    `)

    const bare = TransactionRequest.toRpc({
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    expect(bare.calls).toMatchInlineSnapshot(`
      [
        {
          "data": "0x",
          "to": "0x0000000000000000000000000000000000000000",
          "value": "0x",
        },
      ]
    `)
  })

  test("behavior: nonceKey 'random' generates a 192-bit value", () => {
    const request = TransactionRequest.toRpc({
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
        },
      ],
      feeToken: '0x20c0000000000000000000000000000000000000',
      nonceKey: 'random',
    })
    // 24 bytes = 48 hex chars + '0x' prefix.
    expect(request.nonceKey).toMatch(/^0x[0-9a-f]{48}$/)
  })
})

describe('roundtrip', () => {
  test('toRpc -> fromRpc', () => {
    const original: TransactionRequest.TransactionRequest = {
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
          value: 10000000000000000n,
        },
        {
          data: '0x',
          to: '0x1234567890123456789012345678901234567890',
        },
      ],
      feeToken: '0x20c0000000000000000000000000000000000001',
      validBefore: 100,
      validAfter: 50,
      nonceKey: 255n,
      gas: 100000n,
      maxFeePerGas: 1000000000n,
    }

    const rpc = TransactionRequest.toRpc(original)
    const converted = TransactionRequest.fromRpc(rpc)

    expect(converted.calls).toEqual(
      original.calls!.map((call) => ({
        to: call.to,
        data: call.data ?? '0x',
        value: call.value,
      })),
    )
    expect(converted.feeToken).toEqual(
      '0x20c0000000000000000000000000000000000001',
    )
    expect(converted.validBefore).toBe(original.validBefore)
    expect(converted.validAfter).toBe(original.validAfter)
    expect(converted.nonceKey).toBe(original.nonceKey)
    expect(converted.gas).toBe(original.gas)
    expect(converted.maxFeePerGas).toBe(original.maxFeePerGas)
    expect(converted.type).toBe('tempo')
  })

  test('fromRpc -> toRpc', () => {
    const original: TransactionRequest.Rpc = {
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
          value: '0x2386f26fc10000',
        },
      ],
      feeToken: '0x20c0000000000000000000000000000000000000',
      validBefore: '0x64',
      validAfter: '0x32',
      nonceKey: '0xff',
      gas: '0x186a0',
      type: '0x76',
    }

    const request = TransactionRequest.fromRpc(original)
    const rpc = TransactionRequest.toRpc(request)

    expect(rpc.calls).toEqual(original.calls)
    expect(rpc.feeToken).toBe(original.feeToken)
    expect(rpc.validBefore).toBe(original.validBefore)
    expect(rpc.validAfter).toBe(original.validAfter)
    expect(rpc.nonceKey).toBe(original.nonceKey)
    expect(rpc.gas).toBe(original.gas)
    expect(rpc.type).toBe('0x76')
  })
})

describe('toEnvelope', () => {
  test('default: uses provided calls', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [
        {
          data: '0xdeadbeef',
          to: '0xcafebabecafebabecafebabecafebabecafebabe',
        },
      ],
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expect(envelope.calls).toEqual([
      {
        data: '0xdeadbeef',
        to: '0xcafebabecafebabecafebabecafebabecafebabe',
      },
    ])
    expect(envelope.type).toBe('tempo')
    expect(envelope.chainId).toBe(1)
    expect(envelope.maxFeePerGas).toBe(1n)
  })

  test('behavior: folds flat call into calls[]', () => {
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      data: '0xdeadbeef',
      maxFeePerGas: 1n,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
      value: 100n,
    })
    expect(envelope.calls).toEqual([
      {
        data: '0xdeadbeef',
        to: '0xcafebabecafebabecafebabecafebabecafebabe',
        value: 100n,
      },
    ])
  })

  test('behavior: drops core blob fields, gasPrice, r/s/yParity/v', () => {
    const envelope = TransactionRequest.toEnvelope({
      blobs: ['0xcafebabe'],
      blobVersionedHashes: ['0xcafebabe'],
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      gasPrice: 1n,
      maxFeePerBlobGas: 1n,
      maxFeePerGas: 1n,
      r: '0x0000000000000000000000000000000000000000000000000000000000000001',
      s: '0x0000000000000000000000000000000000000000000000000000000000000002',
      v: 27,
      yParity: 0,
    })
    expect(envelope).not.toHaveProperty('blobs')
    expect(envelope).not.toHaveProperty('blobVersionedHashes')
    expect(envelope).not.toHaveProperty('maxFeePerBlobGas')
    expect(envelope).not.toHaveProperty('gasPrice')
    expect(envelope).not.toHaveProperty('r')
    expect(envelope).not.toHaveProperty('s')
    expect(envelope).not.toHaveProperty('yParity')
    expect(envelope).not.toHaveProperty('v')
  })

  test('behavior: resolves nonceKey: "random" to a bigint', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      maxFeePerGas: 1n,
      nonceKey: 'random',
    })
    expect(typeof envelope.nonceKey).toBe('bigint')
    expect(envelope.nonceKey).toBeGreaterThan(0n)
  })

  test('behavior: preserves explicit bigint nonceKey', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      maxFeePerGas: 1n,
      nonceKey: 42n,
    })
    expect(envelope.nonceKey).toBe(42n)
  })

  test('behavior: passes through feeToken, validBefore, validAfter', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      feeToken: '0x20c0000000000000000000000000000000000000',
      maxFeePerGas: 1n,
      validAfter: 100,
      validBefore: 200,
    })
    expect(envelope.feeToken).toBe('0x20c0000000000000000000000000000000000000')
    expect(envelope.validBefore).toBe(200)
    expect(envelope.validAfter).toBe(100)
  })

  test('behavior: data-less request defaults to a zero-address call', () => {
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expect(envelope.calls).toEqual([
      { to: '0x0000000000000000000000000000000000000000' },
    ])
  })

  test('behavior: feePayer marks the envelope as pending a fee payer signature (TIP-76)', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      feePayer: true,
      feeToken: '0x20c0000000000000000000000000000000000000',
      maxFeePerGas: 1n,
    })
    expect(envelope.feePayerSignature).toBeNull()

    // An explicit fee payer signature wins over the marker.
    const signed = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      feePayer: true,
      feePayerSignature: {
        r: '0x0000000000000000000000000000000000000000000000000000000000000001',
        s: '0x0000000000000000000000000000000000000000000000000000000000000002',
        yParity: 1,
      },
      maxFeePerGas: 1n,
    })
    expect(signed.feePayerSignature).not.toBeNull()

    // No fee payer, no marker.
    const plain = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expect(plain.feePayerSignature).toBeUndefined()
  })

  test('error: explicit empty calls throws via envelope assert', () => {
    expect(() =>
      TransactionRequest.toEnvelope({
        calls: [],
        chainId: 1,
        maxFeePerGas: 1n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeTempo.CallsEmptyError: Calls list cannot be empty.]`,
    )
  })
})
