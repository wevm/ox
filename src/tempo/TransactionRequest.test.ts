import { TransactionRequest } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

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
