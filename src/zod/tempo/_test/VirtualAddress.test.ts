import { describe, expect, test } from 'vp/test'
import * as z_VirtualAddress from '../VirtualAddress.js'
import * as z from 'zod/mini'

const address = '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506'

describe('VirtualAddress', () => {
  test('accepts valid virtual addresses', () => {
    expect(z.safeDecode(z_VirtualAddress.VirtualAddress, address).success).toBe(
      true,
    )
  })

  test('rejects non-virtual addresses', () => {
    expect(
      z.safeDecode(
        z_VirtualAddress.VirtualAddress,
        '0x0000000000000000000000000000000000000000',
      ).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('decodes and encodes parts', () => {
    expect(
      z.decode(z_VirtualAddress.from, {
        masterId: '0x58e21090',
        userTag: '0x010203040506',
      }),
    ).toMatchInlineSnapshot(`"0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506"`)
    expect(z.encode(z_VirtualAddress.from, address)).toMatchInlineSnapshot(`
      {
        "masterId": "0x58e21090",
        "userTag": "0x010203040506",
      }
    `)
  })
})
