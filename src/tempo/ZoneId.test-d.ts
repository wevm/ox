import { expectTypeOf, test } from 'vitest'
import * as ZoneId from './ZoneId.js'

test('accepts supported source IDs', () => {
  expectTypeOf(ZoneId.fromChainId(421_700_001)).toEqualTypeOf<number>()
  expectTypeOf(
    ZoneId.fromChainId(1_424_310_001, 42_431),
  ).toEqualTypeOf<number>()
  expectTypeOf(ZoneId.toChainId(1)).toEqualTypeOf<number>()
  expectTypeOf(ZoneId.toChainId(1, 42_431)).toEqualTypeOf<number>()

  // @ts-expect-error Unsupported source ID.
  ZoneId.fromChainId(421_700_001, 1)
  // @ts-expect-error Unsupported source ID.
  ZoneId.toChainId(1, 1)
})
