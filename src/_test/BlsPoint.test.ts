import { Bls, BlsPoint } from 'ox'
import { describe, expect, test } from 'vitest'

const privateKey =
  '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'

describe('fromBytes', () => {
  test('G1', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    const publicKeyHex = BlsPoint.toBytes(publicKey)
    expect(BlsPoint.fromBytes(publicKeyHex, 'G1')).toEqual(publicKey)
  })

  test('G2', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKeyHex = BlsPoint.toBytes(publicKey)
    expect(BlsPoint.fromBytes(publicKeyHex, 'G2')).toEqual(publicKey)
  })
})

describe('fromHex', () => {
  test('G1', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    const publicKeyHex = BlsPoint.toHex(publicKey)
    expect(BlsPoint.fromHex(publicKeyHex, 'G1')).toEqual(publicKey)
  })

  test('G2', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKeyHex = BlsPoint.toHex(publicKey)
    expect(BlsPoint.fromHex(publicKeyHex, 'G2')).toEqual(publicKey)
  })
})

describe('toHex', () => {
  test('G1', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    const publicKeyHex = BlsPoint.toHex(publicKey)
    expect(publicKeyHex.toString()).toMatchInlineSnapshot(
      `"0xacafff52270773ad1728df2807c0f1b0b271fa6b37dfb8b2f75448573c76c81bcd6790328a60e40ef5a13343b32d9e66"`,
    )
  })

  test('G2', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKeyHex = BlsPoint.toHex(publicKey)
    expect(publicKeyHex.toString()).toMatchInlineSnapshot(
      `"0xb4698f7611999fba87033b9cf72312c76c683bbc48175e2d4cb275907d6a267ab9840a66e3051e5ed36fd13aa712f9a9024f9fa9b67f716dfb74ae4efb7d9f1b7b43b4679abed6644cf476c12e79f309351ea8452487cd93f66e29e04ebe427c"`,
    )
  })
})

describe('toBytes', () => {
  test('G1', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    const publicKeyHex = BlsPoint.toBytes(publicKey)
    expect(publicKeyHex).toMatchInlineSnapshot(
      `
      Uint8Array [
        172,
        175,
        255,
        82,
        39,
        7,
        115,
        173,
        23,
        40,
        223,
        40,
        7,
        192,
        241,
        176,
        178,
        113,
        250,
        107,
        55,
        223,
        184,
        178,
        247,
        84,
        72,
        87,
        60,
        118,
        200,
        27,
        205,
        103,
        144,
        50,
        138,
        96,
        228,
        14,
        245,
        161,
        51,
        67,
        179,
        45,
        158,
        102,
      ]
    `,
    )
  })

  test('G2', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKeyHex = BlsPoint.toBytes(publicKey)
    expect(publicKeyHex).toMatchInlineSnapshot(
      `
      Uint8Array [
        180,
        105,
        143,
        118,
        17,
        153,
        159,
        186,
        135,
        3,
        59,
        156,
        247,
        35,
        18,
        199,
        108,
        104,
        59,
        188,
        72,
        23,
        94,
        45,
        76,
        178,
        117,
        144,
        125,
        106,
        38,
        122,
        185,
        132,
        10,
        102,
        227,
        5,
        30,
        94,
        211,
        111,
        209,
        58,
        167,
        18,
        249,
        169,
        2,
        79,
        159,
        169,
        182,
        127,
        113,
        109,
        251,
        116,
        174,
        78,
        251,
        125,
        159,
        27,
        123,
        67,
        180,
        103,
        154,
        190,
        214,
        100,
        76,
        244,
        118,
        193,
        46,
        121,
        243,
        9,
        53,
        30,
        168,
        69,
        36,
        135,
        205,
        147,
        246,
        110,
        41,
        224,
        78,
        190,
        66,
        124,
      ]
    `,
    )
  })
})
