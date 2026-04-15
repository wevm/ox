import { describe, expect, test } from 'vitest'
import * as ZoneId from './ZoneId.js'

describe('fromChainId', () => {
  test('default', () => {
    expect(ZoneId.fromChainId(4_217_000_006)).toBe(6)
  })

  test('zone 1', () => {
    expect(ZoneId.fromChainId(4_217_000_001)).toBe(1)
  })

  test('zone 28', () => {
    expect(ZoneId.fromChainId(4_217_000_028)).toBe(28)
  })
})

describe('toChainId', () => {
  test('default', () => {
    expect(ZoneId.toChainId(6)).toBe(4_217_000_006)
  })

  test('zone 1', () => {
    expect(ZoneId.toChainId(1)).toBe(4_217_000_001)
  })

  test('zone 28', () => {
    expect(ZoneId.toChainId(28)).toBe(4_217_000_028)
  })
})

describe('roundtrip', () => {
  test('fromChainId → toChainId', () => {
    const chainId = 4_217_000_006
    expect(ZoneId.toChainId(ZoneId.fromChainId(chainId))).toBe(chainId)
  })

  test('toChainId → fromChainId', () => {
    const zoneId = 42
    expect(ZoneId.fromChainId(ZoneId.toChainId(zoneId))).toBe(zoneId)
  })
})
