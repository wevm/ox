import { Engine, HdKey } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

const versions = {
  private: 0x0488_ade4,
  public: 0x0488_b21e,
}

describe('Versions', () => {
  test('is the engine version-byte contract', () => {
    expectTypeOf<HdKey.Versions>().toEqualTypeOf<Engine.HdKeyVersions>()
  })
})

describe('fromExtendedKey', () => {
  test('accepts custom versions', () => {
    expectTypeOf(
      HdKey.fromExtendedKey('xprv', { versions }),
    ).toEqualTypeOf<HdKey.HdKey>()
  })
})

describe('fromJson', () => {
  test('accepts custom versions', () => {
    expectTypeOf(
      HdKey.fromJson({ xpriv: 'xprv' }, { versions }),
    ).toEqualTypeOf<HdKey.HdKey>()
  })
})

describe('Engine', () => {
  test('uses plain portable node data', () => {
    expectTypeOf<Engine.HdKeyNode>().toEqualTypeOf<{
      depth: number
      identifier: Uint8Array
      index: number
      privateKey: Uint8Array
      privateExtendedKey: string
      publicKey: Uint8Array
      publicExtendedKey: string
      versions: Engine.HdKeyVersions
    }>()
  })

  test('defines all three operations over the portable node', () => {
    expectTypeOf<NonNullable<Engine.HdKey['derive']>>().toEqualTypeOf<
      (
        privateExtendedKey: string,
        path: string,
        versions: Engine.HdKeyVersions,
      ) => Engine.HdKeyNode
    >()
    expectTypeOf<NonNullable<Engine.HdKey['fromExtendedKey']>>().toEqualTypeOf<
      (extendedKey: string, versions: Engine.HdKeyVersions) => Engine.HdKeyNode
    >()
    expectTypeOf<NonNullable<Engine.HdKey['fromSeed']>>().toEqualTypeOf<
      (seed: Uint8Array, versions: Engine.HdKeyVersions) => Engine.HdKeyNode
    >()
  })
})
