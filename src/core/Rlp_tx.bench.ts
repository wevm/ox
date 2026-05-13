// Track B / transactions: bench coverage for the RLP encode/decode hot
// paths exercised by every TxEnvelope codec. The encoding thread owns
// codec-only bench naming under `src/core/Rlp.bench.ts`; this file scopes
// to transaction-shaped inputs to avoid collision.

import { bench, describe } from 'vitest'
import * as Hex from './Hex.js'
import * as Rlp from './Rlp.js'

// Mirrors the EIP-1559 tuple shape (12 elements: 9 base + 3 signature).
const eip1559Tuple = [
  '0x01',
  '0x',
  '0x3b9aca00',
  '0x6fc23ac0',
  '0x5208',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x0de0b6b3a7640000',
  '0x',
  [],
  '0x01',
  '0xa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0',
  '0xb0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
] as const

const eip1559TupleHex = Rlp.fromHex(eip1559Tuple as never, { as: 'Hex' })

// Larger 7702-shaped tuple with an access list and authorization list of
// modest size (2 entries each).
const eip7702Tuple = [
  '0x01',
  '0x10',
  '0x3b9aca00',
  '0x6fc23ac0',
  '0x5208',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x0de0b6b3a7640000',
  '0x',
  [
    [
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ],
    ],
  ],
  [
    [
      '0x01',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      '0x',
      '0x01',
      '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
      '0xb1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1',
    ],
  ],
  '0x01',
  '0xa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0',
  '0xb0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
] as const

const eip7702TupleHex = Rlp.fromHex(eip7702Tuple as never, { as: 'Hex' })

describe('Rlp.fromHex (transaction-shaped)', () => {
  bench('eip1559 tuple', () => {
    Rlp.fromHex(eip1559Tuple as never, { as: 'Hex' })
  })

  bench('eip7702 tuple (with access + authorization lists)', () => {
    Rlp.fromHex(eip7702Tuple as never, { as: 'Hex' })
  })
})

describe('Rlp.toHex (transaction-shaped)', () => {
  bench('eip1559 tuple', () => {
    Rlp.toHex(eip1559TupleHex)
  })

  bench('eip7702 tuple (with access + authorization lists)', () => {
    Rlp.toHex(eip7702TupleHex)
  })
})

describe('Rlp.toBytes (transaction-shaped)', () => {
  bench('eip1559 tuple', () => {
    Rlp.toBytes(eip1559TupleHex)
  })

  bench('eip7702 tuple (with access + authorization lists)', () => {
    Rlp.toBytes(eip7702TupleHex)
  })
})

// Sanity-check: keep the Hex import live so the file remains valid even if
// the bench list is trimmed.
void Hex.size
