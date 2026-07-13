import { describe, expect, test } from 'vp/test'
import * as z_TxEnvelopeEip1559 from '../TxEnvelopeEip1559.js'
import * as z_TxEnvelopeEip2930 from '../TxEnvelopeEip2930.js'
import * as z_TxEnvelopeEip4844 from '../TxEnvelopeEip4844.js'
import * as z_TxEnvelopeEip7702 from '../TxEnvelopeEip7702.js'
import * as z_TxEnvelopeLegacy from '../TxEnvelopeLegacy.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const storageKey = `0x${'11'.repeat(32)}` as const
const r = `0x${'22'.repeat(32)}` as const
const s = `0x${'33'.repeat(32)}` as const

const baseRpc = {
  chainId: '0x1',
  data: '0xdeadbeef',
  from: address,
  gas: '0x5208',
  nonce: '0x2',
  to: null,
  value: '0x3',
  r,
  s,
  yParity: '0x1',
  v: '0x1c',
} as const

const base = {
  chainId: 1,
  data: '0xdeadbeef',
  from: address,
  gas: 21000n,
  nonce: 2n,
  to: null,
  value: 3n,
  r,
  s,
  yParity: 1,
  v: 28,
} as const

describe('TxEnvelope', () => {
  test('decodes and encodes EIP-1559 envelopes', () => {
    expect(
      z.decode(z_TxEnvelopeEip1559.TxEnvelopeEip1559, {
        ...baseRpc,
        accessList: [],
        maxFeePerGas: '0x4',
        maxPriorityFeePerGas: '0x5',
        type: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "chainId": 1,
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": 21000n,
        "maxFeePerGas": 4n,
        "maxPriorityFeePerGas": 5n,
        "nonce": 2n,
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": null,
        "type": "eip1559",
        "v": 28,
        "value": 3n,
        "yParity": 1,
      }
    `)
    expect(
      z.encode(z_TxEnvelopeEip1559.TxEnvelopeEip1559, {
        ...base,
        accessList: [],
        maxFeePerGas: 4n,
        maxPriorityFeePerGas: 5n,
        type: 'eip1559',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "chainId": "0x1",
        "data": "0xdeadbeef",
        "from": "0x0000000000000000000000000000000000000000",
        "gas": "0x5208",
        "maxFeePerGas": "0x4",
        "maxPriorityFeePerGas": "0x5",
        "nonce": "0x2",
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "to": null,
        "type": "0x2",
        "v": "0x1c",
        "value": "0x3",
        "yParity": "0x1",
      }
    `)
  })

  test('decodes all envelope variants', () => {
    expect(
      z.decode(z_TxEnvelopeLegacy.TxEnvelopeLegacy, {
        ...baseRpc,
        gasPrice: '0x4',
        type: '0x0',
      }),
    ).toMatchObject({ gasPrice: 4n, type: 'legacy' })
    expect(
      z.decode(z_TxEnvelopeEip2930.TxEnvelopeEip2930, {
        ...baseRpc,
        accessList: [],
        gasPrice: '0x4',
        type: '0x1',
      }),
    ).toMatchObject({ gasPrice: 4n, type: 'eip2930' })
    expect(
      z.decode(z_TxEnvelopeEip4844.TxEnvelopeEip4844, {
        ...baseRpc,
        accessList: [],
        blobVersionedHashes: [storageKey],
        maxFeePerBlobGas: '0x4',
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        sidecars: { blobs: ['0x'], commitments: [storageKey], cellProofs: [] },
        type: '0x3',
      }),
    ).toMatchObject({
      blobVersionedHashes: [storageKey],
      maxFeePerBlobGas: 4n,
      type: 'eip4844',
    })
    expect(
      z.decode(z_TxEnvelopeEip7702.TxEnvelopeEip7702, {
        ...baseRpc,
        accessList: [],
        authorizationList: [
          { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x1' },
        ],
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        type: '0x4',
      }),
    ).toMatchObject({
      authorizationList: [{ chainId: 1, nonce: 2n }],
      type: 'eip7702',
    })
  })

  test('TxEnvelopeEip1559ToRpc accepts numberish encode inputs', () => {
    const decoded = {
      ...base,
      accessList: [],
      maxFeePerGas: 4n,
      maxPriorityFeePerGas: 5n,
      type: 'eip1559',
    } as const
    const expected = z.encode(z_TxEnvelopeEip1559.TxEnvelopeEip1559, decoded)

    expect(
      z.encode(z_TxEnvelopeEip1559.TxEnvelopeEip1559ToRpc, {
        ...decoded,
        gas: 21000,
        maxFeePerGas: 4,
        maxPriorityFeePerGas: 5,
        nonce: 2,
        value: 3,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_TxEnvelopeEip1559.TxEnvelopeEip1559ToRpc, {
        ...decoded,
        gas: '0x5208',
        maxFeePerGas: '0x4',
        maxPriorityFeePerGas: '0x5',
        nonce: '0x2',
        value: '0x3',
      }),
    ).toEqual(expected)
  })

  test('validates signed envelopes and rejects invalid variants', () => {
    expect(
      z.decode(z_TxEnvelopeEip1559.Signed, {
        ...baseRpc,
        type: '0x2',
      }),
    ).toMatchObject({ r, s, type: 'eip1559' })
    expect(
      z.safeDecode(z_TxEnvelopeEip1559.Signed, {
        ...baseRpc,
        r: undefined,
        type: '0x2',
      } as never).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TxEnvelopeEip1559.TxEnvelopeEip1559, {
        ...baseRpc,
        type: '0x1',
      } as never).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_TxEnvelopeEip4844.Sidecars, {
        blobs: ['0xz'],
        commitments: [],
        cellProofs: [],
      } as never).success,
    ).toBe(false)
  })
})
