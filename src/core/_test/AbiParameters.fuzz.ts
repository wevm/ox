import { test } from '@fast-check/vitest'
import { AbiParameters } from 'ox'
import { describe, expect } from 'vp/test'

import { arbitraryAbiCase } from '../../../test/fuzz/arbitraries/abi.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

describe('AbiParameters round-trip', () => {
  test.prop(
    {
      input: arbitraryAbiCase(),
    },
    { numRuns },
  )('decode(encode(values)) ≡ values', ({ input }) => {
    const encoded = AbiParameters.encode(
      input.parameters,
      input.values as never,
    )
    const decoded = AbiParameters.decode(input.parameters, encoded)
    expect(normalize(decoded)).toEqual(normalize(input.values))
  })
})

/**
 * Normalize address checksum casing before comparing decoded values
 * to inputs. ox checksums addresses by default on decode; the
 * arbitrary emits lowercase hex, so lowercase both sides.
 *
 * @internal
 */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value))
    return value.toLowerCase()
  return value
}
