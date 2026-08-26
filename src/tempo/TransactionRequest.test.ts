import { type MultisigWitness, TransactionRequest } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const multisigWitnessRpc = {
  account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  approvals: [
    {
      keyType: 'secp256k1',
      owner: '0x1111111111111111111111111111111111111111',
      type: 'primitive',
    },
    {
      type: 'multisig',
      witness: {
        account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        approvals: [
          {
            keyData: '0x0578',
            keyType: 'webAuthn',
            owner: '0x2222222222222222222222222222222222222222',
          },
        ],
        config: {
          owners: [
            {
              owner: '0x2222222222222222222222222222222222222222',
              weight: 1,
            },
          ],
          salt: `0x${'22'.repeat(32)}`,
          threshold: 1,
          version: 1,
        },
      },
    },
  ],
  config: {
    owners: [
      {
        owner: '0x1111111111111111111111111111111111111111',
        weight: 1,
      },
      {
        owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        weight: 1,
      },
    ],
    salt: `0x${'11'.repeat(32)}`,
    threshold: 2,
    version: 0,
  },
} as const satisfies MultisigWitness.Rpc

const multisigWitness = {
  ...multisigWitnessRpc,
  approvals: [
    multisigWitnessRpc.approvals[0],
    {
      ...multisigWitnessRpc.approvals[1],
      witness: {
        ...multisigWitnessRpc.approvals[1].witness,
        config: {
          ...multisigWitnessRpc.approvals[1].witness.config,
          version: 1n,
        },
      },
    },
  ],
  config: { ...multisigWitnessRpc.config, version: 0n },
} as const satisfies MultisigWitness.MultisigWitness

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

  test('behavior: multisig witness', () => {
    const request = TransactionRequest.fromRpc({
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      multisigWitness: multisigWitnessRpc,
      type: '0x76',
    })

    expect(request.multisigWitness?.config.version).toBe(0n)
    const nested = request.multisigWitness?.approvals[1]
    expect(nested?.type).toBe('multisig')
    if (nested?.type !== 'multisig') throw new Error('expected multisig')
    expect(nested.witness.config.version).toBe(1n)
    expect(nested.witness.approvals[0]?.keyType).toBe('webAuthn')
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

  test('behavior: multisig witness', () => {
    const request = TransactionRequest.toRpc({
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      multisigWitness,
    })

    expect(request.multisigWitness?.config.version).toBe(0)
    const nested = request.multisigWitness?.approvals[1]
    expect(nested?.type).toBe('multisig')
    if (nested?.type !== 'multisig') throw new Error('expected multisig')
    expect(nested.witness.config.version).toBe(1)
    expect(request.type).toBe('0x76')
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
      multisigWitness,
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
    expect(converted.multisigWitness).toEqual(original.multisigWitness)
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
      multisigWitness: multisigWitnessRpc,
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
    expect(rpc.multisigWitness).toEqual(original.multisigWitness)
    expect(rpc.type).toBe('0x76')
  })
})
