import { Constants, Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const signature = {
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  } as const
  expect(Signature.from(signature)).toMatchInlineSnapshot(`
    {
      "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      "yParity": 1,
    }
  `)

  expect(Signature.from(Signature.serialize(signature))).toEqual(signature)
  expect(
    Signature.from(Signature.serialize(signature, { as: 'Bytes' })),
  ).toEqual(signature)
})

test('behavior: legacy', () => {
  const signature = {
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    v: 27,
  } as const
  expect(Signature.from(signature)).toMatchInlineSnapshot(`
    {
      "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      "yParity": 0,
    }
  `)
})

test('behavior: rpc', () => {
  expect(
    Signature.from({
      r: '0x1',
      s: '0x2',
      yParity: '0x0',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)

  expect(
    Signature.from({
      r: '0x1',
      s: '0x2',
      v: '0x0',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)

  expect(
    Signature.from({
      r: '0x1',
      s: '0x2',
      v: '0x1b',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)
})

test('error: invalid sig', () => {
  const signature = {
    r: Constants.Solidity_maxUint256 + 1n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  } as const
  expect(() => Signature.from(signature)).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidRError: Value `115792089237316195423570985008687907853269984665640564039457584007913129639936` is an invalid r value. r must be a positive integer less than 2^256.]',
  )
})
