import { attest } from '@ark/attest'
import { Hex, PublicKey } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('PublicKey.fromParts', () => {
  test('default', () => {
    const publicKey = PublicKey.fromParts({
      prefix: 4,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    })

    attest(publicKey).type.toString.snap()
  })

  test('behavior: compressed', () => {
    const publicKey = PublicKey.fromParts<true>({
      prefix: 0x03,
      x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    })

    attest(publicKey).type.toString.snap()
  })
})

describe('PublicKey type identity', () => {
  test('PublicKey<false> is Hex.Hex', () => {
    expectTypeOf<PublicKey.PublicKey<false>>().toEqualTypeOf<Hex.Hex>()
  })

  test('PublicKey<true> is Hex.Hex', () => {
    expectTypeOf<PublicKey.PublicKey<true>>().toEqualTypeOf<Hex.Hex>()
  })

  test('default PublicKey is Hex.Hex', () => {
    expectTypeOf<PublicKey.PublicKey>().toEqualTypeOf<Hex.Hex>()
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
