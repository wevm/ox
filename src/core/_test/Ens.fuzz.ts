import { ens_normalize } from '@adraffy/ens-normalize'
import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { Ens } from 'ox'
import * as viem from 'viem'
import { normalize as viemNormalize } from 'viem/ens'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/**
 * Names near the already-normal ASCII shortcut: labels of lowercase letters,
 * digits, `$`, `-` and `_`, with uppercase letters, `--` at positions 2–3,
 * underscores after the start, empty labels, and non-ASCII characters mixed in.
 */
const label = fc.oneof(
  { weight: 4, arbitrary: fc.stringMatching(/^_{0,2}[a-z0-9$-]{0,10}$/) },
  {
    weight: 2,
    arbitrary: fc.string({
      unit: fc.constantFrom(
        ...'abcxyz0189$-_.AZ',
        'é',
        'ß',
        'ı',
        '\u200d',
        '💩',
        '.',
        ' ',
      ),
      maxLength: 10,
    }),
  },
  { weight: 1, arbitrary: fc.string({ unit: 'grapheme', maxLength: 6 }) },
  {
    weight: 1,
    arbitrary: fc.constantFrom(
      'xn--ls8h',
      'a--b',
      'ab--c',
      '_a',
      'a_',
      '$',
      '',
    ),
  },
)
const name = fc
  .array(label, { minLength: 1, maxLength: 4 })
  .map((labels) => labels.join('.'))

/** The result of `fn`, or that it threw. */
function outcome(fn: () => unknown) {
  try {
    return { value: fn() }
  } catch {
    return { error: true }
  }
}

describe('Ens.normalize', () => {
  test.prop({ name }, { numRuns })(
    'normalizes and rejects as @adraffy/ens-normalize (ENSIP-15) does, and agrees with viem and ethers where they accept',
    ({ name }) => {
      // ox ships this version of the normalizer, so it is the oracle for
      // what is rejected too.
      const expected = outcome(() => ens_normalize(name))
      expect(outcome(() => Ens.normalize(name))).toEqual(expected)
      // viem and ethers bundle older normalizers, which reject characters
      // newer versions allow (such as U+2B00), and ethers rejects the empty
      // name. Where they accept a name, they agree.
      if (!('value' in expected)) return
      for (const normalize of [viemNormalize, ethers.ensNormalize]) {
        const other = outcome(() => normalize(name))
        if ('value' in other) expect(other.value).toBe(expected.value)
      }
    },
  )

  test.prop({ name }, { numRuns })(
    'namehash and labelhash agree with viem',
    ({ name }) => {
      expect(Ens.namehash(name)).toBe(viem.namehash(name))
      const first = name.split('.')[0]!
      expect(Ens.labelhash(first)).toBe(viem.labelhash(first))
    },
  )
})
