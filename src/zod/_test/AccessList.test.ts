import { describe, expect, test } from 'vp/test'
import * as z_AccessList from '../AccessList.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const storageKey = `0x${'11'.repeat(32)}` as const

describe('AccessList', () => {
  test('validates object and tuple access lists', () => {
    expect(
      z.decode(z_AccessList.AccessList, [
        { address, storageKeys: [storageKey] },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "storageKeys": [
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          ],
        },
      ]
    `)
    expect(z.decode(z_AccessList.Tuple, [[address, [storageKey]]]))
      .toMatchInlineSnapshot(`
        [
          [
            "0x0000000000000000000000000000000000000000",
            [
              "0x1111111111111111111111111111111111111111111111111111111111111111",
            ],
          ],
        ]
      `)
  })

  test('rejects invalid storage keys', () => {
    expect(
      z.safeDecode(z_AccessList.AccessList, [
        { address, storageKeys: ['0x11'] },
      ]).success,
    ).toBe(false)
  })
})
