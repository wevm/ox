import { describe, expect, test } from 'vitest'

import { parseAsn1Signature } from '../../internal/webauthn.js'

describe('parseAsn1Signature', async () => {
  test('default', () => {
    expect(
      parseAsn1Signature(
        Uint8Array.from([
          48, 69, 2, 32, 79, 143, 120, 60, 220, 10, 231, 9, 139, 135, 253, 127,
          83, 116, 115, 205, 118, 246, 89, 29, 96, 202, 184, 63, 37, 136, 20,
          131, 182, 97, 162, 16, 2, 33, 0, 213, 132, 172, 110, 131, 68, 95, 21,
          118, 171, 90, 245, 129, 169, 178, 169, 44, 109, 209, 251, 203, 218,
          104, 37, 2, 27, 173, 4, 177, 61, 186, 224,
        ]),
      ),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x4f8f783cdc0ae7098b87fd7f537473cd76f6591d60cab83f25881483b661a210",
        "s": "0x2a7b53907cbba0eb8954a50a7e564d56907928b1db3d365ff19e1dbe4b256a71",
      }
    `)
  })

  test('behavior: s > n / 2', () => {
    expect(
      parseAsn1Signature(
        Uint8Array.from([
          48, 68, 2, 32, 98, 40, 12, 62, 68, 211, 20, 235, 70, 207, 44, 165,
          119, 160, 68, 103, 87, 46, 221, 175, 187, 129, 65, 55, 114, 64, 101,
          55, 252, 203, 175, 63, 2, 32, 84, 75, 185, 8, 46, 139, 199, 154, 24,
          141, 112, 99, 242, 10, 70, 208, 40, 120, 126, 131, 61, 58, 105, 70,
          84, 72, 9, 4, 235, 225, 80, 169,
        ]),
      ),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x62280c3e44d314eb46cf2ca577a04467572eddafbb81413772406537fccbaf3f",
        "s": "0x544bb9082e8bc79a188d7063f20a46d028787e833d3a694654480904ebe150a9",
      }
    `)
  })
})
