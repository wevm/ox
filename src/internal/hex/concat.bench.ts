import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import { Hex_concat } from './concat.js'

// TODO: random hex
describe('concat (hex)', () => {
  bench('ox', () => {
    Hex_concat(
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
