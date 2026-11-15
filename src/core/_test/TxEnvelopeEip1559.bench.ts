import { TxEnvelopeEip1559, Value } from 'ox'
import { bench, describe } from 'vitest'

const envelope = TxEnvelopeEip1559.from({
  accessList: [
    {
      address: '0x0000000000000000000000000000000000000000',
      storageKeys: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ],
    },
  ],
  chainId: 1,
  data: '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000',
  gas: 21_000n,
  maxFeePerGas: Value.fromGwei('20'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  nonce: 785n,
  r: 0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fen,
  s: 0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fen,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: Value.fromEther('1'),
  yParity: 1,
})
const serialized = TxEnvelopeEip1559.serialize(envelope)

describe('TxEnvelopeEip1559', () => {
  bench('ox: `serialize`', () => {
    TxEnvelopeEip1559.serialize(envelope)
  })

  bench('ox: `deserialize`', () => {
    TxEnvelopeEip1559.deserialize(serialized)
  })

  bench('ox: `getSignPayload`', () => {
    TxEnvelopeEip1559.getSignPayload(envelope)
  })
})
