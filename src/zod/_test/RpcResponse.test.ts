import { describe, expect, test } from 'vp/test'
import * as z_RpcResponse from '../RpcResponse.js'
import * as z from 'zod/mini'

describe('RpcResponse', () => {
  test('decodes and encodes successful responses', () => {
    expect(
      z.decode(z_RpcResponse.RpcResponse, {
        id: 0,
        jsonrpc: '2.0',
        result: '0x1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x1",
      }
    `)
    expect(
      z.encode(z_RpcResponse.RpcResponse, {
        id: 0,
        jsonrpc: '2.0',
        result: '0x1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x1",
      }
    `)
  })

  test('decodes and encodes error responses', () => {
    expect(
      z.decode(z_RpcResponse.RpcResponse, {
        error: {
          code: -32000,
          data: { reason: 'missing signer' },
          message: 'Internal error',
        },
        id: 1,
        jsonrpc: '2.0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "error": {
          "code": -32000,
          "data": {
            "reason": "missing signer",
          },
          "message": "Internal error",
        },
        "id": 1,
        "jsonrpc": "2.0",
      }
    `)
    expect(
      z.encode(z_RpcResponse.ErrorObject, {
        code: -32000,
        message: 'Internal error',
      }),
    ).toMatchInlineSnapshot(`
      {
        "code": -32000,
        "message": "Internal error",
      }
    `)
  })

  test('rejects invalid response variants', () => {
    expect(
      z.safeDecode(z_RpcResponse.RpcResponse, {
        id: 0,
        jsonrpc: '2.0',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeDecode(z_RpcResponse.RpcResponse, {
        error: { code: -32000, message: 'Internal error' },
        id: 0,
        jsonrpc: '2.0',
        result: '0x1',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
