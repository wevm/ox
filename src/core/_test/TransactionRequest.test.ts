import { Blobs, Hex, TransactionRequest, Value } from 'ox'
import { describe, expect, test } from 'vp/test'
import { kzg } from '../../../test/kzg.js'
import { anvilMainnet } from '../../../test/prool.js'

describe('toRpc', () => {
  test('default', () => {
    const request = TransactionRequest.toRpc({
      to: '0x0000000000000000000000000000000000000000',
      value: Value.fromEther('0.01'),
    })
    expect(request).toMatchInlineSnapshot(`
    {
      "to": "0x0000000000000000000000000000000000000000",
      "value": "0x2386f26fc10000",
    }
  `)
  })

  test('behavior: all', () => {
    const request = TransactionRequest.toRpc({
      accessList: [],
      authorizationList: [],
      blobs: ['0xdeadbeef'],
      blobVersionedHashes: ['0xdeadbeef'],
      chainId: 1,
      data: '0xdeadbeef',
      from: '0x0000000000000000000000000000000000000000',
      gas: 1000000n,
      gasPrice: 1000000000n,
      maxFeePerBlobGas: 1000000000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 1n,
      to: '0x0000000000000000000000000000000000000000',
      type: 'eip1559',
      value: 1000000000n,
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "blobVersionedHashes": [
          "0xdeadbeef",
        ],
        "blobs": [
          "0xdeadbeef",
        ],
        "chainId": "0x1",
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": "0xf4240",
        "gasPrice": "0x3b9aca00",
        "input": "0xdeadbeef",
        "maxFeePerBlobGas": "0x3b9aca00",
        "maxFeePerGas": "0x3b9aca00",
        "maxPriorityFeePerGas": "0x3b9aca00",
        "nonce": "0x1",
        "to": "0x0000000000000000000000000000000000000000",
        "type": "0x2",
        "value": "0x3b9aca00",
      }
    `)
  })

  test('behavior: input', () => {
    const request = TransactionRequest.toRpc({
      input: '0xdeadbeef',
    })
    expect(request).toMatchInlineSnapshot(`
    {
      "data": "0xdeadbeef",
      "input": "0xdeadbeef",
    }
  `)
  })

  test('behavior: signature fields', () => {
    const request = TransactionRequest.toRpc({
      r: '0x0000000000000000000000000000000000000000000000000000000000000001',
      s: '0x0000000000000000000000000000000000000000000000000000000000000002',
      v: 27,
      yParity: 0,
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
        "v": "0x1b",
        "yParity": "0x0",
      }
    `)
  })

  test('behavior: empty', () => {
    const request = TransactionRequest.toRpc({})
    expect(request).toMatchInlineSnapshot('{}')
  })

  test('behavior: network', async () => {
    const request = TransactionRequest.toRpc({
      to: '0x0000000000000000000000000000000000000000',
      value: Value.fromEther('0.01'),
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [request],
    })

    expect(hash).toBeDefined()
  })
})

