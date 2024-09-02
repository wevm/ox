import { type Hex, RpcRequest, RpcResponse } from 'ox'
import { assertType, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

test('default', async () => {
  const request = RpcRequest.from({
    method: 'eth_estimateGas',
    params: [
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        data: '0xdeadbeef',
      },
    ],
    id: 0,
  })

  const raw = await fetch(anvilMainnet.rpcUrl, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((res) => res.json())

  const gas = RpcResponse.parse(raw)
  assertType<unknown>(gas)

  expect(gas).toMatchInlineSnapshot(`"0x5248"`)
})

test('error', async () => {
  const request = RpcRequest.from({
    method: 'eth_sendTransaction',
    params: [
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        data: '0xdeadbeef',
      },
    ],
    id: 0,
  })

  const raw = await fetch(anvilMainnet.rpcUrl, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((res) => res.json())

  expect(() => RpcResponse.parse(raw)).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInvalidParamsError: No Signer available]',
  )
})

test('options: request', async () => {
  const request = RpcRequest.from({
    method: 'eth_estimateGas',
    params: [
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        data: '0xdeadbeef',
      },
    ],
    id: 0,
  })

  const raw = await fetch(anvilMainnet.rpcUrl, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((res) => res.json())

  const gas = RpcResponse.parse(raw, {
    request,
  })
  assertType<Hex.Hex>(gas)

  expect(gas).toMatchInlineSnapshot(`"0x5248"`)
})

test('options: safe', async () => {
  const request = RpcRequest.from({
    method: 'eth_estimateGas',
    params: [
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        data: '0xdeadbeef',
      },
    ],
    id: 0,
  })

  const json = await fetch(anvilMainnet.rpcUrl, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((res) => res.json())

  {
    const response = RpcResponse.parse(json, {
      request,
      safe: true,
    })
    assertType<RpcResponse.RpcResponse<Hex.Hex>>(response)

    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x5248",
      }
    `)
  }

  {
    const response = RpcResponse.parse(json, {
      safe: true,
    })
    assertType<RpcResponse.RpcResponse<unknown>>(response)
  }
})

test('behavior: throws JsonRpc.InvalidInputError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32000,
        message: 'Internal error',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInvalidInputError: Internal error]',
  )
})

test('behavior: throws JsonRpc.ResourceNotFoundError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32001,
        message: 'Resource not found',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcResourceNotFoundError: Resource not found]',
  )
})

test('behavior: throws JsonRpc.ResourceUnavailableError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32002,
        message: 'Resource unavailable',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcResourceUnavailableError: Resource unavailable]',
  )
})

test('behavior: throws JsonRpc.TransactionRejectedError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32003,
        message: 'Transaction rejected',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcTransactionRejectedError: Transaction rejected]',
  )
})

test('behavior: throws JsonRpc.MethodNotSupportedError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32004,
        message: 'Method not supported',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcMethodNotSupportedError: Method not supported]',
  )
})

test('behavior: throws JsonRpc.LimitExceededError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32005,
        message: 'Limit exceeded',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcLimitExceededError: Limit exceeded]',
  )
})

test('behavior: throws JsonRpc.VersionNotSupportedError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32006,
        message: 'Version not supported',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcVersionNotSupportedError: Version not supported]',
  )
})

test('behavior: throws JsonRpc.InvalidRequestError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32600,
        message: 'Invalid Request',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInvalidRequestError: Invalid Request]',
  )
})

test('behavior: throws JsonRpc.MethodNotFoundError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcMethodNotFoundError: Method not found]',
  )
})

test('behavior: throws JsonRpc.InvalidParamsError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32602,
        message: 'Method not found',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInvalidParamsError: Method not found]',
  )
})

test('behavior: throws JsonRpc.InternalError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32603,
        message: 'Method not found',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInternalErrorError: Method not found]',
  )
})

test('behavior: throws JsonRpc.ParseError', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: -32700,
        message: 'Method not found',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot('[JsonRpcParseError: Method not found]')
})

test('behavior: throws JsonRpc.Error', () => {
  expect(() =>
    RpcResponse.parse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: 69420,
        message: 'oh no',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot('[JsonRpcError: oh no]')
})
