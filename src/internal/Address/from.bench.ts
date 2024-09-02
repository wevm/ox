import * as ethers from 'ethers'
import { bench, describe } from 'vitest'

import { Address_from } from './from.js'

describe('Address', () => {
  bench('ox: `Address.from`', () => {
    Address_from('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC')
  })

  bench('ethers: `getAddress`', () => {
    ethers.getAddress('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC')
  })
})
