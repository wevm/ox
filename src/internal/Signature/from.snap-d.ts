import { attest } from '@ark/attest'
import { Hex, Signature } from 'ox'
import { test } from 'vitest'

test('default', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  })

  attest(signature).type.toString.snap(`{
  readonly r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n
  readonly s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n
  readonly yParity: 1
}`)
})

test('behavior: unrecovered', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  })

  attest(signature).type.toString.snap(`{
  readonly r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n
  readonly s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n
}`)
})

test('behavior: legacy', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    v: 27,
  })

  attest(signature).type.toString.snap(
    '{ r: bigint; s: bigint; yParity: number }',
  )
})

test('behavior: rpc', () => {
  const signature = Signature.from({
    r: Hex.fromNumber(
      49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    ),
    s: Hex.fromNumber(
      33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    ),
    yParity: Hex.fromNumber(1),
  })

  attest(signature).type.toString.snap(
    '{ r: bigint; s: bigint; yParity: number }',
  )
})

test('behavior: rpc legacy', () => {
  const signature = Signature.from({
    r: Hex.fromNumber(
      49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    ),
    s: Hex.fromNumber(
      33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    ),
    v: Hex.fromNumber(27),
  })

  attest(signature).type.toString.snap(
    '{ r: bigint; s: bigint; yParity: number }',
  )
})

test('behavior: widened', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  } as Signature.Signature)

  attest(signature).type.toString.snap(
    '{ r: bigint; s: bigint; yParity: number }',
  )
})

test('behavior: widened, unrecovered', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  } as Signature.Signature<false>)

  attest(signature).type.toString.snap(
    '{ r: bigint; s: bigint; yParity?: undefined }',
  )
})
