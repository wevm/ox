import { type Hex, JsonRpc } from 'ox'
import { assertType, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

test('default', async () => {
  const request = JsonRpc.defineRequest({
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

  const gas = JsonRpc.parseResponse(raw)
  assertType<unknown>(gas)

  expect(gas).toMatchInlineSnapshot(`"0x5248"`)
})

test('error', async () => {
  const request = JsonRpc.defineRequest({
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

  expect(() => JsonRpc.parseResponse(raw)).toThrowErrorMatchingInlineSnapshot(
    '[JsonRpcInvalidParamsError: No Signer available]',
  )
})

test('options: method', async () => {
  const request = JsonRpc.defineRequest({
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

  const gas = JsonRpc.parseResponse(raw, {
    request,
  })
  assertType<Hex.Hex>(gas)

  expect(gas).toMatchInlineSnapshot(`"0x5248"`)
})

test('options: safe', async () => {
  const request = JsonRpc.defineRequest({
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
    const response = JsonRpc.parseResponse(json, {
      request,
      safe: true,
    })
    assertType<JsonRpc.Response<Hex.Hex>>(response)

    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x5248",
      }
    `)
  }

  {
    const response = JsonRpc.parseResponse(json, {
      safe: true,
    })
    assertType<JsonRpc.Response<unknown>>(response)
  }
})

test('behavior: throws JsonRpc.InvalidInputError', () => {
  expect(() =>
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
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
    JsonRpc.parseResponse({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: 69420,
        message: 'oh no',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot('[JsonRpcError: oh no]')
})
