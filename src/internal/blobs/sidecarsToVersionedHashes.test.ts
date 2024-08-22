import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { kzg } from '../../../test/kzg.js'

test('default', () => {
  {
    const blobs = Blobs.from('0xdeadbeef')
    const sidecars = Blobs.toSidecars(blobs, { kzg })
    expect(Blobs.sidecarsToVersionedHashes(sidecars)).toMatchInlineSnapshot(`
      [
        Uint8Array [
          1,
          162,
          71,
          9,
          211,
          153,
          126,
          139,
          33,
          127,
          229,
          70,
          10,
          239,
          16,
          238,
          81,
          85,
          19,
          206,
          186,
          3,
          98,
          191,
          45,
          2,
          163,
          186,
          115,
          215,
          203,
          9,
        ],
      ]
    `)
  }

  {
    const blobs = Blobs.from('0xdeadbeef', { as: 'bytes' })
    const sidecars = Blobs.toSidecars(blobs, { kzg })
    expect(Blobs.sidecarsToVersionedHashes(sidecars)).toMatchInlineSnapshot(`
      [
        Uint8Array [
          1,
          162,
          71,
          9,
          211,
          153,
          126,
          139,
          33,
          127,
          229,
          70,
          10,
          239,
          16,
          238,
          81,
          85,
          19,
          206,
          186,
          3,
          98,
          191,
          45,
          2,
          163,
          186,
          115,
          215,
          203,
          9,
        ],
      ]
    `)
  }
})

test('args: as', () => {
  {
    const blobs = Blobs.from('0xdeadbeef')
    const sidecars = Blobs.toSidecars(blobs, { kzg })
    expect(
      Blobs.sidecarsToVersionedHashes(sidecars, {
        as: 'bytes',
      }),
    ).toMatchInlineSnapshot(`
    [
      Uint8Array [
        1,
        162,
        71,
        9,
        211,
        153,
        126,
        139,
        33,
        127,
        229,
        70,
        10,
        239,
        16,
        238,
        81,
        85,
        19,
        206,
        186,
        3,
        98,
        191,
        45,
        2,
        163,
        186,
        115,
        215,
        203,
        9,
      ],
    ]
  `)
  }

  {
    const blobs = Blobs.from('0xdeadbeef', { as: 'bytes' })
    const sidecars = Blobs.toSidecars(blobs, { kzg })
    expect(
      Blobs.sidecarsToVersionedHashes(sidecars, {
        as: 'hex',
      }),
    ).toMatchInlineSnapshot(`
      [
        "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
      ]
    `)
  }
})
