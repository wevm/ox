import { expectTypeOf, test } from 'vitest'
import * as MultisigConfig from './MultisigConfig.js'

const input = {
  owners: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      weight: 1,
    },
  ],
  threshold: 1,
} as const satisfies MultisigConfig.Input

test('from returns a complete configuration', () => {
  const config = MultisigConfig.from(input)
  const numeric = MultisigConfig.from({ ...input, version: 1 })
  const zero = MultisigConfig.from({ ...input, version: 0 })

  expectTypeOf(config).toMatchTypeOf<MultisigConfig.Config>()
  expectTypeOf(config.version).toEqualTypeOf<0n>()
  expectTypeOf(numeric.version).toEqualTypeOf<bigint>()
  expectTypeOf(zero.version).toEqualTypeOf<0n>()
})

test('RPC configurations use hexadecimal versions', () => {
  const rpc = MultisigConfig.toRpc(MultisigConfig.from(input))

  expectTypeOf(rpc).toEqualTypeOf<MultisigConfig.Rpc>()
  expectTypeOf(rpc.version).toEqualTypeOf<`0x${string}`>()
})

test('complete configurations require a version', () => {
  // @ts-expect-error Complete configurations include their version.
  const config: MultisigConfig.Config = input

  expectTypeOf(config).toEqualTypeOf<MultisigConfig.Config>()
})

test('sign payloads take the version from config', () => {
  MultisigConfig.getSignPayload({
    account: '0x2222222222222222222222222222222222222222',
    config: { version: 1 },
    payload: '0x1234',
  })

  MultisigConfig.getSignPayload({
    account: '0x2222222222222222222222222222222222222222',
    // @ts-expect-error A configuration version is required.
    config: {},
    payload: '0x1234',
  })
})
