import { mnemonicToSeedSync } from '@scure/bip39'
import { Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as bip39 from '../../../test/vectors/bip39/index.js'
import * as Mnemonic from '../Mnemonic.js'

describe('engine', () => {
  test('behavior: matches the BIP-39 English vector', async () => {
    const { toSeed } = await Mnemonic.engine()
    const { mnemonic, passphrase, seed } = bip39.vectors.english

    expect(Hex.fromBytes(toSeed(mnemonic, passphrase))).toBe(`0x${seed}`)
  })

  test('behavior: matches the BIP-39 Japanese Unicode vector', async () => {
    const { toSeed } = await Mnemonic.engine()
    const { mnemonic, passphrase, seed } = bip39.vectors.japanese

    expect(Hex.fromBytes(toSeed(mnemonic, passphrase))).toBe(`0x${seed}`)
  })

  test('behavior: applies BIP-39 NFKD normalization', async () => {
    const { toSeed } = await Mnemonic.engine()
    const composed = Array.from({ length: 12 }, () => 'café').join(' ')
    const decomposed = Array.from({ length: 12 }, () => 'cafe\u0301').join(' ')

    expect(toSeed(composed, 'pássphrase')).toEqual(
      toSeed(decomposed, 'pa\u0301ssphrase'),
    )
    expect(toSeed(composed, 'pássphrase')).toEqual(
      mnemonicToSeedSync(composed, 'pássphrase'),
    )
  })

  test('behavior: accepts every supported phrase length', async () => {
    const { toSeed } = await Mnemonic.engine()

    expect(
      [12, 15, 18, 21, 24].map(
        (length) =>
          toSeed(Array.from({ length }, () => 'word').join(' ')).length,
      ),
    ).toMatchInlineSnapshot(`
      [
        64,
        64,
        64,
        64,
        64,
      ]
    `)
  })

  test('behavior: rejects unsupported phrase lengths', async () => {
    const { toSeed } = await Mnemonic.engine()

    for (const length of [0, 1, 11, 13, 23, 25])
      expect(() =>
        toSeed(Array.from({ length }, () => 'word').join(' ')),
      ).toThrowErrorMatchingInlineSnapshot(`[Error: Invalid mnemonic]`)
  })

  test('behavior: agrees with the default for localized input', async () => {
    const { toSeed } = await Mnemonic.engine()
    const mnemonic = Array.from({ length: 12 }, () => 'あおぞら').join('　')
    const passphrase = '㍍ガバヴァぱばぐゞちぢ十人十色'

    expect(toSeed(mnemonic, passphrase)).toEqual(
      mnemonicToSeedSync(mnemonic, passphrase),
    )
  })

  test('behavior: rejects non-string mnemonics like the default', async () => {
    const { toSeed } = await Mnemonic.engine()

    expect(() => toSeed(1 as never)).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: invalid mnemonic type: number]`,
    )
  })

  test('behavior: returns owned Uint8Array values', async () => {
    const { toSeed } = await Mnemonic.engine()
    const mnemonic = Array.from({ length: 12 }, () => 'word').join(' ')
    const first = toSeed(mnemonic)
    const second = toSeed(mnemonic)

    expect(first.constructor === Uint8Array).toMatchInlineSnapshot('true')
    expect(first === second).toMatchInlineSnapshot('false')
    expect(first).toEqual(second)
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await Mnemonic.engine()
    const second = await Mnemonic.engine()

    expect(first === second).toMatchInlineSnapshot('false')
  })
})
