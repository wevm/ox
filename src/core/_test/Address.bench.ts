import * as ethers from 'ethers'
import { Address } from 'ox'
import { bench, describe } from 'vitest'

describe('Address', () => {
  bench('ox: `Address.from`', () => {
    Address.from('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC')
  })

  bench('ethers: `getAddress`', () => {
    ethers.getAddress('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC')
  })
})

describe('Address.checksum', () => {
  bench('ox: cached', () => {
    Address.checksum('0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac')
  })
})

describe('Address.validate', () => {
  bench('ox: valid (checksummed)', () => {
    Address.validate('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC')
  })

  bench('ox: invalid', () => {
    Address.validate('0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678A')
  })
})
