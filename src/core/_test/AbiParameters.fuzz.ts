import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { AbiParameters, Bytes, Errors, Hex } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import { arbitraryAbiCase } from '../../../test/fuzz/arbitraries/abi.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

describe('AbiParameters round-trip', () => {
  test.prop({ abiCase: arbitraryAbiCase() }, { numRuns })(
    'encode encodes as viem and ethers do; decode reads the values back',
    ({ abiCase: { parameters, values } }) => {
      const encoded = AbiParameters.encode(parameters, values as never)
      expect(encoded).toBe(
        viem.encodeAbiParameters(parameters as never, values as never),
      )
      expect(encoded).toBe(
        ethers.AbiCoder.defaultAbiCoder().encode(
          parameters as never,
          values as never,
        ),
      )
      expect(canonical(AbiParameters.decode(parameters, encoded))).toEqual(
        canonical(values),
      )
      expect(
        canonical(AbiParameters.decode(parameters, Bytes.fromHex(encoded))),
      ).toEqual(canonical(values))
    },
  )
})

describe('AbiParameters.decode on malformed data', () => {
  test.prop(
    {
      abiCase: arbitraryAbiCase(),
      at: fc.nat(),
      how: fc.integer({ min: 0, max: 3 }),
      junk: fc.uint8Array({ minLength: 1, maxLength: 32 }),
    },
    { numRuns },
  )(
    'agrees with viem whenever both decode mutated data',
    ({ abiCase: { parameters, values }, at, how, junk }) => {
      const bytes = [
        ...Bytes.fromHex(AbiParameters.encode(parameters, values as never)),
      ]
      const index = bytes.length ? at % bytes.length : 0
      if (how === 0) bytes.length = index
      else if (how === 1) bytes[index] = junk[0]!
      else if (how === 2) bytes.splice(index, 0, ...junk)
      else bytes.splice(index, junk.length)
      const data = Hex.fromBytes(Uint8Array.from(bytes))

      let actual: unknown
      try {
        actual = AbiParameters.decode(parameters, data)
      } catch (error) {
        // Rejecting is fine, but with ox's error rather than a built-in one.
        expect(error).toBeInstanceOf(Errors.BaseError)
        return
      }
      let expected: unknown
      try {
        expected = viem.decodeAbiParameters(parameters as never, data)
      } catch {
        return // viem is stricter here; ox accepting is not judged.
      }
      expect(canonical(actual)).toEqual(canonical(expected))
    },
  )

  test.prop(
    {
      bits: fc.integer({ min: 1, max: 31 }).map((n) => n * 8),
      signed: fc.boolean(),
      word: fc.oneof(
        fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }),
        fc.constantFrom(
          2n ** 256n - 1n,
          2n ** 255n,
          255n,
          2n ** 64n,
          2n ** 128n + 1n,
        ),
      ),
    },
    { numRuns },
  )('decoded integers fit their ABI type', ({ bits, signed, word }) => {
    const type = `${signed ? 'int' : 'uint'}${bits}`
    const data = Hex.fromNumber(word, { size: 32 })
    let value: bigint
    try {
      value = BigInt(AbiParameters.decode([{ type }], data)[0] as bigint)
    } catch {
      return // A word outside the type's range may be rejected.
    }
    const min = signed ? -(2n ** BigInt(bits - 1)) : 0n
    const max = signed ? 2n ** BigInt(bits - 1) - 1n : 2n ** BigInt(bits) - 1n
    expect(value >= min && value <= max).toBe(true)
  })
})

/** Lowercases hex strings, so checksummed and lowercase addresses compare equal. */
function canonical(value: unknown): unknown {
  if (typeof value === 'string')
    return /^0x[0-9a-fA-F]*$/.test(value) ? value.toLowerCase() : value
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, canonical(item)]),
    )
  return value
}
