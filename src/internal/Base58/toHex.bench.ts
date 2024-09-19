import { decodeBase58, toBeHex } from 'ethers'
import { bench, describe } from 'vitest'
import { Base58_toHex } from './toHex.js'

describe('base58 decode (hex)', () => {
  bench('ethers', () => {
    toBeHex(decodeBase58('233QC4'))
  })

  bench('ox', () => {
    Base58_toHex('233QC4')
  })
})
