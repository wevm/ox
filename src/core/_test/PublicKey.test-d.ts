import { attest } from '@ark/attest'
import { PublicKey } from 'ox'
import { describe, test } from 'vitest'

describe('PublicKey.from', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: uncompressed, no prefix', () => {
    const publicKey = PublicKey.from({
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 0x03,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
      y: '0x55f4343dc5e73ab1d291ae72cca5010203262001215820eee72c4fc66e2670b0',
    } as PublicKey.PublicKey)

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: '0xa363666d74646e6f6e656761747453746d74a068617574684461746158984996',
    } as PublicKey.PublicKey<true>)

    attest(publicKey).type.toString.snap()
  })
})
