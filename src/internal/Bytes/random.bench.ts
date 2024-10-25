import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { Bytes } from 'ox'
import { bench, describe } from 'vitest'

describe('Bytes.random', () => {
  bench('ox', () => {
    Bytes.random(128)
  })

  bench('@ethereumjs/util', () => {
    ethjs.randomBytes(128)
  })

  bench('ethers', () => {
    ethers.randomBytes(128)
  })
})
