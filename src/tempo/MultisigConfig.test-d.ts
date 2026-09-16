import { expectTypeOf, test } from 'vp/test'
import * as MultisigConfig from './MultisigConfig.js'

const config = MultisigConfig.from({
  threshold: 1,
  version: 0n,
  owners: [{ owner: '0x1111111111111111111111111111111111111111', weight: 1 }],
})

test('versions preserve uint64 precision', () => {
  expectTypeOf(config.version).toEqualTypeOf<bigint | undefined>()
  // @ts-expect-error Config versions use bigint, never number.
  MultisigConfig.from({ ...config, version: 1 })
  // @ts-expect-error The chain must explicitly configure a recovery factory.
  MultisigConfig.getAddress(config)
})
