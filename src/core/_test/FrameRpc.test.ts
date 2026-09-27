import {
  Frame,
  FrameSignature,
  TransactionRequest,
  TxEnvelopeEip8141,
} from 'ox'
import { describe, expect, test } from 'vitest'

describe('TransactionRequest.toRpc', () => {
  test('preserves omitted frame gas and explicit zero limits', () => {
    expect(
      TransactionRequest.toRpc({
        type: 'eip8141',
        frames: [
          { mode: 'sender' },
          { mode: 'sender', executionGas: 0n },
          { mode: 'sender', stateGas: 0n },
          { mode: 'sender', executionGas: 50_000n, stateGas: 1_000n },
        ],
      }),
    ).toEqual({
      type: '0x6',
      frames: [
        { mode: '0x2', flags: '0x0', data: '0x', value: '0x0' },
        {
          mode: '0x2',
          flags: '0x0',
          data: '0x',
          value: '0x0',
          executionGas: '0x0',
        },
        {
          mode: '0x2',
          flags: '0x0',
          data: '0x',
          value: '0x0',
          stateGas: '0x0',
        },
        {
          mode: '0x2',
          flags: '0x0',
          data: '0x',
          value: '0x0',
          executionGas: '0xc350',
          stateGas: '0x3e8',
        },
      ],
    })
  })
})

describe('TransactionRequest.fromRpc', () => {
  test('decodes minimal requests without assigning gas limits', () => {
    expect(
      TransactionRequest.fromRpc({
        type: '0x6',
        frames: [
          { mode: '0x2' },
          { mode: '0x2', executionGas: '0x0', stateGas: '0x0', target: null },
        ],
      }),
    ).toEqual({
      type: 'eip8141',
      frames: [
        { mode: 2, flags: 0, data: '0x', value: 0n },
        {
          mode: 2,
          flags: 0,
          data: '0x',
          value: 0n,
          executionGas: 0n,
          stateGas: 0n,
        },
      ],
    })
  })
})

describe('TxEnvelopeEip8141.toRpc', () => {
  test('retains complete frame gas fields', () => {
    const envelope = TxEnvelopeEip8141.toRpc(
      TxEnvelopeEip8141.from({
        chainId: 1,
        frames: [Frame.from({ mode: 'sender' })],
        sender: '0x1111111111111111111111111111111111111111',
      }),
    )
    expect(envelope.frames).toEqual([
      {
        mode: '0x2',
        flags: '0x0',
        data: '0x',
        value: '0x0',
        executionGas: '0x0',
        stateGas: '0x0',
      },
    ])
  })
})

describe('FrameSignature.fromRpc', () => {
  test('accepts empty signers and rejects null signers', () => {
    expect(FrameSignature.fromRpc({ scheme: '0x1', signer: '0x' })).toEqual({
      scheme: 'secp256k1',
      payload: '0x',
    })
    expect(() =>
      FrameSignature.fromRpc({
        scheme: '0x1',
        // @ts-expect-error Null is not an RPC signer.
        signer: null,
      }),
    ).toThrow('signer must be omitted, empty bytes, or an address.')
  })
})
