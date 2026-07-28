import { Hash as WasmHash } from 'ox/wasm'
import { expectTypeOf, test } from 'vp/test'
import type * as CoreEngine from '../../core/Engine.js'
import * as CoreHash from '../../core/Hash.js'

type Slot = Awaited<ReturnType<typeof WasmHash.engine>>

test('every primitive is present, so callers need no assertion', () => {
  expectTypeOf<Slot['blake3']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['keccak256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['sha256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['ripemd160']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['hmacSha256']>().toEqualTypeOf<
    (key: Uint8Array, message: Uint8Array) => Uint8Array
  >()
})

test('the result is the raw slot, so `Engine.install` accepts it', () => {
  expectTypeOf<{ Hash: Slot }>().toExtend<CoreEngine.Engine>()
})

test('the WASM namespace exposes the public Hash API', () => {
  expectTypeOf(WasmHash.sha256).toEqualTypeOf(CoreHash.sha256)
  expectTypeOf<typeof WasmHash>().not.toHaveProperty('create')
})
