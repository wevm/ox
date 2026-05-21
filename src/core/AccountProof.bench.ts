import { bench, describe } from 'vp/test'
import * as AccountProof from './AccountProof.js'

const accountProofSegment =
  '0xf90211a090dcaf88c40c7bbc95a912cbdde67c175767b31173df9ee4b0d733bfdd511c43a0babe369f6b12092f49181ae04ca173fb68d1a5456f18d20fa32cbd3f9aa75e9da0473ecf8a7e36a829e75039a3b055e51b8332cbf03324ab4af2066bbd6fbf0021'

const baseProof: AccountProof.Rpc = {
  address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
  balance: '0xde0b6b3a7640000',
  codeHash:
    '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  nonce: '0x2a',
  storageHash:
    '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  accountProof: Array.from(
    { length: 6 },
    () => accountProofSegment as `0x${string}`,
  ),
  storageProof: [],
}

function withSlots(count: number): AccountProof.Rpc {
  return {
    ...baseProof,
    storageProof: Array.from({ length: count }, (_, i) => ({
      key: ('0x' + i.toString(16).padStart(64, '0')) as `0x${string}`,
      proof: Array.from(
        { length: 4 },
        () => accountProofSegment as `0x${string}`,
      ),
      value: ('0x' + (i + 1).toString(16)) as `0x${string}`,
    })),
  }
}

const small = withSlots(1)
const medium = withSlots(10)
const large = withSlots(100)

const smallParsed = AccountProof.fromRpc(small)
const mediumParsed = AccountProof.fromRpc(medium)
const largeParsed = AccountProof.fromRpc(large)

describe('AccountProof.fromRpc', () => {
  bench('1 slot', () => {
    AccountProof.fromRpc(small)
  })
  bench('10 slots', () => {
    AccountProof.fromRpc(medium)
  })
  bench('100 slots', () => {
    AccountProof.fromRpc(large)
  })
})

describe('AccountProof.toRpc', () => {
  bench('1 slot', () => {
    AccountProof.toRpc(smallParsed)
  })
  bench('10 slots', () => {
    AccountProof.toRpc(mediumParsed)
  })
  bench('100 slots', () => {
    AccountProof.toRpc(largeParsed)
  })
})
