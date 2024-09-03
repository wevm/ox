import { parseUnits as parseUnits_ethers } from 'ethers'
import { bench, describe } from 'vitest'
import { Value_from } from './from.js'

describe('Parse Value', () => {
  bench('ox: `Value.from`', () => {
    Value_from('40', 18)
  })

  bench('ethers: `parseUnits`', () => {
    parseUnits_ethers('40', 18)
  })
})
