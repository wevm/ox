import type { Engine } from 'ox'
import { Hash as WasmHash } from 'ox/wasm'
import { expectTypeOf, test } from 'vp/test'

type Created = Awaited<ReturnType<typeof WasmHash.create>>

test('every primitive is present, so callers need no assertion', () => {
  expectTypeOf<Created['Hash']['blake3']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['keccak256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['sha256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['ripemd160']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Hash']['hmacSha256']>().toEqualTypeOf<
    (key: Uint8Array, message: Uint8Array) => Uint8Array
  >()
})

test('the result is still an engine, so `Engine.set` accepts it', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
