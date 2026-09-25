import { p256 } from '@noble/curves/nist.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { FrameSignature, Hex, P256, Rlp, Secp256k1, Signature } from 'ox'
import { describe, expect, test } from 'vite-plus/test'

const arbitrary = {
  payload: '0x',
  scheme: 'arbitrary',
  signature: '0xaabb',
} as const
const privateKey = Hex.fromNumber(1, { size: 32 })
const payload = Hex.fromNumber(1, { size: 32 })
const publicKey = {
  prefix: 4,
  x: '0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296',
  y: '0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5',
} as const
const secpBytes =
  '0x0100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002'
const p256Bytes =
  '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000026b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'

describe('from', () => {
  test.each(['0x', '0xaabb'] as const)(
    'constructs an arbitrary signature from %s',
    (signature) => {
      expect(FrameSignature.from(signature)).toEqual({
        payload: '0x',
        scheme: 'arbitrary',
        signature,
      })
    },
  )

  test.each(['0xa', '0xgg', 'aabb'])(
    'rejects malformed signature bytes %s',
    (signature) => {
      expect(() => FrameSignature.from(signature as Hex.Hex)).toThrow()
    },
  )

  test('defaults to arbitrary and the canonical transaction payload', () => {
    expect(FrameSignature.from({ signature: '0xaabb' })).toMatchInlineSnapshot(`
      {
        "payload": "0x",
        "scheme": "arbitrary",
        "signature": "0xaabb",
      }
    `)
    expect(
      FrameSignature.from({
        payload: undefined,
        scheme: undefined,
        signature: '0xaabb',
      }),
    ).toEqual(arbitrary)
  })

  test('copies metadata without resolving the signer', () => {
    expect(FrameSignature.from(arbitrary)).toEqual(arbitrary)
    expect(FrameSignature.from(arbitrary)).not.toBe(arbitrary)
    expect(FrameSignature.from({ scheme: 1 })).toEqual({
      payload: '0x',
      scheme: 1,
    })
  })

  test('preserves structured signatures and public keys', () => {
    const signature = P256.sign({ extraEntropy: false, payload, privateKey })
    const entry = FrameSignature.from({
      payload,
      publicKey,
      scheme: 'p256',
      signature,
    })
    expect(entry).toEqual({ payload, publicKey, scheme: 'p256', signature })
  })

  describe('p256', () => {
    test('constructs a structured entry with default payload', () => {
      const signature = { r: '0x01', s: '0x02' } as const
      const entry = FrameSignature.from({
        publicKey,
        scheme: 'p256',
        signature,
      })
      expect(entry).toEqual({
        payload: '0x',
        publicKey,
        scheme: 'p256',
        signature,
      })
      expect(FrameSignature.toTuple(entry)[3]).toBe(p256Bytes)
    })

    test('preserves metadata and high-s until encoding', () => {
      const signature = Object.freeze({
        r: '0x01',
        s: Hex.fromNumber(p256.Point.Fn.ORDER - 2n),
      })
      const signer = '0x0000000000000000000000000000000000000000'
      const entry = FrameSignature.from({
        payload,
        publicKey,
        scheme: 'p256',
        signature,
        signer,
      })
      expect(entry).toEqual({
        payload,
        publicKey,
        scheme: 'p256',
        signature,
        signer,
      })
      expect(FrameSignature.toTuple(entry)[3]).toBe(p256Bytes)
      expect(entry.signature.s).toBe(signature.s)
    })

    test('rejects a missing public key', () => {
      expect(() =>
        FrameSignature.from({
          scheme: 'p256',
          signature: { r: '0x01', s: '0x02' },
        } as never),
      ).toThrow()
    })
  })

  describe('secp256k1', () => {
    test('constructs a structured entry with default payload', () => {
      const signature = { r: '0x01', s: '0x02', yParity: 1 } as const
      const entry = FrameSignature.from({ scheme: 'secp256k1', signature })
      expect(entry).toEqual({ payload: '0x', scheme: 'secp256k1', signature })
      expect(FrameSignature.toTuple(entry)[3]).toBe(secpBytes)
    })

    test('preserves explicit payload and signer', () => {
      const signature = Secp256k1.sign({ payload, privateKey })
      const signer = '0x0000000000000000000000000000000000000000'
      expect(
        FrameSignature.from({
          payload,
          scheme: 'secp256k1',
          signature,
          signer,
        }),
      ).toEqual({ payload, scheme: 'secp256k1', signature, signer })
    })

    test('rejects invalid parity', () => {
      expect(() =>
        FrameSignature.from({
          scheme: 'secp256k1',
          signature: { r: '0x01', s: '0x02', yParity: 27 },
        }),
      ).toThrow()
    })
  })
})

