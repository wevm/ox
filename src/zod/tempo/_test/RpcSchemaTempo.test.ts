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

describe('multisig methods', () => {
  test('decodes key authorization approval params', () => {
    expect(
      z_RpcSchema.decodeParams(
        z_RpcSchemaTempo.Multisig,
        'multisig_approveKeyAuthorization',
        [{ hash: '0x01', signature: '0x02' }],
      ),
    ).toEqual([{ hash: '0x01', signature: '0x02' }])
  })

  test('decodes raw transaction params', () => {
    expect(
      z_RpcSchema.decodeParams(
        z_RpcSchemaTempo.Multisig,
        'multisig_approveRawTransactionSync',
        ['0x76', 30_000],
      ),
    ).toEqual(['0x76', 30_000])
  })

  test('decodes config params', () => {
    expect(
      z_RpcSchema.decodeParams(
        z_RpcSchemaTempo.Multisig,
        'multisig_getConfig',
        [{ address: '0xcafebabecafebabecafebabecafebabecafebabe' }],
      ),
    ).toEqual([{ address: '0xcafebabecafebabecafebabecafebabecafebabe' }])
  })

  test('decodes config result', () => {
    const config = {
      owners: [
        {
          owner: '0x1111111111111111111111111111111111111111',
          weight: 1,
        },
      ],
      salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      threshold: 1,
      version: '0x0',
    } as const

    expect(
      z_RpcSchema.decodeReturns(
        z_RpcSchemaTempo.Multisig,
        'multisig_getConfig',
        config,
      ),
    ).toEqual(config)
  })

  test('accepts a missing config result', () => {
    expect(
      z_RpcSchema.decodeReturns(
        z_RpcSchemaTempo.Multisig,
        'multisig_getConfig',
        null,
      ),
    ).toBeNull()
  })

  test('accepts a missing operation result', () => {
    expect(
      z_RpcSchema.decodeReturns(
        z_RpcSchemaTempo.Multisig,
        'multisig_getOperation',
        null,
      ),
    ).toBeNull()
  })

  test('exposes method and request schemas', () => {
    expect(
      z.safeDecode(z_RpcSchemaTempo.multisig_getOperation.request, {
        method: 'multisig_getOperation',
        params: ['0x01'],
      }).success,
    ).toBe(true)
  })
})
