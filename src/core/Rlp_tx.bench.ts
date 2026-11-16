// Scoped to transaction-shaped inputs, the RLP paths every TxEnvelope codec
// exercises. `src/core/Rlp.bench.ts` covers RLP on its own terms.

import { bench, describe } from 'vp/test'
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

// Legacy (EIP-155) tuple: 9 elements.
const legacyTuple = [
  '0x09',
  '0x04a817c800',
  '0x5208',
  '0x3535353535353535353535353535353535353535',
  '0x0de0b6b3a7640000',
  '0x',
  '0x25',
  '0xa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0',
  '0xb0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
] as const

const legacyTupleHex = Rlp.fromHex(legacyTuple as never, { as: 'Hex' })

// EIP-4844 network wrapper with 3 blobs, their commitments and proofs.
const blob = (i: number) =>
  `0x${i.toString(16).padStart(2, '0').repeat(131_072)}` as const
const kzg = (i: number) =>
  `0x${i.toString(16).padStart(2, '0').repeat(48)}` as const
const eip4844SidecarsHex = Rlp.fromHex(
  [
    [
      '0x01',
      '0x10',
      '0x3b9aca00',
      '0x6fc23ac0',
      '0x5208',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      '0x0de0b6b3a7640000',
      '0x',
      [],
      '0x3b9aca00',
      [1, 2, 3].map(
        (i) => `0x01${i.toString(16).padStart(2, '0').repeat(31)}` as const,
      ),
      '0x01',
      '0xa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0',
      '0xb0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
    ],
    [1, 2, 3].map(blob),
    [1, 2, 3].map(kzg),
    [4, 5, 6].map(kzg),
  ] as never,
  { as: 'Hex' },
)

describe('Rlp.fromHex (transaction-shaped)', () => {
  bench('eip1559 tuple', () => {
    Rlp.fromHex(eip1559Tuple as never, { as: 'Hex' })
  })

  bench('eip7702 tuple (with access + authorization lists)', () => {
    Rlp.fromHex(eip7702Tuple as never, { as: 'Hex' })
  })
})

describe('Rlp.toHex (transaction-shaped)', () => {
  bench('legacy tuple', () => {
    Rlp.toHex(legacyTupleHex)
  })

  bench('eip4844 network wrapper (3 blobs)', () => {
    Rlp.toHex(eip4844SidecarsHex)
  })

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
