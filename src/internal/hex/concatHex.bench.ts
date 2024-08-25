import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import { concatHex } from './concatHex.js'

// TODO: random hex
describe('concat (hex)', () => {
  bench('ox', () => {
    concatHex(
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
    )
  })

  bench('ethers', () => {
    ethers.concat([
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
    ])
  })
})