describe('toTuple', () => {
  test('omitted payload selects the canonical signing hash', () => {
    expect(
      FrameSignature.toTuple({ scheme: 'arbitrary', signature: '0xaabb' }),
    ).toEqual(['0x', '0x', '0x', '0xaabb'])
    expect(FrameSignature.toTuple({ scheme: 'secp256k1' })).toEqual([
      '0x01',
      '0x',
      '0x',
      '0x',
    ])
    expect(
      FrameSignature.toTuple({ payload: undefined, scheme: 'p256' }),
    ).toEqual(['0x02', '0x', '0x', '0x'])
  })

  test('encodes arbitrary witness bytes in specification order', () => {
    expect(FrameSignature.toTuple(arbitrary)).toEqual([
      '0x',
      '0x',
      '0x',
      '0xaabb',
    ])
    expect(
      Rlp.fromHex(FrameSignature.toTuple(arbitrary)),
    ).toMatchInlineSnapshot('"0xc680808082aabb"')
  })

  test.each([0, 'arbitrary'] as const)(
    'encodes arbitrary scheme %s',
    (scheme) => {
      expect(FrameSignature.toTuple({ ...arbitrary, scheme })).toEqual([
        '0x',
        '0x',
        '0x',
        '0xaabb',
      ])
    },
  )

  test.each([1, 'secp256k1'] as const)(
    'encodes secp256k1 scheme %s',
    (scheme) => {
      const entry = FrameSignature.from({
        scheme,
        signature: { r: '0x01', s: '0x02', yParity: 1 },
      })
      expect(FrameSignature.toTuple(entry)).toEqual([
        '0x01',
        '0x',
        '0x',
        secpBytes,
      ])
    },
  )

  test.each([2, 'p256'] as const)('encodes P-256 scheme %s', (scheme) => {
    const entry = FrameSignature.from({
      publicKey,
      scheme,
      signature: { r: '0x01', s: '0x02' },
    })
    expect(FrameSignature.toTuple(entry)).toEqual([
      '0x02',
      '0x',
      '0x',
      p256Bytes,
    ])
  })

  test('retains explicit payload and signer', () => {
    const entry = FrameSignature.from({
      payload,
      scheme: 'secp256k1',
      signer: '0x0000000000000000000000000000000000000000',
    })
    expect(FrameSignature.toTuple(entry)).toEqual([
      '0x01',
      entry.signer,
      payload,
      '0x',
    ])
    expect(FrameSignature.fromTuple(FrameSignature.toTuple(entry))).toEqual(
      entry,
    )
  })

  test('normalizes P-256 high-s without mutating input', () => {
    const signature = Object.freeze({
      r: '0x01',
      s: Hex.fromNumber(p256.Point.Fn.ORDER - 2n),
    })
    const entry = FrameSignature.from({ publicKey, scheme: 'p256', signature })
    expect(FrameSignature.toTuple(entry)[3]).toBe(p256Bytes)
    expect(entry.signature.s).toBe(Hex.fromNumber(p256.Point.Fn.ORDER - 2n))
  })
})

