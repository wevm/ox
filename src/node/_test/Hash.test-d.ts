import type { Engine } from 'ox'
import { Hash as NodeHash } from 'ox/node'
import { expectTypeOf, test } from 'vp/test'

type Created = Awaited<ReturnType<typeof NodeHash.create>>

test('every implemented primitive is present', () => {
  expectTypeOf<Created['Hash']['hmacSha256']>().toEqualTypeOf<
    (key: Uint8Array, message: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['ripemd160']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['sha256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['Hash']>().not.toHaveProperty('blake3')
  expectTypeOf<Created['Hash']>().not.toHaveProperty('keccak256')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
