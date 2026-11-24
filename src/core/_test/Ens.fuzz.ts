import { fc, test } from '@fast-check/vitest'
import { ensNormalize } from '@adraffy/ens-normalize.ts'
import { namehash as namehash_ethers } from 'ethers'
import { Ens } from 'ox'
import { labelhash, namehash } from 'viem'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/** Lowercase names, most of them already in ENSIP-15 normal form. */
const arbitraryLowercaseName = fc
  .array(fc.stringMatching(/^[a-z0-9-]{1,12}$/), {
    maxLength: 4,
    minLength: 1,
  })
  .map((labels) => labels.join('.'))

function isNormalized(name: string) {
  try {
    return ensNormalize(name) === name
  } catch {
    return false
  }
}

describe('Ens.normalize', () => {
  test.prop(
    {
      name: fc.oneof(
        arbitraryLowercaseName,
        // ASCII that a shortcut for names in normal form must leave to the
        // normalizer: uppercase, `_`, `$`, `--` at any position, empty labels.
        fc.stringMatching(/^[a-zA-Z0-9_$. -]{0,24}$/),
        fc.string({ maxLength: 16 }),
      ),
    },
    { numRuns },
  )('matches the ENSIP-15 normalizer, errors included', ({ name }) => {
    const outcome = (normalize: (name: string) => string) => {
      try {
        return { value: normalize(name) }
      } catch (error) {
        return { error: (error as Error).message }
      }
    }
    expect(outcome(Ens.normalize)).toEqual(outcome(ensNormalize))
  })
})

describe('Ens.namehash', () => {
  test.prop({ name: arbitraryLowercaseName }, { numRuns })(
    'matches viem and ethers, and labelhash matches viem',
    ({ name }) => {
      const expected = namehash(name)
      expect(Ens.namehash(name)).toBe(expected)
      // ethers normalizes first, so it hashes only names in normal form.
      if (isNormalized(name)) expect(namehash_ethers(name)).toBe(expected)
      const label = name.split('.')[0]!
      expect(Ens.labelhash(label)).toBe(labelhash(label))
    },
  )
})
