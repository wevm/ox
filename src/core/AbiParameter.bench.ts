import { bench, describe } from 'vp/test'
import * as AbiParameter from './AbiParameter.js'

const parameter = { name: 'spender', type: 'address' } as const
const tuple = {
  components: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  name: 'foo',
  type: 'tuple',
} as const

describe('AbiParameter.from', () => {
  bench('address spender', () => {
    AbiParameter.from('address spender')
  })

  bench('struct Foo', () => {
    AbiParameter.from([
      'struct Foo { address spender; uint256 amount; }',
      'Foo foo',
    ])
  })
})

describe('AbiParameter.format', () => {
  bench('address spender', () => {
    AbiParameter.format(parameter)
  })

  bench('(address spender, uint256 amount) foo', () => {
    AbiParameter.format(tuple)
  })
})
