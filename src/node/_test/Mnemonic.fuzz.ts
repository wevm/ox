import { mnemonicToSeedSync } from '@scure/bip39'
import { fc, test } from '@fast-check/vitest'
import { expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as Mnemonic from '../Mnemonic.js'

const arbitraryWord = fc.oneof(
  fc
    .string({ maxLength: 16, minLength: 1 })
    .filter((value) => !value.normalize('NFKD').includes(' ')),
  fc.constantFrom('café', 'cafe\u0301', 'あおぞら', '㍍ガバヴァ'),
)

test.prop(
  {
    mnemonic: fc
      .array(arbitraryWord, { maxLength: 12, minLength: 12 })
      .map((words) => words.join(' ')),
    passphrase: fc.string({ maxLength: 32 }),
  },
  { numRuns },
)(
  'Node BIP-39 seed derivation agrees with the default',
  async ({ mnemonic, passphrase }) => {
    const { toSeed } = await Mnemonic.engine()

    expect(toSeed(mnemonic, passphrase)).toEqual(
      mnemonicToSeedSync(mnemonic, passphrase),
    )
  },
)