describe('fromTuple', () => {
  test('decodes fixed arbitrary tuple', () => {
    expect(FrameSignature.fromTuple(['0x', '0x', '0x', '0xaabb'])).toEqual(
      arbitrary,
    )
  })

  test('decodes fixed secp256k1 bytes', () => {
    expect(FrameSignature.fromTuple(['0x01', '0x', '0x', secpBytes])).toEqual({
      payload: '0x',
      scheme: 'secp256k1',
      signature: {
        r: Hex.fromNumber(1, { size: 32 }),
        s: Hex.fromNumber(2, { size: 32 }),
        yParity: 1,
      },
    })
  })

  test('decodes fixed P-256 bytes', () => {
    expect(FrameSignature.fromTuple(['0x02', '0x', '0x', p256Bytes])).toEqual({
      payload: '0x',
      publicKey,
      scheme: 'p256',
      signature: {
        r: Hex.fromNumber(1, { size: 32 }),
        s: Hex.fromNumber(2, { size: 32 }),
      },
    })
  })

  test.each([
    ['0x01', 'secp256k1'],
    ['0x02', 'p256'],
  ] as const)('decodes unsigned %s entries', (scheme, name) => {
    expect(FrameSignature.fromTuple([scheme, '0x', '0x', '0x'])).toEqual({
      payload: '0x',
      scheme: name,
    })
  })

  test('round-trips a real secp256k1 signature', () => {
    const signature = Secp256k1.sign({
      extraEntropy: false,
      payload,
      privateKey,
    })
    const entry = FrameSignature.fromTuple(
      FrameSignature.toTuple(
        FrameSignature.from({ payload, scheme: 'secp256k1', signature }),
      ),
    ) as FrameSignature.Secp256k1
    expect(entry.signature).toEqual(signature)
    expect(
      Secp256k1.recoverAddress({ payload, signature: entry.signature! }),
    ).toBe('0x7e5f4552091a69125d5dfcb7b8c2659029395bdf')
  })

  test('round-trips a real P-256 signature', () => {
    const signature = P256.sign({ extraEntropy: false, payload, privateKey })
    const entry = FrameSignature.fromTuple(
      FrameSignature.toTuple(
        FrameSignature.from({ publicKey, scheme: 'p256', signature }),
      ),
    ) as FrameSignature.P256
    expect(
      P256.verify({
        payload,
        publicKey: entry.publicKey!,
        signature: entry.signature!,
      }),
    ).toBe(true)
  })

  test.each(['0x00', '0x0001', '0x1', '0x03'])(
    'rejects scheme %s',
    (scheme) => {
      expect(() =>
        FrameSignature.fromTuple([scheme, '0x', '0x', '0x'] as never),
      ).toThrow()
    },
  )

  test.each([
    [],
    ['0x', '0x', '0x'],
    ['0x', '0x', '0x', '0x', '0x'],
    ['0x01', undefined, '0x', '0x'],
    ['0x', '0x0000000000000000000000000000000000000000', '0x', '0x'],
    ['0x01', '0x', '0x', '0x01'],
    ['0x02', '0x', '0x', '0x01'],
    ['0x01', '0x', '0x', `0x02${secpBytes.slice(4)}`],
    [
      '0x02',
      '0x',
      '0x',
      Hex.concat(
        Hex.slice(p256Bytes, 0, 32),
        Hex.fromNumber(p256.Point.Fn.ORDER - 2n, { size: 32 }),
        Hex.slice(p256Bytes, 64),
      ),
    ],
  ])('rejects malformed tuple %#', (...tuple) => {
    expect(() => FrameSignature.fromTuple(tuple as never)).toThrow()
  })
})

describe('assert', () => {
  test.each([
    FrameSignature.from({ scheme: 1 }),
    FrameSignature.from({ scheme: 2 }),
    FrameSignature.from({ scheme: 'secp256k1' }),
    FrameSignature.from({ scheme: 'p256' }),
  ])('requires signature only when signed for $scheme', (entry) => {
    expect(() => FrameSignature.assert(entry)).not.toThrow()
    expect(() => FrameSignature.assert(entry, { signed: true })).toThrow(
      FrameSignature.InvalidError,
    )
  })

  test('allows empty arbitrary witness even when signed', () => {
    expect(() =>
      FrameSignature.assert(FrameSignature.from({ signature: '0x' }), {
        signed: true,
      }),
    ).not.toThrow()
  })

  test.each([
    { scheme: 3 },
    { scheme: -1 },
    { scheme: 1.5 },
    { scheme: 'invalid' },
    { scheme: 'toString' },
    { signer: '0x0000000000000000000000000000000000000000' },
    { payload: '0x00' },
    { payload: `0x${'00'.repeat(32)}` },
    { payload: '0x0' },
    { signature: '0xa' },
    { signature: '0xgg' },
    { scheme: 1, signature: '0x01' },
    { scheme: 2, signature: '0x01' },
  ])('rejects invalid entry %#', (fields) => {
    expect(() =>
      FrameSignature.assert({ ...arbitrary, ...fields } as never),
    ).toThrow()
  })

  test.each([0n, secp256k1.Point.Fn.ORDER, secp256k1.Point.Fn.ORDER - 1n])(
    'rejects invalid secp256k1 s %s',
    (s) => {
      expect(() =>
        FrameSignature.from({
          scheme: 1,
          signature: { r: '0x01', s: Hex.fromNumber(s), yParity: 0 },
        }),
      ).toThrow()
    },
  )

  test.each([0n, p256.Point.Fn.ORDER, p256.Point.Fn.ORDER + 1n])(
    'rejects invalid P-256 s %s',
    (s) => {
      expect(() =>
        FrameSignature.from({
          publicKey,
          scheme: 2,
          signature: { r: '0x01', s: Hex.fromNumber(s) },
        }),
      ).toThrow()
    },
  )

  test('rejects missing public key for signed P-256', () => {
    expect(() =>
      FrameSignature.assert({
        payload: '0x',
        scheme: 2,
        signature: { r: '0x01', s: '0x02' },
      } as never),
    ).toThrow()
  })
})

