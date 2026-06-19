import { describe, expect, test } from 'vp/test'
import * as z_RpcSchema from '../../RpcSchema.js'
import * as z_RpcSchemaTempo from '../RpcSchemaTempo.js'
import * as z from 'zod/mini'

describe('tempo_simulateV1', () => {
  test('decodes params', () => {
    const params = z_RpcSchema.decodeParams(
      z_RpcSchemaTempo.Tempo,
      'tempo_simulateV1',
      [
        {
          blockStateCalls: [
            {
              calls: [
                {
                  calls: [
                    {
                      data: '0xdeadbeef',
                      to: '0xcafebabecafebabecafebabecafebabecafebabe',
                    },
                  ],
                  chainId: '0x1',
                  type: '0x76',
                },
              ],
            },
          ],
        },
        'latest',
      ],
    )
    expect(params[0].blockStateCalls[0]!.calls?.[0]).toMatchObject({
      chainId: 1,
      type: 'tempo',
    })
    expect(params[1]).toBe('latest')
  })

  test('rejects invalid params', () => {
    expect(
      z.safeDecode(z_RpcSchemaTempo.tempo_simulateV1.params, [{}] as never)
        .success,
    ).toBe(false)
  })

  test('exposes a method and request schema', () => {
    expect(z_RpcSchemaTempo.tempo_simulateV1.method).toBe('tempo_simulateV1')
    expect(
      z.safeDecode(z_RpcSchemaTempo.tempo_simulateV1.request, {
        method: 'tempo_simulateV1',
        params: [{ blockStateCalls: [] }, 'latest'],
      } as never).success,
    ).toBe(true)
  })
})
