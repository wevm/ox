import { fc, test } from '@fast-check/vitest'
import { Base64, Bytes, Hex } from 'ox'
import { beforeAll, describe, expect, vi } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/** What `Base64.fromBytes` returns for `bytes`, from Buffer. */
function expected(bytes: Uint8Array, pad: boolean, url: boolean) {
  const base64 = Buffer.from(bytes)
    .toString(url ? 'base64url' : 'base64')
    .replace(/=+$/, '')
  return pad ? base64 + '='.repeat((4 - (base64.length % 4)) % 4) : base64
}

const options = { pad: fc.boolean(), url: fc.boolean() }

describe('Base64 against Buffer', () => {
  test.prop(
    { bytes: fc.uint8Array({ maxLength: 100 }), ...options },
    { numRuns },
  )(
    'fromBytes and fromHex encode as Buffer does; toBytes, toHex decode back',
    ({ bytes, pad, url }) => {
      const base64 = expected(bytes, pad, url)
      expect(Base64.fromBytes(bytes, { pad, url })).toBe(base64)
      expect(Base64.fromHex(Hex.fromBytes(bytes), { pad, url })).toBe(base64)
      expect(Base64.toBytes(base64)).toEqual(bytes)
      expect(Base64.toHex(base64)).toBe(Hex.fromBytes(bytes))
    },
  )

  test.prop(
    { value: fc.string({ unit: 'grapheme', maxLength: 40 }), ...options },
    { numRuns },
  )(
    'fromString encodes UTF-8 as Buffer does; toString decodes back',
    ({ value, pad, url }) => {
      const base64 = expected(Buffer.from(value, 'utf8'), pad, url)
      expect(Base64.fromString(value, { pad, url })).toBe(base64)
      expect(Base64.toString(base64)).toBe(value)
    },
  )

  test.prop(
    {
      value: fc.string({
        unit: fc.constantFrom(...'ABCDEFabcdef0123456789+/-_=', ' ', '.', 'é'),
        maxLength: 24,
      }),
    },
    { numRuns },
  )('toBytes decodes strings in the alphabet as Buffer does', ({ value }) => {
    // Buffer skips characters outside the alphabets; ox reads them as zero
    // bits (see the changeset), so only strings in the alphabets are judged.
    const decoded = Base64.toBytes(value)
    if (!/^[A-Za-z0-9+/\-_]*=*$/.test(value)) return
    const body = value.replace(/=+$/, '')
    if (body.length % 4 === 1) return // Not a whole byte; any answer is lenient.
    expect(decoded).toEqual(new Uint8Array(Buffer.from(body, 'base64')))
  })
})

describe('Base64 without native Uint8Array.prototype.toBase64 and toHex', () => {
  // Runtimes without the native helpers take the hand-written loops. Reload
  // the modules with the helpers hidden, so both paths are fuzzed everywhere.
  let fallback: { Base64: typeof Base64; Hex: typeof Hex }
  beforeAll(async () => {
    const prototype = Uint8Array.prototype as unknown as Record<string, unknown>
    const saved = ['toBase64', 'toHex'].map(
      (key) => [key, Object.getOwnPropertyDescriptor(prototype, key)] as const,
    )
    for (const [key] of saved) delete prototype[key]
    try {
      vi.resetModules()
      fallback = {
        Base64: await import('../Base64.js'),
        Hex: await import('../Hex.js'),
      }
    } finally {
      for (const [key, descriptor] of saved)
        if (descriptor) Object.defineProperty(prototype, key, descriptor)
    }
  })

  test.prop(
    { bytes: fc.uint8Array({ maxLength: 100 }), ...options },
    { numRuns },
  )(
    'fromBytes, Hex.fromBytes and Bytes.toHex match Buffer',
    ({ bytes, pad, url }) => {
      expect(fallback.Base64.fromBytes(bytes, { pad, url })).toBe(
        expected(bytes, pad, url),
      )
      expect(fallback.Hex.fromBytes(bytes)).toBe(
        `0x${Buffer.from(bytes).toString('hex')}`,
      )
      expect(fallback.Hex.fromBytes(bytes)).toBe(Bytes.toHex(bytes))
    },
  )
})