describe('validate', () => {
  test('reports structural validity without signature verification', () => {
    expect(FrameSignature.validate(arbitrary)).toBe(true)
    expect(FrameSignature.validate({ ...arbitrary, payload: '0x01' })).toBe(
      false,
    )
  })
})

describe('fromRpc', () => {
  test('arbitrary signature', () => {
    expect(
      FrameSignature.fromRpc({
        msg: '0x',
        scheme: '0x0',
        signature: '0xaabb',
        signer: null,
      }),
    ).toEqual(FrameSignature.from('0xaabb'))
  })
  test('secp256k1 signature', () => {
    expect(
      FrameSignature.fromRpc({
        msg: '0x',
        scheme: '0x1',
        signature: secpBytes,
      }),
    ).toEqual(
      FrameSignature.from({
        scheme: 'secp256k1',
        signature: {
          r: `0x${'00'.repeat(31)}01`,
          s: `0x${'00'.repeat(31)}02`,
          yParity: 1,
        },
      }),
    )
  })
  test('P-256 signature', () => {
    const entry = FrameSignature.fromRpc({
      msg: '0x',
      scheme: '0x2',
      signature: p256Bytes,
    })
    expect(entry).toMatchObject({ payload: '0x', publicKey, scheme: 'p256' })
    expect(FrameSignature.toRpc(entry)).toEqual({
      msg: '0x',
      scheme: '0x2',
      signature: p256Bytes,
    })
  })
  test('unsigned placeholder', () => {
    expect(FrameSignature.fromRpc({ scheme: '0x1' })).toEqual(
      FrameSignature.from({ scheme: 'secp256k1' }),
    )
  })
  test('malformed protocol signature', () => {
    expect(() =>
      FrameSignature.fromRpc({ msg: '0x', scheme: '0x1', signature: '0x01' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[FrameSignature.InvalidError: Invalid frame signature.

Details: Invalid protocol signature length.]`,
    )
  })
})

describe('toRpc', () => {
  test('omits an unsigned protocol signature', () => {
    expect(
      FrameSignature.toRpc(FrameSignature.from({ scheme: 'secp256k1' })),
    ).toEqual({ msg: '0x', scheme: '0x1' })
  })
  test('preserves explicit payload and signer', () => {
    const entry = FrameSignature.from({
      payload,
      scheme: 'secp256k1',
      signature: { r: '0x01', s: '0x02', yParity: 1 },
      signer: '0x1111111111111111111111111111111111111111',
    })
    expect(FrameSignature.toRpc(entry)).toEqual({
      msg: payload,
      scheme: '0x1',
      signature: secpBytes,
      signer: '0x1111111111111111111111111111111111111111',
    })
    expect(entry.signature.r).toBe('0x01')
  })
})

describe('structured validation', () => {
  test.each(['invalid', '1', '0x', `0x${'11'.repeat(33)}`])(
    'rejects coordinate %s',
    (coordinate) => {
      for (const key of ['x', 'y'] as const) {
        const entry = {
          payload: '0x',
          publicKey: { ...publicKey, [key]: coordinate },
          scheme: 'p256',
        } as FrameSignature.P256
        expect(FrameSignature.validate(entry)).toBe(false)
        expect(() => FrameSignature.from(entry)).toThrow()
      }
    },
  )
  test.each([
    { r: '1', s: '0x02', yParity: 1 },
    { r: '0x01', s: '2', yParity: 1 },
    { r: '0x01', s: '0x02', yParity: '1' },
    { r: '0x01', s: '0x02', yParity: undefined },
  ])('rejects malformed scalars or parity %j', (signature) => {
    const entry = {
      payload: '0x',
      scheme: 'secp256k1',
      signature,
    } as unknown as FrameSignature.Secp256k1
    expect(FrameSignature.validate(entry)).toBe(false)
    expect(() => FrameSignature.from(entry)).toThrow()
  })
})

describe('hex signatures', () => {
  test.each(['secp256k1', 1] as const)('secp256k1 scheme %s', (scheme) => {
    const signature = Secp256k1.sign({ payload, privateKey })
    const hex = Signature.toHex(signature)
    const entry = FrameSignature.from({ scheme, signature: hex })
    const structured = FrameSignature.from({ scheme, signature })

    expect(entry.signature).toBe(hex)
    expect(FrameSignature.toRpc(entry)).toEqual(
      FrameSignature.toRpc(structured),
    )
    expect(FrameSignature.toTuple(entry)).toEqual(
      FrameSignature.toTuple(structured),
    )
    expect(FrameSignature.validate(entry, { signed: true })).toBe(true)
  })

  test.each(['p256', 2] as const)('P256 scheme %s', (scheme) => {
    const signature = P256.sign({ payload, privateKey })
    const hex = Signature.toHex({ r: signature.r, s: signature.s })
    const entry = FrameSignature.from({ publicKey, scheme, signature: hex })
    const structured = FrameSignature.from({ publicKey, scheme, signature })

    expect(entry.signature).toBe(hex)
    expect(FrameSignature.toRpc(entry)).toEqual(
      FrameSignature.toRpc(structured),
    )
    expect(FrameSignature.toTuple(entry)).toEqual(
      FrameSignature.toTuple(structured),
    )
    expect(FrameSignature.validate(entry, { signed: true })).toBe(true)
  })

  test.each([
    '0x',
    '0x01',
    `0x${'00'.repeat(65)}`,
    `0x${'gg'.repeat(65)}`,
  ] as const)('rejects invalid secp256k1 hex: %s', (signature) => {
    expect(() =>
      FrameSignature.from({ scheme: 'secp256k1', signature }),
    ).toThrow()
  })

  test('requires secp256k1 recovery parity', () => {
    const signature = Signature.toHex({
      r: Hex.fromNumber(1, { size: 32 }),
      s: Hex.fromNumber(2, { size: 32 }),
    })
    expect(() =>
      FrameSignature.from({ scheme: 'secp256k1', signature }),
    ).toThrow()
  })

  test('requires a public key with P256 hex', () => {
    const entry = {
      scheme: 'p256',
      signature: Signature.toHex({
        r: Hex.fromNumber(1, { size: 32 }),
        s: Hex.fromNumber(2, { size: 32 }),
      }),
    } as const
    // @ts-expect-error P256 requires a public key.
    expect(() => FrameSignature.from(entry)).toThrow(
      'P-256 signatures require a public key.',
    )
  })

  test('normalizes P256 scalars on encoding', () => {
    const signature = {
      r: Hex.fromNumber(1, { size: 32 }),
      s: Hex.fromNumber(p256.Point.Fn.ORDER - 1n),
    } as const
    const entry = FrameSignature.from({
      publicKey,
      scheme: 'p256',
      signature: Signature.toHex(signature),
    })
    expect(FrameSignature.toTuple(entry)).toEqual(
      FrameSignature.toTuple(
        FrameSignature.from({ publicKey, scheme: 'p256', signature }),
      ),
    )
  })
})

test('rejects malformed P256 hex bytes', () => {
  const signature = `0x${'00'.repeat(64)}gg` as const
  expect(
    FrameSignature.validate({ publicKey, scheme: 'p256', signature }),
  ).toBe(false)
})
