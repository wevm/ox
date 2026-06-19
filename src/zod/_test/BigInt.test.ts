import { describe, expect, test } from 'vp/test'
import * as z_BigInt from '../BigInt.js'
import * as z from 'zod/mini'

test('BigInt decodes and encodes hex quantities', () => {
  expect(z.decode(z_BigInt.BigInt, '0x2a')).toMatchInlineSnapshot(`42n`)
  expect(z.encode(z_BigInt.BigInt, 42n)).toMatchInlineSnapshot(`"0x2a"`)
  expect(z.safeDecode(z_BigInt.BigInt, '0x').success).toBe(false)
})

describe('BigIntToRpc', () => {
  test('accepts numberish encode inputs', () => {
    expect(z.encode(z_BigInt.BigIntToRpc, 42n)).toBe('0x2a')
    expect(z.encode(z_BigInt.BigIntToRpc, 42)).toBe('0x2a')
    expect(z.encode(z_BigInt.BigIntToRpc, '0x2a')).toBe('0x2a')
  })
})
