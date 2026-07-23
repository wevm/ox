import { describe, expect, test } from 'vitest'
import * as ZoneId from './ZoneId.js'

describe('fromChainId', () => {
  test('default', () => {
    expect(ZoneId.chainIdBase).toMatchInlineSnapshot(`421700000`)
    expect(ZoneId.fromChainId(421_700_001)).toMatchInlineSnapshot(`1`)
  })

  test('Moderato', () => {
    expect(ZoneId.fromChainId(1_424_310_028, 42_431)).toMatchInlineSnapshot(
      `28`,
    )
  })

  test('unsupported source id', () => {
    expect(() =>
      // @ts-expect-error Unsupported source ID.
      ZoneId.fromChainId(421_700_001, 1),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZoneId.UnsupportedSourceIdError: Source chain ID "1" is not supported.

      Supported source chain IDs: 4217, 42431.]
    `)
  })
})

describe('toChainId', () => {
  test('default', () => {
    expect(ZoneId.toChainId(1)).toMatchInlineSnapshot(`421700001`)
  })

  test('Moderato', () => {
    expect(ZoneId.toChainId(28, 42_431)).toMatchInlineSnapshot(`1424310028`)
  })

  test('wraps within the source chain range', () => {
    expect(ZoneId.toChainId(1_002_610_001)).toMatchInlineSnapshot(`421700001`)
    expect(ZoneId.toChainId(723_173_649, 42_431)).toMatchInlineSnapshot(
      `1424310001`,
    )
  })

  test('unsupported source id', () => {
    expect(() =>
      // @ts-expect-error Unsupported source ID.
      ZoneId.toChainId(1, 1),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZoneId.UnsupportedSourceIdError: Source chain ID "1" is not supported.

      Supported source chain IDs: 4217, 42431.]
    `)
  })
})

describe('roundtrip', () => {
  test('fromChainId → toChainId', () => {
    const chainId = 421_700_006
    expect(ZoneId.toChainId(ZoneId.fromChainId(chainId))).toMatchInlineSnapshot(
      `421700006`,
    )
  })

  test('toChainId → fromChainId', () => {
    const zoneId = 42
    expect(ZoneId.fromChainId(ZoneId.toChainId(zoneId))).toMatchInlineSnapshot(
      `42`,
    )
  })

  test('Moderato', () => {
    const zoneId = 42
    const sourceId = 42_431
    const chainId = ZoneId.toChainId(zoneId, sourceId)
    expect(ZoneId.fromChainId(chainId, sourceId)).toMatchInlineSnapshot(`42`)
  })
})
