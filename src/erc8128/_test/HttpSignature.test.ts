import { Secp256k1, Signature } from 'ox'
import { HttpSignature } from 'ox/erc8128'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('getSignPayload', () => {
  test('default', async () => {
    const { payload, signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'POST',
        authority: 'api.example.com',
        path: '/foo',
        query: '?a=1&b=two',
        body: new TextEncoder().encode('hello'),
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1736940000,
      expires: 1736940060,
      nonce: 'b64url_r4Nd0mN0nCEK0YQY4d4r7A',
    })

    expect(payload).toMatchInlineSnapshot(
      `"0x1a25bd6bf96f0d3ca81984063bc046d8c679449c740f56d747cff4a6ac8a7be0"`,
    )
    expect(signatureInput).toMatchInlineSnapshot(
      `"eth=("@authority" "@method" "@path" "@query" "content-digest");created=1736940000;expires=1736940060;nonce="b64url_r4Nd0mN0nCEK0YQY4d4r7A";keyid="erc8128:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045""`,
    )
  })

  test('behavior: GET request (no body, no query)', async () => {
    const { payload, signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/hello',
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    expect(payload).toMatchInlineSnapshot(
      `"0x01d46f7275ea0beec4431dcc699d3e155df7fdcfeba215207dd5c62555e90bcc"`,
    )
    expect(signatureInput).toMatchInlineSnapshot(
      `"eth=("@authority" "@method" "@path");created=1700000000;expires=1700000060;nonce="testnonce123";keyid="erc8128:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045""`,
    )
  })

  test('behavior: GET request with query', async () => {
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/search',
        query: '?q=test',
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    expect(signatureInput).toContain('"@query"')
    expect(signatureInput).not.toContain('content-digest')
  })

  test('behavior: custom label', async () => {
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/hello',
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
      label: 'sig1',
    })

    expect(signatureInput).toMatch(/^sig1=/)
  })

  test('behavior: defaults (created, expires, nonce)', async () => {
    const before = Math.floor(Date.now() / 1000)
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/hello',
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    })
    const after = Math.floor(Date.now() / 1000)

    const createdMatch = signatureInput.match(/created=(\d+)/)
    const expiresMatch = signatureInput.match(/expires=(\d+)/)
    const nonceMatch = signatureInput.match(/nonce="([^"]+)"/)

    expect(createdMatch).not.toBeNull()
    expect(expiresMatch).not.toBeNull()
    expect(nonceMatch).not.toBeNull()

    const created = Number(createdMatch![1])
    const expires = Number(expiresMatch![1])

    expect(created).toBeGreaterThanOrEqual(before)
    expect(created).toBeLessThanOrEqual(after)
    expect(expires).toBe(created + 60)
    expect(nonceMatch![1]!.length).toBeGreaterThan(0)
  })

  test('behavior: existing content-digest header preserved', async () => {
    const customDigest = 'sha-256=:customdigest:'
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'POST',
        authority: 'api.example.com',
        path: '/foo',
        body: new TextEncoder().encode('hello'),
        headers: { 'content-digest': customDigest },
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    expect(signatureInput).toContain('content-digest')
  })

  test('behavior: roundtrip sign + recover', async () => {
    const { payload } = await HttpSignature.getSignPayload({
      request: {
        method: 'POST',
        authority: 'api.example.com',
        path: '/foo',
        body: new TextEncoder().encode('test body'),
      },
      chainId: 1,
      address: accounts[0].address,
      created: 1700000000,
      expires: 1700000060,
      nonce: 'roundtripnonce',
    })

    const signature = Secp256k1.sign({
      payload,
      privateKey: accounts[0].privateKey,
    })

    const recoveredAddress = Secp256k1.recoverAddress({
      payload,
      signature,
    })

    expect(recoveredAddress).toBe(accounts[0].address)
  })

  test('behavior: different chain id', async () => {
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/hello',
      },
      chainId: 10,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    expect(signatureInput).toContain('erc8128:10:')
  })

  test('behavior: Fetch API Request', async () => {
    const fetchRequest = new Request('https://api.example.com/foo?a=1&b=two', {
      method: 'POST',
      body: new TextEncoder().encode('hello'),
    })

    const { payload, signatureInput } = await HttpSignature.getSignPayload({
      request: fetchRequest,
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1736940000,
      expires: 1736940060,
      nonce: 'b64url_r4Nd0mN0nCEK0YQY4d4r7A',
    })

    // Should produce the same payload as the equivalent plain request.
    const { payload: plainPayload } = await HttpSignature.getSignPayload({
      request: {
        method: 'POST',
        authority: 'api.example.com',
        path: '/foo',
        query: '?a=1&b=two',
        body: new TextEncoder().encode('hello'),
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1736940000,
      expires: 1736940060,
      nonce: 'b64url_r4Nd0mN0nCEK0YQY4d4r7A',
    })

    expect(payload).toBe(plainPayload)
    expect(signatureInput).toContain('"@query"')
    expect(signatureInput).toContain('content-digest')
  })

  test('behavior: Fetch API Request (GET, no body)', async () => {
    const fetchRequest = new Request('https://api.example.com/hello')

    const { signatureInput } = await HttpSignature.getSignPayload({
      request: fetchRequest,
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    expect(signatureInput).not.toContain('"@query"')
    expect(signatureInput).not.toContain('content-digest')
  })

  test('behavior: custom components', async () => {
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'POST',
        authority: 'api.example.com',
        path: '/foo',
        query: '?a=1',
        body: new TextEncoder().encode('hello'),
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
      components: ['@authority', '@method'],
    })

    expect(signatureInput).toMatchInlineSnapshot(
      `"eth=("@authority" "@method");created=1700000000;expires=1700000060;nonce="testnonce123";keyid="erc8128:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045""`,
    )
  })

  test('behavior: custom components override does not include auto-detected', async () => {
    const { signatureInput } = await HttpSignature.getSignPayload({
      request: {
        method: 'GET',
        authority: 'api.example.com',
        path: '/search',
        query: '?q=test',
      },
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
      components: ['@authority'],
    })

    // Only @authority should be in components, not @method/@path/@query.
    expect(signatureInput).toMatch(/^eth=\("@authority"\)/)
    expect(signatureInput).not.toContain('"@method"')
    expect(signatureInput).not.toContain('"@path"')
    expect(signatureInput).not.toContain('"@query"')
  })
})

