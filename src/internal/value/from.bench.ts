import { parseUnits as parseUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { parseValue } from './from.js'

describe('Parse Unit', () => {
  bench('viem: `parseValue`', () => {
    parseValue('40', 18)
  })

  bench('ethers: `parseUnits`', () => {
    parseUnits_ethers('40', 18)
  })
})
