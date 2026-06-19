import type * as core_Address from '../../core/Address.js'
import type * as core_Block from '../../core/Block.js'
import type * as core_Fee from '../../core/Fee.js'
import type * as core_Hex from '../../core/Hex.js'
import { expectTypeOf, test } from 'vp/test'
import * as z from 'zod/mini'
import * as z_RpcSchema from '../RpcSchema.js'

test('method items mirror wire (input) and domain (output) shapes', () => {
  // Scalar quantity return types are wire hex on input, native on output.
  expectTypeOf<
    z.input<typeof z_RpcSchema.Eth.eth_blockNumber.returns>
  >().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_blockNumber.returns>
  >().toEqualTypeOf<bigint>()
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_chainId.returns>
  >().toEqualTypeOf<number>()

  // Data/bytecode return types stay as wire hex.
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_call.returns>
  >().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_getCode.returns>
  >().toEqualTypeOf<core_Hex.Hex>()

  // Address arrays.
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_accounts.returns>
  >().toEqualTypeOf<core_Address.Address[]>()

  // Fee history return type decodes to the domain fee history.
  expectTypeOf<
    z.input<typeof z_RpcSchema.Eth.eth_feeHistory.returns>
  >().toEqualTypeOf<core_Fee.FeeHistoryRpc>()
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_feeHistory.returns>
  >().toEqualTypeOf<core_Fee.FeeHistory>()
})

test('decode helpers infer params/returns by method', () => {
  // Params: block number is wire hex on input, bigint on output.
  expectTypeOf(
    z_RpcSchema.decodeParams(z_RpcSchema.Eth, 'eth_getBlockByNumber', [
      '0x1',
      true,
    ]),
  ).toMatchTypeOf<[bigint | core_Block.Tag, boolean]>()

  // Returns: decoded to domain values.
  expectTypeOf(
    z_RpcSchema.decodeReturns(z_RpcSchema.Eth, 'eth_blockNumber', '0x1b4'),
  ).toEqualTypeOf<bigint>()

  // Item lookup preserves the literal method name.
  expectTypeOf(
    z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_blockNumber').method,
  ).toEqualTypeOf<'eth_blockNumber'>()
})

test('encode helpers infer params/returns by method', () => {
  // Returns: native bigint on input, wire hex on output.
  expectTypeOf(
    z_RpcSchema.encodeReturns(z_RpcSchema.Eth, 'eth_blockNumber', 436n),
  ).toEqualTypeOf<core_Hex.Hex>()

  // Params: block selector encodes to the wire shape. The EIP-1898 identifier
  // branch must encode `blockNumber` as wire hex (matching the core request
  // param type `Block.Identifier<Hex.Hex>`), not native bigint.
  expectTypeOf(
    z_RpcSchema.encodeParams(z_RpcSchema.Eth, 'eth_getTransactionCount', [
      '0x0000000000000000000000000000000000000000',
      { blockNumber: 436n },
    ]),
  ).toMatchTypeOf<
    readonly [
      core_Address.Address,
      (
        | core_Block.Number<core_Hex.Hex>
        | core_Block.Tag
        | core_Block.Identifier<core_Hex.Hex>
      ),
    ]
  >()
})

test('codecs accept a resolved item and infer params/returns', () => {
  const item = z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_getTransactionCount')

  // Params: native on encode input, wire on encode output.
  expectTypeOf(
    z_RpcSchema.encodeParams(item, [
      '0x0000000000000000000000000000000000000000',
      { blockNumber: 436n },
    ]),
  ).toMatchTypeOf<
    readonly [
      core_Address.Address,
      (
        | core_Block.Number<core_Hex.Hex>
        | core_Block.Tag
        | core_Block.Identifier<core_Hex.Hex>
      ),
    ]
  >()

  // Returns: wire hex on decode input, native number on decode output.
  expectTypeOf(z_RpcSchema.decodeReturns(item, '0x1b4')).toEqualTypeOf<number>()
  expectTypeOf(
    z_RpcSchema.encodeReturns(item, 436),
  ).toEqualTypeOf<core_Hex.Hex>()
})

test('from: namespace returns a decodable namespace', () => {
  const schema = z_RpcSchema.from({
    abe_foo: {
      params: z.tuple([z.number()]),
      returns: z.string(),
    },
  })

  // Method name taken from the key.
  expectTypeOf(schema.abe_foo.method).toEqualTypeOf<'abe_foo'>()

  // Usable with decode* methods.
  expectTypeOf(z_RpcSchema.decodeParams(schema, 'abe_foo', [1])).toEqualTypeOf<
    [number]
  >()
  expectTypeOf(
    z_RpcSchema.decodeReturns(schema, 'abe_foo', 'hello'),
  ).toEqualTypeOf<string>()
})

test('from: single method returns an Item', () => {
  const item = z_RpcSchema.from({
    method: 'abe_foo',
    params: z.tuple([z.number()]),
    returns: z.string(),
  })
  expectTypeOf(item.method).toEqualTypeOf<'abe_foo'>()
})
