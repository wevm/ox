import { expectTypeOf, test } from 'vp/test'
import * as AccountConfig from './AccountConfig.js'

const input = {
  owners: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      weight: 1,
    },
  ],
  threshold: 1,
} as const satisfies AccountConfig.Input

test('from returns a complete configuration', () => {
  const config = AccountConfig.from(input)
  const numeric = AccountConfig.from({ ...input, version: 1 })
  const zero = AccountConfig.from({ ...input, version: 0 })

  expectTypeOf(config).toMatchTypeOf<AccountConfig.Config>()
  expectTypeOf(config.version).toEqualTypeOf<0n>()
  expectTypeOf(numeric.version).toEqualTypeOf<bigint>()
  expectTypeOf(zero.version).toEqualTypeOf<0n>()
})

test('update returns the next complete configuration', () => {
  const config = AccountConfig.update(AccountConfig.from(input), {
    owners: input.owners,
    threshold: 1,
  })

  expectTypeOf(config).toEqualTypeOf<AccountConfig.Config>()
  expectTypeOf(config.version).toEqualTypeOf<bigint>()
})

test('RPC configurations use hexadecimal versions', () => {
  const rpc = AccountConfig.toRpc(AccountConfig.from(input))

  expectTypeOf(rpc).toEqualTypeOf<AccountConfig.Rpc>()
  expectTypeOf(rpc.version).toEqualTypeOf<`0x${string}`>()
})

test('complete configurations require a version', () => {
  // @ts-expect-error Complete configurations include their version.
  const config: AccountConfig.Config = input

  expectTypeOf(config).toEqualTypeOf<AccountConfig.Config>()
})

test('sign payloads take the version from config', () => {
  AccountConfig.getSignPayload({
    account: '0x2222222222222222222222222222222222222222',
    config: { version: 1 },
    payload: '0x1234',
  })

  AccountConfig.getSignPayload({
    account: '0x2222222222222222222222222222222222222222',
    // @ts-expect-error A configuration version is required.
    config: {},
    payload: '0x1234',
  })
})
