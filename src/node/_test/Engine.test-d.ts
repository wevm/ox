import { Engine } from 'ox/node'
import { expectTypeOf, test } from 'vp/test'
import * as CoreEngine from '../../core/Engine.js'

type Installed = Awaited<ReturnType<typeof Engine.install>>
type Uninstalled = Awaited<ReturnType<typeof Engine.engine>>

test('install and engine expose the same precise engine', () => {
  expectTypeOf<Installed>().toEqualTypeOf<Uninstalled>()
  expectTypeOf<Installed['Hash']['sha256']>().toEqualTypeOf<
    (input: Uint8Array) => Uint8Array
  >()
})

test('the Node Engine namespace exposes synchronous core operations', () => {
  expectTypeOf(Engine.get).toEqualTypeOf(CoreEngine.get)
  expectTypeOf(Engine.reset).toEqualTypeOf(CoreEngine.reset)
  expectTypeOf(Engine.set).toEqualTypeOf(CoreEngine.set)
  expectTypeOf(Engine.with).toEqualTypeOf(CoreEngine.with)
})

test('the replaced aliases are absent', () => {
  expectTypeOf<typeof Engine>().not.toHaveProperty('create')
  expectTypeOf<typeof Engine>().not.toHaveProperty('load')
})
