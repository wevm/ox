import { attest } from '@ark/attest'
import { PublicKey } from 'ox'
import { describe, test } from 'vitest'

describe('PublicKey.from', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: uncompressed, no prefix', () => {
    const publicKey = PublicKey.from({
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 0x03,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
      y: '0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    } as PublicKey.PublicKey)

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75',
    } as PublicKey.PublicKey<true>)

    attest(publicKey).type.toString.snap()
  })
})
