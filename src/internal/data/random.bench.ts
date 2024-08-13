import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { Data } from 'stdeth'
import { bench, describe } from 'vitest'

describe('randomBytes', () => {
  bench('stdeth', () => {
    Data.randomBytes(128)
  })

  bench('@ethereumjs/util', () => {
    ethjs.randomBytes(128)
  })

  bench('ethers', () => {
    ethers.randomBytes(128)
  })
})
