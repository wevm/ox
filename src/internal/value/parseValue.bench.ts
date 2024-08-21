import { parseUnits as parseUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { parseValue } from './parseValue.js'

describe('Parse Value', () => {
  bench('ox: `parseValue`', () => {
    parseValue('40', 18)
  })

  bench('ethers: `parseUnits`', () => {
    parseUnits_ethers('40', 18)
  })
})
