import { describe, expect, test } from 'vitest'
import * as ZoneId from './ZoneId.js'

describe('fromChainId', () => {
  test('default', () => {
    expect(ZoneId.fromChainId(421_700_026)).toBe(26)
  })

  test('zone 1', () => {
    expect(ZoneId.fromChainId(421_700_001)).toBe(1)
  })

  test('zone 28', () => {
    expect(ZoneId.fromChainId(421_700_028)).toBe(28)
  })
})

describe('toChainId', () => {
  test('default', () => {
    expect(ZoneId.toChainId(26)).toBe(421_700_026)
  })

  test('zone 1', () => {
    expect(ZoneId.toChainId(1)).toBe(421_700_001)
  })

  test('zone 28', () => {
    expect(ZoneId.toChainId(28)).toBe(421_700_028)
  })
})

describe('roundtrip', () => {
  test('fromChainId → toChainId', () => {
    const chainId = 421_700_026
    expect(ZoneId.toChainId(ZoneId.fromChainId(chainId))).toBe(chainId)
  })

  test('toChainId → fromChainId', () => {
    const zoneId = 42
    expect(ZoneId.fromChainId(ZoneId.toChainId(zoneId))).toBe(zoneId)
  })
})
