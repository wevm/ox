import { describe, expect, test } from 'vp/test'
import * as z_Bytes from '../Bytes.js'
import * as z from 'zod/mini'

describe('Bytes', () => {
  test('decodes and encodes byte arrays', () => {
    expect(z.decode(z_Bytes.Bytes, '0x0102')).toMatchInlineSnapshot(`
      Uint8Array [
        1,
        2,
      ]
    `)
    expect(
      z.encode(z_Bytes.Bytes, new Uint8Array([1, 2])),
    ).toMatchInlineSnapshot(`"0x0102"`)
  })

  test('validates sized byte arrays', () => {
    expect(z.decode(z_Bytes.Bytes32, `0x${'00'.repeat(32)}`)).toHaveLength(32)
    expect(z.safeDecode(z_Bytes.Bytes32, '0x0102').success).toBe(false)
    expect(z.safeEncode(z_Bytes.Bytes32, new Uint8Array([1, 2])).success).toBe(
      false,
    )
    expect(z.safeDecode(z_Bytes.Bytes, '0x0').success).toBe(false)
  })
})
