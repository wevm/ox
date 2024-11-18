import { type Hex, RpcRequest, RpcResponse } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

describe('from', () => {
  test('default', async () => {
    const response = RpcResponse.from({
      id: 0,
      jsonrpc: '2.0',
      result: '0xdeadbeef',
    })
    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0xdeadbeef",
      }
    `)
  })

  test('behavior: with request', () => {
    const request = RpcRequest.from({ id: 0, method: 'eth_blockNumber' })

    const response = RpcResponse.from(
      {
        id: 0,
        jsonrpc: '2.0',
        result: '0xdeadbeef',
      },
      { request },
    )
    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0xdeadbeef",
      }
    `)
  })
})

describe('parse', () => {
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
      '[RpcResponse.InvalidParamsError: No Signer available]',
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
        raw: true,
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
        raw: true,
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
      '[RpcResponse.InvalidInputError: Internal error]',
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
      '[RpcResponse.ResourceNotFoundError: Resource not found]',
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
      '[RpcResponse.ResourceUnavailableError: Resource unavailable]',
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
      '[RpcResponse.TransactionRejectedError: Transaction rejected]',
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
      '[RpcResponse.MethodNotSupportedError: Method not supported]',
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
      '[RpcResponse.LimitExceededError: Limit exceeded]',
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
      '[RpcResponse.VersionNotSupportedError: Version not supported]',
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
      '[RpcResponse.InvalidRequestError: Invalid Request]',
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
      '[RpcResponse.MethodNotFoundError: Method not found]',
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
      '[RpcResponse.InvalidParamsError: Method not found]',
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
      '[RpcResponse.InternalErrorError: Method not found]',
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
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.ParseError: Method not found]',
    )
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
    ).toThrowErrorMatchingInlineSnapshot('[RpcResponse.BaseError: oh no]')
  })
})

test('InvalidInputError', () => {
  expect(new RpcResponse.InvalidInputError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidInputError: Missing or invalid parameters.]',
  )
  expect(
    new RpcResponse.InvalidInputError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidInputError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidInputError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidInputError","code":-32000}"`,
  )
})

test('ResourceNotFoundError', () => {
  expect(new RpcResponse.ResourceNotFoundError()).toMatchInlineSnapshot(
    '[RpcResponse.ResourceNotFoundError: Requested resource not found.]',
  )
  expect(
    new RpcResponse.ResourceNotFoundError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.ResourceNotFoundError: foo]')
  expect(
    JSON.stringify(new RpcResponse.ResourceNotFoundError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ResourceNotFoundError","code":-32001}"`,
  )
})

test('ResourceUnavailableError', () => {
  expect(new RpcResponse.ResourceUnavailableError()).toMatchInlineSnapshot(
    '[RpcResponse.ResourceUnavailableError: Requested resource not available.]',
  )
  expect(
    new RpcResponse.ResourceUnavailableError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.ResourceUnavailableError: foo]')
  expect(
    JSON.stringify(new RpcResponse.ResourceUnavailableError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ResourceUnavailableError","code":-32002}"`,
  )
})

test('TransactionRejectedError', () => {
  expect(new RpcResponse.TransactionRejectedError()).toMatchInlineSnapshot(
    '[RpcResponse.TransactionRejectedError: Transaction creation failed.]',
  )
  expect(
    new RpcResponse.TransactionRejectedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.TransactionRejectedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.TransactionRejectedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.TransactionRejectedError","code":-32003}"`,
  )
})

test('MethodNotSupportedError', () => {
  expect(new RpcResponse.MethodNotSupportedError()).toMatchInlineSnapshot(
    '[RpcResponse.MethodNotSupportedError: Method is not implemented.]',
  )
  expect(
    new RpcResponse.MethodNotSupportedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.MethodNotSupportedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.MethodNotSupportedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.MethodNotSupportedError","code":-32004}"`,
  )
})

test('LimitExceededError', () => {
  expect(new RpcResponse.LimitExceededError()).toMatchInlineSnapshot(
    '[RpcResponse.LimitExceededError: Rate limit exceeded.]',
  )
  expect(
    new RpcResponse.LimitExceededError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.LimitExceededError: foo]')
  expect(
    JSON.stringify(new RpcResponse.LimitExceededError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.LimitExceededError","code":-32005}"`,
  )
})

test('VersionNotSupportedError', () => {
  expect(new RpcResponse.VersionNotSupportedError()).toMatchInlineSnapshot(
    '[RpcResponse.VersionNotSupportedError: JSON-RPC version not supported.]',
  )
  expect(
    new RpcResponse.VersionNotSupportedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.VersionNotSupportedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.VersionNotSupportedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.VersionNotSupportedError","code":-32006}"`,
  )
})

test('InvalidRequestError', () => {
  expect(new RpcResponse.InvalidRequestError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidRequestError: Input is not a valid JSON-RPC request.]',
  )
  expect(
    new RpcResponse.InvalidRequestError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidRequestError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidRequestError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidRequestError","code":-32600}"`,
  )
})

test('MethodNotFoundError', () => {
  expect(new RpcResponse.MethodNotFoundError()).toMatchInlineSnapshot(
    '[RpcResponse.MethodNotFoundError: Method does not exist.]',
  )
  expect(
    new RpcResponse.MethodNotFoundError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.MethodNotFoundError: foo]')
  expect(
    JSON.stringify(new RpcResponse.MethodNotFoundError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.MethodNotFoundError","code":-32601}"`,
  )
})

test('InvalidParamsError', () => {
  expect(new RpcResponse.InvalidParamsError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidParamsError: Invalid method parameters.]',
  )
  expect(
    new RpcResponse.InvalidParamsError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidParamsError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidParamsError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidParamsError","code":-32602}"`,
  )
})

test('InternalError', () => {
  expect(new RpcResponse.InternalError()).toMatchInlineSnapshot(
    '[RpcResponse.InternalErrorError: Internal JSON-RPC error.]',
  )
  expect(
    new RpcResponse.InternalError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InternalErrorError: foo]')
  expect(JSON.stringify(new RpcResponse.InternalError())).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InternalErrorError","code":-32603}"`,
  )
})

test('ParseError', () => {
  expect(new RpcResponse.ParseError()).toMatchInlineSnapshot(
    '[RpcResponse.ParseError: Failed to parse JSON-RPC response.]',
  )
  expect(new RpcResponse.ParseError({ message: 'foo' })).toMatchInlineSnapshot(
    '[RpcResponse.ParseError: foo]',
  )
  expect(JSON.stringify(new RpcResponse.ParseError())).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ParseError","code":-32700}"`,
  )
})

test('exports', () => {
  expect(Object.keys(RpcResponse)).toMatchInlineSnapshot(`
    [
      "from",
      "parse",
      "BaseError",
      "InvalidInputError",
      "ResourceNotFoundError",
      "ResourceUnavailableError",
      "TransactionRejectedError",
      "MethodNotSupportedError",
      "LimitExceededError",
      "VersionNotSupportedError",
      "InvalidRequestError",
      "MethodNotFoundError",
      "InvalidParamsError",
      "InternalError",
      "ParseError",
    ]
  `)
})
