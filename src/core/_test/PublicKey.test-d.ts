import { attest } from '@ark/attest'
import { PublicKey } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('PublicKey.from', () => {
  test('default', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: uncompressed, no prefix', () => {
    const publicKey = PublicKey.from({
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 0x03,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, uncompressed', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    } as PublicKey.PublicKey)

    attest(publicKey).type.toString.snap()
  })

  test('behavior: widened, compressed', () => {
    const publicKey = PublicKey.from({
      prefix: 3,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    } as PublicKey.PublicKey<true>)

    attest(publicKey).type.toString.snap()
  })
})

describe('Parts type-equivalence', () => {
  test('Parts<false> matches PublicKey<false> structurally', () => {
    expectTypeOf<PublicKey.Parts<false>>().toEqualTypeOf<
      PublicKey.PublicKey<false>
    >()
  })

  test('Parts<true> matches PublicKey<true> structurally', () => {
    expectTypeOf<PublicKey.Parts<true>>().toEqualTypeOf<
      PublicKey.PublicKey<true>
    >()
  })

  test('default Parts matches default PublicKey', () => {
    expectTypeOf<PublicKey.Parts>().toEqualTypeOf<PublicKey.PublicKey>()
  })

  test('toParts return is Parts', () => {
    type Result = ReturnType<typeof PublicKey.toParts<false>>
    expectTypeOf<Result>().toEqualTypeOf<PublicKey.Parts<false>>()
  })

  test('fromParts accepts Parts and returns PublicKey', () => {
    type Param = Parameters<typeof PublicKey.fromParts<false>>[0]
    type Result = ReturnType<typeof PublicKey.fromParts<false>>
    expectTypeOf<Param>().toEqualTypeOf<PublicKey.Parts<false>>()
    expectTypeOf<Result>().toEqualTypeOf<PublicKey.PublicKey<false>>()
  })
})
