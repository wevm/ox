/** @entrypointCategory ERCs */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc
export type {}

/**
 * Utility functions for working with [RFC 9530 Content-Digest](https://www.rfc-editor.org/rfc/rfc9530) headers.
 *
 * @example
 * ```ts twoslash
 * import { ContentDigest } from 'ox/erc8128'
 *
 * const header = ContentDigest.compute(new TextEncoder().encode('hello'))
 * const valid = ContentDigest.verify({ body: new TextEncoder().encode('hello'), header })
 * ```
 *
 * @category ERC-8128
 */
export * as ContentDigest from './ContentDigest.js'

/**
 * Utility functions for working with [ERC-8128 Signed HTTP Requests](https://github.com/slice-so/ERCs/blob/9f6cf39b52b94d405dcc4e521916a0ab00f03e2a/ERCS/erc-8128.md).
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const { payload, signatureInput } = await HttpSignature.getSignPayload({
 *   request: {
 *     method: 'GET',
 *     authority: 'api.example.com',
 *     path: '/hello',
 *   },
 *   chainId: 1,
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * })
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @category ERC-8128
 */
export * as HttpSignature from './HttpSignature.js'
