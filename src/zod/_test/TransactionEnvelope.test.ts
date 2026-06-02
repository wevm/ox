import { describe, expect, test } from 'vp/test'
import * as core_TxEnvelope from '../../core/TxEnvelope.js'
import * as z_TransactionEnvelope from '../TransactionEnvelope.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const storageKey = `0x${'11'.repeat(32)}` as const
const r = `0x${'22'.repeat(32)}` as const
const s = `0x${'33'.repeat(32)}` as const

describe('TransactionEnvelope', () => {
  test('decodes and encodes base envelopes', () => {
    expect(
      z.decode(z_TransactionEnvelope.Base, {
        chainId: '0x1',
        gas: '0x5208',
        type: '0x2',
        value: '0x3',
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "gas": 21000n,
        "type": "eip1559",
        "value": 3n,
      }
    `)
    expect(
      z.encode(z_TransactionEnvelope.Base, {
        chainId: 1,
        gas: 21000n,
        type: 'eip1559',
        value: 3n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": "0x1",
        "gas": "0x5208",
        "type": "0x2",
        "value": "0x3",
      }
    `)
  })

  test('decodes envelope unions', () => {
    expect(
      z.decode(z_TransactionEnvelope.TransactionEnvelope, {
        chainId: '0x1',
        maxFeePerGas: '0x2',
        maxPriorityFeePerGas: '0x1',
        type: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
        "type": "eip1559",
      }
    `)
    expect(
      z.decode(z_TransactionEnvelope.Signed, {
        accessList: [],
        authorizationList: [
          { address, chainId: '0x1', nonce: '0x2', r, s, yParity: '0x1' },
        ],
        chainId: '0x1',
        maxFeePerGas: '0x5',
        maxPriorityFeePerGas: '0x6',
        r,
        s,
        type: '0x4',
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessList": [],
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
        "chainId": 1,
        "maxFeePerGas": 5n,
        "maxPriorityFeePerGas": 6n,
        "r": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "s": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "type": "eip7702",
      }
    `)
  })

  test('preserves custom base types and rejects unknown union types', () => {
    expect(z.decode(z_TransactionEnvelope.Type, '0x99')).toMatchInlineSnapshot(
      `"0x99"`,
    )
    expect(
      z.encode(z_TransactionEnvelope.Type, 'custom'),
    ).toMatchInlineSnapshot(`"custom"`)
    expect(
      z.safeDecode(z_TransactionEnvelope.TransactionEnvelope, {
        chainId: '0x1',
        type: '0x99',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('validates signed base envelopes', () => {
    expect(
      z.decode(z_TransactionEnvelope.BaseSigned, {
        chainId: '0x1',
        r: storageKey,
        s: storageKey,
        type: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "s": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "type": "eip1559",
      }
    `)
    expect(
      z.safeDecode(z_TransactionEnvelope.BaseSigned, {
        chainId: '0x1',
        r: storageKey,
        type: '0x2',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('serialized codec round-trips signed envelopes against core', () => {
    const envelopes = {
      legacy: {
        chainId: 1,
        gas: 21000n,
        gasPrice: 7n,
        nonce: 2n,
        r,
        s,
        to: address,
        type: 'legacy',
        v: 37,
        value: 3n,
      },
      eip2930: {
        accessList: [{ address, storageKeys: [r] }],
        chainId: 1,
        gas: 21000n,
        gasPrice: 7n,
        nonce: 2n,
        r,
        s,
        to: address,
        type: 'eip2930',
        value: 3n,
        yParity: 1,
      },
      eip1559: {
        chainId: 1,
        gas: 21000n,
        maxFeePerGas: 5n,
        maxPriorityFeePerGas: 4n,
        nonce: 2n,
        r,
        s,
        to: address,
        type: 'eip1559',
        value: 3n,
        yParity: 1,
      },
      eip7702: {
        authorizationList: [
          { address, chainId: 1, nonce: 2n, r, s, yParity: 1 },
        ],
        chainId: 1,
        gas: 21000n,
        maxFeePerGas: 5n,
        maxPriorityFeePerGas: 4n,
        nonce: 2n,
        r,
        s,
        to: address,
        type: 'eip7702',
        value: 3n,
        yParity: 1,
      },
    } as const

    for (const envelope of Object.values(envelopes)) {
      const hex = core_TxEnvelope.serialize(envelope as never)
      const decoded = core_TxEnvelope.deserialize(hex)
      expect(z.decode(z_TransactionEnvelope.serialized, hex)).toEqual(decoded)
      expect(
        z.encode(z_TransactionEnvelope.serialized, decoded as never),
      ).toEqual(hex)
    }
  })
})
