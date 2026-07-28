import { mnemonicToSeedSync } from '@scure/bip39'
import { describe, expect, test } from 'vp/test'
import { vectors } from '../../../test/vectors/bip39/index.js'
import * as Mnemonic from '../Mnemonic.js'
import * as crypto25519 from '../internal/crypto25519.js'
import { wasmBase64 } from '../internal/crypto25519.wasm.js'
import * as internal from '../internal/instantiate.js'
import * as mnemonic_internal from '../internal/mnemonic.js'

describe('create', () => {
  test('vectors: matches the official English BIP-39 vector', async () => {
    const { toSeed } = (await Mnemonic.create()).Mnemonic

    expect(
      toHex(toSeed(vectors.english.mnemonic, vectors.english.passphrase)),
    ).toBe(vectors.english.seed)
  })

  test('vectors: matches the official Japanese Unicode BIP-39 vector', async () => {
    const { toSeed } = (await Mnemonic.create()).Mnemonic

    expect(
      toHex(toSeed(vectors.japanese.mnemonic, vectors.japanese.passphrase)),
    ).toBe(vectors.japanese.seed)
  })

  test('behavior: matches NFKD and every supported word count', async () => {
    const { toSeed } = (await Mnemonic.create()).Mnemonic

    for (const count of [12, 15, 18, 21, 24]) {
      const composed = Array.from({ length: count }, () => 'café').join(' ')
      const decomposed = Array.from({ length: count }, () => 'cafe\u0301').join(
        ' ',
      )
      expect(toSeed(composed, 'pássphrase')).toEqual(
        toSeed(decomposed, 'pa\u0301ssphrase'),
      )
      expect(toSeed(composed, 'pássphrase')).toEqual(
        mnemonicToSeedSync(composed, 'pássphrase'),
      )
    }
  })

  test('behavior: rejects the same malformed phrase shapes', async () => {
    const { toSeed } = (await Mnemonic.create()).Mnemonic

    for (const count of [0, 1, 11, 13, 23, 25])
      expect(() =>
        toSeed(Array.from({ length: count }, () => 'word').join(' ')),
      ).toThrowError('Invalid mnemonic')
    expect(() => toSeed(1 as never)).toThrowError(
      'invalid mnemonic type: number',
    )
  })

  test('behavior: outputs remain owned and staging memory is cleared', async () => {
    const { toSeed } = (await Mnemonic.create()).Mnemonic
    const seed = toSeed(vectors.english.mnemonic, vectors.japanese.passphrase)
    const snapshot = seed.slice()
    toSeed(Array.from({ length: 24 }, () => 'word').join(' '), 'other')
    expect(seed).toEqual(snapshot)

    const passwordSize = new TextEncoder().encode(
      vectors.english.mnemonic.normalize('NFKD'),
    ).length
    const saltSize = new TextEncoder().encode(
      `mnemonic${vectors.japanese.passphrase}`.normalize('NFKD'),
    ).length
    const module = await crypto25519.load()
    expect(
      module
        .view()
        .subarray(
          module.heapBase,
          module.heapBase + passwordSize + saltSize + 64,
        )
        .every((byte) => byte === 0),
    ).toBe(true)
  })

  test('behavior: clears password, salt, and output after a late trap', async () => {
    const module = await internal.instantiate<crypto25519.Exports>(wasmBase64)
    const vector = vectors.japanese
    const exports: crypto25519.Exports = {
      ...module.exports,
      mnemonic_to_seed(...parameters) {
        module.exports.mnemonic_to_seed(...parameters)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
    }

    expect(() =>
      mnemonic_internal.toSeed(
        { ...module, exports },
        vector.mnemonic,
        vector.passphrase,
      ),
    ).toThrow(WebAssembly.RuntimeError)
    expect(
      module
        .view()
        .subarray(module.heapBase)
        .every((byte) => byte === 0),
    ).toBe(true)
  })
})

function toHex(value: Uint8Array): string {
  return Buffer.from(value).toString('hex')
}
