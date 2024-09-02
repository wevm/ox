import { formatUnits as formatUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { Value_format } from './format.js'

describe('Format Value', () => {
  bench('ox: `Value.format`', () => {
    Value_format(40000000000000000000n, 18)
  })

  bench('ethers: `formatUnits`', () => {
    formatUnits_ethers(40000000000000000000n, 18)
  })
})
