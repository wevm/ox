import { formatUnits as formatUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { formatValue } from './format.js'

describe('Format Unit', () => {
  bench('viem: `Unit.formatValue`', () => {
    formatValue(40000000000000000000n, 18)
  })

  bench('ethers: `formatUnits`', () => {
    formatUnits_ethers(40000000000000000000n, 18)
  })
})
