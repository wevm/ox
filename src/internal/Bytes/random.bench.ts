import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import { Bytes_random } from './random.js'

describe('Bytes.random', () => {
  bench('ox', () => {
    Bytes_random(128)
  })

  bench('@ethereumjs/util', () => {
    ethjs.randomBytes(128)
  })

  bench('ethers', () => {
    ethers.randomBytes(128)
  })
})
