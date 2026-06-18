import { RpcSchema, RpcTransport } from 'ox'
import { z } from 'ox/zod'
import { describe, expectTypeOf, test } from 'vp/test'

describe('fromHttp', () => {
  test('default schema', () => {
    const transport = RpcTransport.fromHttp('https://example.com')
    expectTypeOf(
      transport.request({ method: 'eth_blockNumber' }),
    ).resolves.toEqualTypeOf<`0x${string}`>()
  })

  test('with custom generic schema', () => {
    const schema = RpcSchema.from<
      | RpcSchema.Default
      | {
          Request: { method: 'abe_foo'; params: [id: number] }
          ReturnType: string
        }
    >()

    const transport = RpcTransport.fromHttp('https://example.com', { schema })

    expectTypeOf(
      transport.request({ method: 'abe_foo', params: [123] }),
    ).resolves.toEqualTypeOf<string>()
  })

  test('with zod schema', () => {
    const schema = z.RpcSchema.from({
      abe_foo: {
        params: z.tuple([z.number()]),
        returns: z.string(),
      },
    })

    const transport = RpcTransport.fromHttp('https://example.com', { schema })

    expectTypeOf(
      transport.request({ method: 'abe_foo', params: [123] }),
    ).resolves.toEqualTypeOf<string>()
  })
})
