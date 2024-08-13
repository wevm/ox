import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { Data } from 'stdeth'
import { bench, describe } from 'vitest'

describe('concat (bytes)', () => {
  bench('stdeth', () => {
    Data.concat(
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
  bench('stdeth', () => {
    Data.concat(
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
