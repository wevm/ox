import type { Bytes, Hex } from 'ox'
import { Authentication } from 'ox/webauthn'
import { expectTypeOf, test } from 'vitest'

test('getSignPayload: default `as` infers Hex payload', () => {
  const { payload } = Authentication.getSignPayload({
    challenge: '0xdeadbeef',
    origin: 'https://example.com',
    rpId: 'example.com',
  })
  expectTypeOf(payload).toEqualTypeOf<Hex.Hex>()
})

test("getSignPayload: as: 'Hex' infers Hex payload", () => {
  const { payload } = Authentication.getSignPayload({
    as: 'Hex',
    challenge: '0xdeadbeef',
    origin: 'https://example.com',
    rpId: 'example.com',
  })
  expectTypeOf(payload).toEqualTypeOf<Hex.Hex>()
})

test("getSignPayload: as: 'Bytes' infers Bytes payload", () => {
  const { payload } = Authentication.getSignPayload({
    as: 'Bytes',
    challenge: '0xdeadbeef',
    origin: 'https://example.com',
    rpId: 'example.com',
  })
  expectTypeOf(payload).toEqualTypeOf<Bytes.Bytes>()
})
