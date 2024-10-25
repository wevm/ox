import { formatUnits as formatUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { format } from './format.js'

describe('Format Value', () => {
  bench('ox: `Value.format`', () => {
    format(40000000000000000000n, 18)
  })

  bench('ethers: `formatUnits`', () => {
    formatUnits_ethers(40000000000000000000n, 18)
  })
})
