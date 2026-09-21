import { describe, expect, test } from 'vite-plus/test'
import { Hex, P256, Rlp, Secp256k1, Signature, TxFrameSignature } from 'ox'

const arbitrary = { scheme: 0, msg: '0x', signature: '0xaabb' } as const
const privateKey = Hex.fromNumber(1, { size: 32 })
const payload = Hex.fromNumber(1, { size: 32 })
const order =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
const publicKey = {
  prefix: 4,
  x: '0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296',
  y: '0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5',
} as const

describe('from', () => {
  test('copies metadata without resolving the signer', () => {
    expect(TxFrameSignature.from(arbitrary)).toEqual(arbitrary)
    expect(TxFrameSignature.from(arbitrary)).not.toBe(arbitrary)
    expect(
      TxFrameSignature.from({ scheme: 1, msg: '0x', signature: '0x' }),
    ).not.toHaveProperty('signer')
  })
})

describe('toTuple', () => {
  test('encodes arbitrary witness bytes in specification order', () => {
    expect(TxFrameSignature.toTuple(arbitrary)).toMatchInlineSnapshot(`
      [
        "0x",
        "0x",
        "0x",
        "0xaabb",
      ]
    `)
    expect(
      Rlp.fromHex(TxFrameSignature.toTuple(arbitrary)),
    ).toMatchInlineSnapshot('"0xc680808082aabb"')
  })

  test('retains explicit message and signer', () => {
    const entry = {
      scheme: 1,
      signer: '0x0000000000000000000000000000000000000000',
      msg: payload,
      signature: '0x',
    } as const
    expect(TxFrameSignature.fromTuple(TxFrameSignature.toTuple(entry))).toEqual(
      entry,
    )
  })
})

describe('fromTuple', () => {
  test('decodes fixed arbitrary tuple', () => {
    expect(TxFrameSignature.fromTuple(['0x', '0x', '0x', '0xaabb'])).toEqual(
      arbitrary,
    )
  })

  test.each(['0x00', '0x0001', '0x1', '0x03'])(
    'rejects scheme %s',
    (scheme) => {
      expect(() =>
        TxFrameSignature.fromTuple([scheme, '0x', '0x', '0x'] as never),
      ).toThrow()
    },
  )

  test.each([
    [],
    ['0x', '0x', '0x'],
    ['0x', '0x', '0x', '0x', '0x'],
    ['0x01', undefined, '0x', '0x'],
    ['0x', '0x0000000000000000000000000000000000000000', '0x', '0x'],
  ])('rejects malformed tuple %#', (...tuple) => {
    expect(() => TxFrameSignature.fromTuple(tuple as never)).toThrow()
  })
})

describe('fromSecp256k1', () => {
  test('uses recovery parity first, followed by padded r and s', () => {
    expect(TxFrameSignature.fromSecp256k1({ r: '0x01', s: '0x02', yParity: 1 }))
      .toMatchInlineSnapshot(`
      {
        "msg": "0x",
        "scheme": 1,
        "signature": "0x0100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002",
      }
    `)
  })

  test('preserves a real Ox signature and metadata', () => {
    const signature = Secp256k1.sign({
      payload,
      privateKey,
      extraEntropy: false,
    })
    const entry = TxFrameSignature.fromSecp256k1(signature, { msg: payload })
    expect(Signature.fromRecoveredBytes(Hex.toBytes(entry.signature))).toEqual(
      signature,
    )
    expect(
      Secp256k1.recoverAddress({
        payload,
        signature: Signature.fromRecoveredBytes(Hex.toBytes(entry.signature)),
      }),
    ).toBe('0x7e5f4552091a69125d5dfcb7b8c2659029395bdf')
    expect(entry.msg).toBe(payload)
  })

  test.each([
    { r: '0x00', s: '0x01', yParity: 0 },
    { r: '0x01', s: '0x02', yParity: 27 },
    {
      r: '0x01',
      s: '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140',
      yParity: 0,
    },
  ])('rejects invalid signature %#', (signature) => {
    expect(() =>
      TxFrameSignature.fromSecp256k1(signature as Signature.Signature),
    ).toThrow()
  })
})

describe('fromP256', () => {
  test('encodes r, s, x, and y without the public key prefix', () => {
    expect(
      TxFrameSignature.fromP256({ r: '0x01', s: '0x02' }, { publicKey })
        .signature,
    ).toMatchInlineSnapshot(
      '"0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000026b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"',
    )
  })

  test('normalizes high-s without mutating the input', () => {
    const signature = Object.freeze({
      r: '0x01',
      s: Hex.fromNumber(order - 2n),
    })
    const entry = TxFrameSignature.fromP256(signature, { publicKey })
    expect(Hex.slice(entry.signature, 32, 64)).toBe(
      Hex.fromNumber(2, { size: 32 }),
    )
    expect(signature.s).toBe(Hex.fromNumber(order - 2n))
  })

  test('preserves a real Ox signature', () => {
    const signature = P256.sign({ payload, privateKey, extraEntropy: false })
    const entry = TxFrameSignature.fromP256(signature, { publicKey })
    expect(
      P256.verify({
        payload,
        publicKey,
        signature: {
          r: Hex.slice(entry.signature, 0, 32),
          s: Hex.slice(entry.signature, 32, 64),
        },
      }),
    ).toBe(true)
  })

  test.each([0n, order, order + 1n])('rejects invalid s %s', (s) => {
    expect(() =>
      TxFrameSignature.fromP256(
        { r: '0x01', s: Hex.fromNumber(s) },
        { publicKey },
      ),
    ).toThrow()
  })
})

describe('assert', () => {
  test('allows placeholders only when a complete signature is not required', () => {
    const entry = { scheme: 1, msg: '0x', signature: '0x' } as const
    expect(() => TxFrameSignature.assert(entry)).not.toThrow()
    expect(() => TxFrameSignature.assert(entry, { signed: true })).toThrow(
      TxFrameSignature.InvalidError,
    )
    expect(() =>
      TxFrameSignature.assert({ ...entry, scheme: 0 }, { signed: true }),
    ).not.toThrow()
  })

  test.each([
    { scheme: 3 },
    { scheme: -1 },
    { scheme: 1.5 },
    { signer: '0x0000000000000000000000000000000000000000' },
    { msg: '0x00' },
    { msg: `0x${'00'.repeat(32)}` },
    { msg: '0x0' },
    { signature: '0xa' },
    { signature: '0xgg' },
    { scheme: 1, signature: '0x01' },
    { scheme: 2, signature: '0x01' },
  ])('rejects invalid entry %#', (fields) => {
    expect(() =>
      TxFrameSignature.assert({ ...arbitrary, ...fields } as never),
    ).toThrow()
  })

  test('rejects raw high-s P-256 encodings', () => {
    const entry = TxFrameSignature.fromP256(
      { r: '0x01', s: '0x02' },
      { publicKey },
    )
    expect(() =>
      TxFrameSignature.assert({
        ...entry,
        signature: Hex.concat(
          Hex.slice(entry.signature, 0, 32),
          Hex.fromNumber(order - 2n, { size: 32 }),
          Hex.slice(entry.signature, 64),
        ),
      }),
    ).toThrow()
  })
})

describe('validate', () => {
  test('reports structural validity without signature verification', () => {
    expect(TxFrameSignature.validate(arbitrary)).toBe(true)
    expect(TxFrameSignature.validate({ ...arbitrary, msg: '0x01' })).toBe(false)
  })
})
