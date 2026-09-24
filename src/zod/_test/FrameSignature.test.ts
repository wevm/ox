import { FrameSignature, P256, Secp256k1, Hash, Signature } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'
import { accounts } from '../../../test/constants/accounts.js'

describe('FrameSignature', () => {
  test('safeDecode rejects malformed protocol signatures without throwing', () => {
    expect(
      z.safeDecode(z.FrameSignature.FrameSignature, {
        msg: '0x',
        scheme: 1,
        signature: '0x01',
      }).success,
    ).toBe(false)
  })

  test('encodes omitted payloads', () => {
    expect(
      z.encode(z.FrameSignature.FrameSignature, {
        scheme: 'arbitrary',
        signature: '0xaabb',
      }),
    ).toEqual({ msg: '0x', scheme: 0, signature: '0xaabb' })
    expect(
      z.encode(z.FrameSignature.FrameSignature, {
        scheme: 'secp256k1',
      }),
    ).toEqual({ msg: '0x', scheme: 1, signature: '0x' })
    expect(
      z.encode(z.FrameSignature.FrameSignature, {
        scheme: 'p256',
      }),
    ).toEqual({ msg: '0x', scheme: 2, signature: '0x' })
  })

  test('arbitrary bytes', () => {
    expect(
      z.encode(z.FrameSignature.FrameSignature, FrameSignature.from('0xaabb')),
    ).toEqual({ msg: '0x', scheme: 0, signature: '0xaabb' })
    expect(
      z.decode(z.FrameSignature.FrameSignature, {
        msg: '0x',
        scheme: 0,
        signature: '0xaabb',
      }),
    ).toEqual(FrameSignature.from('0xaabb'))
  })
  test('secp256k1 signature', () => {
    const entry = FrameSignature.from({
      scheme: 'secp256k1',
      signature: Secp256k1.sign({
        payload: Hash.keccak256('0xdeadbeef'),
        privateKey: accounts[0].privateKey,
      }),
    })
    const rpc = z.encode(z.FrameSignature.FrameSignature, entry)
    expect(rpc.scheme).toBe(1)
    expect(z.decode(z.FrameSignature.FrameSignature, rpc)).toEqual(entry)
  })
  test('P-256 signature', () => {
    const privateKey = accounts[0].privateKey
    const entry = FrameSignature.from({
      publicKey: P256.getPublicKey({ privateKey }),
      scheme: 'p256',
      signature: P256.sign({
        payload: Hash.keccak256('0xdeadbeef'),
        privateKey,
      }),
    })
    const rpc = z.encode(z.FrameSignature.FrameSignature, entry)
    expect(rpc.scheme).toBe(2)
    expect(z.decode(z.FrameSignature.FrameSignature, rpc)).toEqual({
      ...entry,
      signature: { r: entry.signature.r, s: entry.signature.s },
    })
  })
  test('rejects missing P-256 public key and invalid arbitrary signer', () => {
    expect(
      z.safeParse(z.FrameSignature.Decoded, {
        payload: '0x',
        scheme: 'p256',
        signature: { r: '0x01', s: '0x02' },
      }).success,
    ).toBe(false)
    expect(
      z.safeParse(z.FrameSignature.Decoded, {
        payload: '0x',
        scheme: 'arbitrary',
        signature: '0x',
        signer: accounts[0].address,
      }).success,
    ).toBe(false)
  })
})

test('encodes protocol hex signatures', () => {
  const payload = Hash.keccak256('0xdeadbeef')
  const privateKey = accounts[0].privateKey
  const secp = FrameSignature.from({
    scheme: 'secp256k1',
    signature: Secp256k1.sign({ payload, privateKey }),
  })
  const p256 = FrameSignature.from({
    publicKey: P256.getPublicKey({ privateKey }),
    scheme: 'p256',
    signature: P256.sign({ payload, privateKey }),
  })

  expect(
    z.encode(z.FrameSignature.FrameSignature, {
      ...secp,
      signature: Signature.toHex(secp.signature),
    }),
  ).toEqual(FrameSignature.toRpc(secp))
  expect(
    z.encode(z.FrameSignature.FrameSignature, {
      ...p256,
      signature: Signature.toHex(p256.signature),
    }),
  ).toEqual(FrameSignature.toRpc(p256))
})
