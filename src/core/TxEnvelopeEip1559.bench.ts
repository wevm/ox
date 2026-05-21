// Track B / transactions: bench coverage for the EIP-1559 envelope
// serialize / deserialize / hash hot paths. Targets per
// `tasks/perf-api-audit-transactions.md` Phase 1: ≥ 2× faster envelope
// serialize and deserialize at the same input.

import { bench, describe } from 'vp/test'
import * as TxEnvelopeEip1559 from './TxEnvelopeEip1559.js'

const envelope = TxEnvelopeEip1559.from({
  chainId: 1,
  nonce: 785n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 2_000_000_000n,
  gas: 1_000_000n,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1_000_000_000_000_000_000n,
  r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
  s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
  yParity: 1,
})

const envelopeWithAccessList = TxEnvelopeEip1559.from({
  ...envelope,
  accessList: [
    {
      address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      storageKeys: [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      ],
    },
    {
      address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      storageKeys: [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
    },
  ],
})

const serialized = TxEnvelopeEip1559.serialize(envelope)
const serializedWithAccessList = TxEnvelopeEip1559.serialize(
  envelopeWithAccessList,
)

describe('TxEnvelopeEip1559.serialize', () => {
  bench('minimal (no access list)', () => {
    TxEnvelopeEip1559.serialize(envelope)
  })

  bench('with access list (2 entries, 4 storage keys)', () => {
    TxEnvelopeEip1559.serialize(envelopeWithAccessList)
  })
})

describe('TxEnvelopeEip1559.deserialize', () => {
  bench('minimal (no access list)', () => {
    TxEnvelopeEip1559.deserialize(serialized)
  })

  bench('with access list (2 entries, 4 storage keys)', () => {
    TxEnvelopeEip1559.deserialize(serializedWithAccessList)
  })
})

describe('TxEnvelopeEip1559.hash', () => {
  bench('minimal (no access list)', () => {
    TxEnvelopeEip1559.hash(envelope)
  })

  bench('with access list (2 entries, 4 storage keys)', () => {
    TxEnvelopeEip1559.hash(envelopeWithAccessList)
  })
})