describe('fromRpc', () => {
  test('default', () => {
    const request = TransactionRequest.fromRpc({
      to: '0x0000000000000000000000000000000000000000',
      value: '0x2386f26fc10000',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "to": "0x0000000000000000000000000000000000000000",
        "value": 10000000000000000n,
      }
    `)
  })

  test('behavior: all', () => {
    const request = TransactionRequest.fromRpc({
      accessList: [],
      authorizationList: [],
      blobs: ['0xdeadbeef'],
      blobVersionedHashes: ['0xdeadbeef'],
      chainId: '0x1',
      data: '0xdeadbeef',
      from: '0x0000000000000000000000000000000000000000',
      gas: '0xf4240',
      gasPrice: '0x3b9aca00',
      maxFeePerBlobGas: '0x3b9aca00',
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x3b9aca00',
      nonce: '0x1',
      to: '0x0000000000000000000000000000000000000000',
      type: '0x2',
      value: '0x3b9aca00',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "authorizationList": [],
        "blobVersionedHashes": [
          "0xdeadbeef",
        ],
        "blobs": [
          "0xdeadbeef",
        ],
        "chainId": 1,
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": 1000000n,
        "gasPrice": 1000000000n,
        "maxFeePerBlobGas": 1000000000n,
        "maxFeePerGas": 1000000000n,
        "maxPriorityFeePerGas": 1000000000n,
        "nonce": 1n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip1559",
        "value": 1000000000n,
      }
    `)
  })

  test('behavior: input', () => {
    const request = TransactionRequest.fromRpc({
      input: '0xdeadbeef',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "input": "0xdeadbeef",
      }
    `)
  })

  test('behavior: empty', () => {
    const request = TransactionRequest.fromRpc({})
    expect(request).toMatchInlineSnapshot('{}')
  })

  test('behavior: signature fields', () => {
    const request = TransactionRequest.fromRpc({
      r: '0x0000000000000000000000000000000000000000000000000000000000000001',
      s: '0x0000000000000000000000000000000000000000000000000000000000000002',
      v: '0x1b',
      yParity: '0x0',
    })
    expect(request).toMatchInlineSnapshot(`
      {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
        "v": 27,
        "yParity": 0,
      }
    `)
  })

  test('behavior: roundtrip', () => {
    const original: TransactionRequest.TransactionRequest = {
      accessList: [],
      authorizationList: [],
      blobs: ['0xdeadbeef'],
      blobVersionedHashes: ['0xdeadbeef'],
      chainId: 1,
      data: '0xdeadbeef',
      from: '0x0000000000000000000000000000000000000000',
      gas: 1000000n,
      gasPrice: 1000000000n,
      maxFeePerBlobGas: 1000000000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 1n,
      to: '0x0000000000000000000000000000000000000000',
      type: 'eip1559',
      value: 1000000000n,
    }
    const rpc = TransactionRequest.toRpc(original)
    const converted = TransactionRequest.fromRpc(rpc)

    expect(converted).toEqual({
      ...original,
      input: '0xdeadbeef',
    })
  })

  test('behavior: does not mutate input', () => {
    const rpc = {
      chainId: '0x1',
      gas: '0x5208',
      gasPrice: '0x2540be400',
      nonce: '0x1',
      to: '0x0000000000000000000000000000000000000000',
      value: '0xde0b6b3a7640000',
    } as const
    const snapshot = { ...rpc }
    TransactionRequest.fromRpc(rpc)
    expect(rpc).toEqual(snapshot)
  })
})

describe('toEnvelope', () => {
  test('default: infers eip1559 when no type', () => {
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      maxFeePerGas: 1n,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "maxFeePerGas": 1n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip1559",
        "value": 1n,
      }
    `)
  })

  test('behavior: legacy', () => {
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      gasPrice: 10n,
      nonce: 0n,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "gasPrice": 10n,
        "nonce": 0n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "legacy",
        "value": 1n,
      }
    `)
  })

  test('behavior: eip2930', () => {
    const envelope = TransactionRequest.toEnvelope({
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [],
        },
      ],
      chainId: 1,
      gasPrice: 10n,
      to: '0x0000000000000000000000000000000000000000',
      type: 'eip2930',
      value: 1n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "accessList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "storageKeys": [],
          },
        ],
        "chainId": 1,
        "gasPrice": 10n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip2930",
        "value": 1n,
      }
    `)
  })

  test('behavior: drops fields not on chosen type', () => {
    // 1559 envelope should not carry gasPrice even if the request had it.
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      gasPrice: 10n,
      maxFeePerGas: 20n,
      maxPriorityFeePerGas: 1n,
      to: '0x0000000000000000000000000000000000000000',
    })
    expect(envelope).not.toHaveProperty('gasPrice')
    expect(envelope.type).toBe('eip1559')
  })

  test('behavior: 4844 with explicit blobVersionedHashes', () => {
    const envelope = TransactionRequest.toEnvelope({
      blobVersionedHashes: [
        '0x01cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafe00',
      ],
      chainId: 1,
      maxFeePerBlobGas: 1n,
      maxFeePerGas: 1n,
      to: '0x0000000000000000000000000000000000000000',
    })
    expect(envelope.type).toBe('eip4844')
    expect((envelope as any).blobVersionedHashes).toEqual([
      '0x01cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafe00',
    ])
  })

  test('behavior: 4844 derives sidecars + hashes from blobs via kzg', () => {
    const blobs = Blobs.from(Hex.fromString('abcd'))
    const envelope = TransactionRequest.toEnvelope(
      {
        blobs,
        chainId: 1,
        maxFeePerBlobGas: 1n,
        maxFeePerGas: 1n,
        to: '0x0000000000000000000000000000000000000000',
      },
      { kzg },
    )
    expect(envelope.type).toBe('eip4844')
    const envelope_ = envelope as any
    expect(envelope_.blobVersionedHashes.length).toBe(blobs.length)
    expect(envelope_.sidecars.blobs.length).toBe(blobs.length)
    expect(envelope_.sidecars.commitments.length).toBe(blobs.length)
    expect(envelope_.sidecars.cellProofs.length).toBe(blobs.length * 128)
  })

  test('error: 4844 with blobs but no kzg throws', () => {
    const blobs = Blobs.from(Hex.fromString('abcd'))
    expect(() =>
      TransactionRequest.toEnvelope({
        blobs,
        chainId: 1,
        maxFeePerGas: 1n,
        to: '0x0000000000000000000000000000000000000000',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [TransactionRequest.MissingKzgError: A \`kzg\` option is required to derive 4844 sidecars or \`blobVersionedHashes\` from \`blobs\`.

      See: https://oxlib.sh/api/TransactionRequest/toEnvelope]
    `,
    )
  })

  test('behavior: 7702 with authorizationList', () => {
    const envelope = TransactionRequest.toEnvelope({
      authorizationList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          nonce: 0n,
          r: '0x0000000000000000000000000000000000000000000000000000000000000001',
          s: '0x0000000000000000000000000000000000000000000000000000000000000002',
          yParity: 0,
        },
      ],
      chainId: 1,
      maxFeePerGas: 1n,
      to: '0x0000000000000000000000000000000000000000',
    })
    expect(envelope.type).toBe('eip7702')
  })

  test('error: 7702 without authorizationList throws', () => {
    expect(() =>
      TransactionRequest.toEnvelope({
        chainId: 1,
        maxFeePerGas: 1n,
        to: '0x0000000000000000000000000000000000000000',
        type: 'eip7702',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionRequest.MissingAuthorizationListError: An \`authorizationList\` is required to convert a TransactionRequest into an EIP-7702 transaction envelope.]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(TransactionRequest)).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
      "toEnvelope",
      "MissingKzgError",
      "MissingAuthorizationListError",
    ]
  `)
})
