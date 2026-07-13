import { describe, expect, test } from 'vp/test'
import * as z_TransactionRequest from '../TransactionRequest.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const storageKey = `0x${'11'.repeat(32)}` as const
const r = `0x${'22'.repeat(32)}` as const
const s = `0x${'33'.repeat(32)}` as const

describe('TransactionRequest', () => {
  test('decodes and encodes transaction requests', () => {
    expect(
      z.decode(z_TransactionRequest.TransactionRequest, {
        accessList: [{ address, storageKeys: [storageKey] }],
        authorizationList: [
          { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x1' },
        ],
        blobVersionedHashes: [storageKey],
        blobs: ['0xdeadbeef'],
        chainId: '0x1',
        data: '0xdeadbeef',
        input: '0xdeadbeef',
        from: address,
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        maxFeePerBlobGas: '0x4',
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        nonce: '0x7',
        to: null,
        type: '0x2',
        value: '0x8',
        r,
        s,
        yParity: '0x1',
        v: '0x1b',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "storageKeys": [
              "0x1111111111111111111111111111111111111111111111111111111111111111",
            ],
          },
        ],
        "authorizationList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": 1,
            "nonce": 2n,
            "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
            "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
            "yParity": 1,
          },
        ],
        "blobVersionedHashes": [
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        ],
        "blobs": [
          "0xdeadbeef",
        ],
        "chainId": 1,
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": 21000n,
        "gasPrice": 1000000000n,
        "input": "0xdeadbeef",
        "maxFeePerBlobGas": 4n,
        "maxFeePerGas": 5n,
        "maxPriorityFeePerGas": 6n,
        "nonce": 7n,
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": null,
        "type": "eip1559",
        "v": 27,
        "value": 8n,
        "yParity": 1,
      }
    `)
    expect(
      z.encode(z_TransactionRequest.TransactionRequest, {
        accessList: [{ address, storageKeys: [storageKey] }],
        authorizationList: [
          { address, chainId: 1, nonce: 2n, r, s, yParity: 1 },
        ],
        blobVersionedHashes: [storageKey],
        blobs: ['0xdeadbeef'],
        chainId: 1,
        data: '0xdeadbeef',
        input: '0xdeadbeef',
        from: address,
        gas: 21000n,
        gasPrice: 1000000000n,
        maxFeePerBlobGas: 4n,
        maxFeePerGas: 5n,
        maxPriorityFeePerGas: 6n,
        nonce: 7n,
        to: null,
        type: 'eip1559',
        value: 8n,
        r,
        s,
        yParity: 1,
        v: 27,
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "storageKeys": [
              "0x1111111111111111111111111111111111111111111111111111111111111111",
            ],
          },
        ],
        "authorizationList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "chainId": "0x1",
            "nonce": "0x2",
            "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
            "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
            "yParity": "0x1",
          },
        ],
        "blobVersionedHashes": [
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        ],
        "blobs": [
          "0xdeadbeef",
        ],
        "chainId": "0x1",
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": "0x5208",
        "gasPrice": "0x3b9aca00",
        "input": "0xdeadbeef",
        "maxFeePerBlobGas": "0x4",
        "maxFeePerGas": "0x5",
        "maxPriorityFeePerGas": "0x6",
        "nonce": "0x7",
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": null,
        "type": "0x2",
        "v": "0x1b",
        "value": "0x8",
        "yParity": "0x1",
      }
    `)
  })

  test('TransactionRequestToRpc accepts numberish encode inputs', () => {
    const decoded = {
      chainId: 1,
      from: address,
      gas: 21000n,
      maxFeePerGas: 5n,
      maxPriorityFeePerGas: 6n,
      nonce: 7n,
      to: null,
      type: 'eip1559',
      value: 8n,
    } as const
    const expected = z.encode(z_TransactionRequest.TransactionRequest, decoded)

    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        gas: 21000,
        maxFeePerGas: 5,
        value: 8,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        gas: '0x5208',
        nonce: '0x7',
      }),
    ).toEqual(expected)
  })

  test('preserves unknown transaction types', () => {
    expect(z.decode(z_TransactionRequest.TransactionRequest, { type: '0x99' }))
      .toMatchInlineSnapshot(`
      {
        "type": "0x99",
      }
    `)
    expect(
      z.encode(z_TransactionRequest.TransactionRequest, { type: 'custom' }),
    ).toMatchInlineSnapshot(`
      {
        "type": "custom",
      }
    `)
  })

  test('rejects invalid quantities and nested values', () => {
    expect(
      z.safeDecode(z_TransactionRequest.TransactionRequest, {
        gas: '0x',
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TransactionRequest.TransactionRequest, {
        accessList: [{ address, storageKeys: ['0x1'] }],
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TransactionRequest.TransactionRequest, {
        authorizationList: [
          { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x2' },
        ],
      }).success,
    ).toBe(false)
  })
})
