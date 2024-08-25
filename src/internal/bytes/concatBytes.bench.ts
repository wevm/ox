import * as ethjs from '@ethereumjs/util'
import * as ethers from 'ethers'
import { Bytes } from 'ox'
import { bench, describe } from 'vitest'
import { concatBytes } from './concatBytes.js'

describe('concat (bytes)', () => {
  bench('ox', () => {
    concatBytes(
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
    )
  })

  bench('@ethereumjs/util', () => {
    ethjs.concatBytes(
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
    )
  })

  bench('ethers', () => {
    ethers.concat([
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
      Bytes.random(64),
    ])
  })
})
