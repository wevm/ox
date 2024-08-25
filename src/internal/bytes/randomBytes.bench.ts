import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import { randomBytes } from './randomBytes.js'

describe('randomBytes', () => {
  bench('ox', () => {
    randomBytes(128)
  })

  bench('@ethereumjs/util', () => {
    ethjs.randomBytes(128)
  })

  bench('ethers', () => {
    ethers.randomBytes(128)
  })
})
