import { formatAbiParameter, parseAbiParameter } from 'abitype'
import { ParamType } from 'ethers'
import { AbiParameter } from 'ox'
import { bench, describe } from 'vitest'

describe('Format basic ABI Parameter', () => {
  const basic = { type: 'address', name: 'foo' }

  bench('ox', () => {
    AbiParameter.format(basic)
  })

  bench('abitype', () => {
    formatAbiParameter(basic)
  })

  bench('ethers@6', () => {
    ParamType.from(basic).format('minimal')
  })
})

describe('Format inline tuple ABI Parameter', () => {
  const inlineTuple = {
    type: 'tuple',
    components: [
      { type: 'string', name: 'bar' },
      { type: 'string', name: 'baz' },
    ],
    name: 'foo',
  }

  bench('ox', () => {
    AbiParameter.format(inlineTuple)
  })

  bench('abitype', () => {
    formatAbiParameter(inlineTuple)
  })

  bench('ethers@6', () => {
    ParamType.from(inlineTuple).format('minimal')
  })
})

describe('Parse basic ABI Parameter', () => {
  const basic = 'string foo'

  bench('ox', () => {
    AbiParameter.from(basic)
  })

  bench('abitype', () => {
    parseAbiParameter(basic)
  })

  bench('ethers@6', () => {
    ParamType.from(basic)
  })
})

describe('Parse inline tuple ABI Parameter', () => {
  const inlineTuple = '(string bar, string baz) foo'

  bench('ox', () => {
    AbiParameter.from(inlineTuple)
  })

  bench('abitype', () => {
    parseAbiParameter(inlineTuple)
  })

  bench('ethers@6', () => {
    ParamType.from(inlineTuple)
  })
})
