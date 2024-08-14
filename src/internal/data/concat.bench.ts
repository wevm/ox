import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { Data } from 'ox'
import { bench, describe } from 'vitest'
import { concat } from './concat.js'

describe('concat (bytes)', () => {
  bench('ox', () => {
    concat(
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
    )
  })

  bench('@ethereumjs/util', () => {
    ethjs.concatBytes(
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
    )
  })

  bench('ethers', () => {
    ethers.concat([
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
      Data.randomBytes(64),
    ])
  })
})

// TODO: random hex
describe('concat (hex)', () => {
  bench('ox', () => {
    concat(
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
