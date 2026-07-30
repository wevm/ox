import { Bytes, type Hex, Rlp } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'
import type { RecursiveArray } from '../internal/types.js'

describe('Rlp.encodeTo', () => {
  test('sink', () => {
    const sink: Rlp.Sink = {
      write(value) {
        expectTypeOf(value).toEqualTypeOf<Bytes.Bytes>()
      },
    }

    expectTypeOf(Rlp.encodeTo('0x', sink)).toEqualTypeOf<void>()
    expectTypeOf<Rlp.Sink>().toEqualTypeOf<{
      write(value: Bytes.Bytes): undefined
    }>()
  })

  test('rejects asynchronous sinks', () => {
    const sink: Rlp.Sink = {
      // @ts-expect-error RLP sinks are synchronous.
      async write() {},
    }
    void sink
  })
})

describe('Rlp.to', () => {
  test('default', () => {
    expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<RecursiveArray<Hex.Hex>>()
    expectTypeOf(Rlp.toBytes(Bytes.fromArray([]))).toEqualTypeOf<
      RecursiveArray<Bytes.Bytes>
    >()
  })
})

describe('Rlp.from', () => {
  test('default', () => {
    expectTypeOf(Rlp.fromHex('0x')).toEqualTypeOf<Hex.Hex>()
    expectTypeOf(
      Rlp.fromBytes(Bytes.fromArray([])),
    ).toEqualTypeOf<Bytes.Bytes>()
  })
})
