import { bench, describe } from 'vp/test'
import * as SignatureErc6492 from './SignatureErc6492.js'

const args = {
  data: '0xdeadbeef',
  signature:
    '0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c',
  to: '0xcafebabecafebabecafebabecafebabecafebabe',
} as const

const wrapped = SignatureErc6492.wrap(args)

describe('SignatureErc6492', () => {
  bench('wrap', () => {
    SignatureErc6492.wrap(args)
  })

  bench('unwrap', () => {
    SignatureErc6492.unwrap(wrapped)
  })
})