describe('serialize', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0x0000000000000000000000000000000000000000000000000000000000000001',
      privateKey: accounts[0].privateKey,
    })

    const header = HttpSignature.serialize({ signature: Signature.toHex(signature) })

    expect(header).toMatch(/^eth=:/)
    expect(header).toMatch(/:$/)
  })

  test('behavior: custom label', () => {
    const signature = Secp256k1.sign({
      payload: '0x0000000000000000000000000000000000000000000000000000000000000001',
      privateKey: accounts[0].privateKey,
    })

    const header = HttpSignature.serialize({ signature: Signature.toHex(signature), label: 'sig1' })

    expect(header).toMatch(/^sig1=:/)
  })
})

describe('toRequest', () => {
  test('default', async () => {
    const request = new Request('https://api.example.com/foo', {
      method: 'GET',
    })

    const { payload, signatureInput } = await HttpSignature.getSignPayload({
      request,
      chainId: 1,
      address: accounts[0].address,
      created: 1700000000,
      expires: 1700000060,
      nonce: 'testnonce123',
    })

    const signature = Secp256k1.sign({
      payload,
      privateKey: accounts[0].privateKey,
    })

    const signatureHex = Signature.toHex(signature)

    const signed = HttpSignature.toRequest({
      request,
      signature: signatureHex,
      signatureInput,
    })

    expect(signed.headers.get('signature-input')).toBe(signatureInput)
    expect(signed.headers.get('signature')).toMatch(/^eth=:/)

    // Verify roundtrip: recover address from the signed request.
    const extracted = HttpSignature.fromRequest(signed)

    const recovered = Secp256k1.recoverAddress({
      payload,
      signature: Signature.fromHex(extracted.signature),
    })

    expect(recovered).toBe(accounts[0].address)
    expect(extracted.signatureInput).toBe(signatureInput)
  })
})

describe('fromRequest', () => {
  test('behavior: missing Signature-Input header', () => {
    const request = new Request('https://api.example.com/foo')
    expect(() =>
      HttpSignature.fromRequest(request),
    ).toThrowErrorMatchingInlineSnapshot(
      '[HttpSignature.MissingHeaderError: Missing required header: "Signature-Input".]',
    )
  })

  test('behavior: missing Signature header', () => {
    const request = new Request('https://api.example.com/foo', {
      headers: { 'signature-input': 'eth=("@method");created=1' },
    })
    expect(() =>
      HttpSignature.fromRequest(request),
    ).toThrowErrorMatchingInlineSnapshot(
      '[HttpSignature.MissingHeaderError: Missing required header: "Signature".]',
    )
  })

  test('behavior: invalid Signature header', () => {
    const request = new Request('https://api.example.com/foo', {
      headers: {
        'signature-input': 'eth=("@method");created=1',
        signature: 'invalid',
      },
    })
    expect(() =>
      HttpSignature.fromRequest(request),
    ).toThrowErrorMatchingInlineSnapshot(
      '[HttpSignature.InvalidSignatureHeaderError: Invalid Signature header value: "invalid".]',
    )
  })
})
