import { Hash as NodeHash } from 'ox/node'
import { expectTypeOf, test } from 'vp/test'
import type * as CoreEngine from '../../core/Engine.js'
import * as CoreHash from '../../core/Hash.js'

type Slot = Awaited<ReturnType<typeof NodeHash.engine>>

test('every implemented primitive is present', () => {
  expectTypeOf<Slot['createRipemd160']>().toEqualTypeOf<
    () => CoreEngine.HashState
  >()
  expectTypeOf<Slot['createSha256']>().toEqualTypeOf<
    () => CoreEngine.HashState
  >()
  expectTypeOf<Slot['hmacSha256']>().toEqualTypeOf<
    (key: Uint8Array, message: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['ripemd160']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['sha256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('blake3')
  expectTypeOf<Slot>().not.toHaveProperty('createBlake3')
  expectTypeOf<Slot>().not.toHaveProperty('createHmacSha256')
  expectTypeOf<Slot>().not.toHaveProperty('createKeccak256')
  expectTypeOf<Slot>().not.toHaveProperty('keccak256')
})

test('the result is the raw slot, so `Engine.install` accepts it', () => {
  expectTypeOf<{ Hash: Slot }>().toExtend<CoreEngine.Engine>()
})

test('the Node namespace exposes the public Hash API', () => {
  expectTypeOf(NodeHash.blake3).toEqualTypeOf(CoreHash.blake3)
  expectTypeOf(NodeHash.createSha256).toEqualTypeOf(CoreHash.createSha256)
  expectTypeOf(NodeHash.sha256).toEqualTypeOf(CoreHash.sha256)
  expectTypeOf<typeof NodeHash>().not.toHaveProperty('create')
})
