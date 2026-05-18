import { ContentDigest } from 'ox/erc8128'
import { describe, expect, test } from 'vitest'

describe('compute', () => {
  test('default', () => {
    const header = ContentDigest.compute(new TextEncoder().encode('hello'))
    expect(header).toMatchInlineSnapshot(
      `"sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:"`,
    )
  })

  test('behavior: string body', () => {
    const header = ContentDigest.compute('hello')
    expect(header).toMatchInlineSnapshot(
      `"sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:"`,
    )
  })
})

describe('serialize', () => {
  test('default', () => {
    const header = ContentDigest.serialize({
      algorithm: 'sha-256',
      digest: 'LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
    })
    expect(header).toBe(
      'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:',
    )
  })
})

describe('deserialize', () => {
  test('default', () => {
    const result = ContentDigest.deserialize(
      'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:',
    )
    expect(result).toEqual({
      algorithm: 'sha-256',
      digest: 'LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
    })
  })

  test('behavior: invalid header', () => {
    expect(() =>
      ContentDigest.deserialize('invalid'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[ContentDigest.InvalidContentDigestError: Invalid Content-Digest header value: "invalid".]',
    )
  })
})

describe('verify', () => {
  test('default', () => {
    const body = new TextEncoder().encode('hello')
    const header = ContentDigest.compute(body)
    expect(ContentDigest.verify({ body, header })).toBe(true)
  })

  test('behavior: string body', () => {
    const header = ContentDigest.compute('hello')
    expect(ContentDigest.verify({ body: 'hello', header })).toBe(true)
  })

  test('behavior: mismatch', () => {
    const header = ContentDigest.compute('hello')
    expect(ContentDigest.verify({ body: 'world', header })).toBe(false)
  })

  test('behavior: unsupported algorithm', () => {
    expect(
      ContentDigest.verify({
        body: 'hello',
        header: 'sha-512=:abc123=:',
      }),
    ).toBe(false)
  })
})
