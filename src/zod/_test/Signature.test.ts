import { describe, expect, test } from 'vp/test'
import * as z_Signature from '../Signature.js'
import * as z from 'zod/mini'

const r = `0x${'11'.repeat(32)}` as const
const s = `0x${'22'.repeat(32)}` as const

describe('Signature', () => {
  test('decodes and encodes recovered signatures', () => {
    expect(z.decode(z_Signature.Signature, { r, s, yParity: '0x1' }))
      .toMatchInlineSnapshot(`
        {
          "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
          "yParity": 1,
        }
      `)
    expect(z.encode(z_Signature.Signature, { r, s, yParity: 1 }))
      .toMatchInlineSnapshot(`
        {
          "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
          "yParity": "0x1",
        }
      `)
  })

  test('SignatureToRpc accepts numberish encode inputs', () => {
    const expected = { r, s, yParity: '0x1' }
    expect(z.encode(z_Signature.SignatureToRpc, { r, s, yParity: 1 })).toEqual(
      expected,
    )
    expect(
      z.encode(z_Signature.SignatureToRpc, { r, s, yParity: '0x1' }),
    ).toEqual(expected)
  })

  test('validates signature variants', () => {
    expect(z.decode(z_Signature.Legacy, { r, s, v: '0x1b' }))
      .toMatchInlineSnapshot(`
        {
          "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "s": "0x2222222222222222222222222222222222222222222222222222222222222222",
          "v": 27,
        }
      `)
    expect(z.decode(z_Signature.Tuple, ['0x1', r, s])).toMatchInlineSnapshot(`
        [
          "0x1",
          "0x1111111111111111111111111111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        ]
      `)
    expect(
      z.safeDecode(z_Signature.Signature, { r, s, yParity: '0x2' }).success,
    ).toBe(false)
    expect(z.safeDecode(z_Signature.Tuple, ['0x2', r, s]).success).toBe(false)
  })
})
