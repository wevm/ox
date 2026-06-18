import type * as core_Address from '../../core/Address.js'
import type * as core_Block from '../../core/Block.js'
import type * as core_Fee from '../../core/Fee.js'
import type * as core_Hex from '../../core/Hex.js'
import { expectTypeOf, test } from 'vp/test'
import * as z from 'zod/mini'
import * as z_RpcSchema from '../RpcSchema.js'

test('method items mirror wire (input) and domain (output) shapes', () => {
  // Scalar return types stay as wire hex.
  expectTypeOf<
    z.input<typeof z_RpcSchema.Eth.eth_blockNumber.returns>
  >().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<
    z.output<typeof z_RpcSchema.Eth.eth_blockNumber.returns>
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

test('parse helpers infer params/returns by method', () => {
  // Params: block number is wire hex on input, bigint on output.
  expectTypeOf(
    z_RpcSchema.parseParams(z_RpcSchema.Eth, 'eth_getBlockByNumber', [
      '0x1',
      true,
    ]),
  ).toMatchTypeOf<[bigint | core_Block.Tag, boolean]>()

  // Returns: decoded to domain values.
  expectTypeOf(
    z_RpcSchema.parseReturns(z_RpcSchema.Eth, 'eth_blockNumber', '0x1b4'),
  ).toEqualTypeOf<core_Hex.Hex>()

  // Item lookup preserves the literal method name.
  expectTypeOf(
    z_RpcSchema.parseItem(z_RpcSchema.Eth, 'eth_blockNumber').method,
  ).toEqualTypeOf<'eth_blockNumber'>()
})

test('from: namespace returns a parseable namespace', () => {
  const schema = z_RpcSchema.from({
    abe_foo: {
      params: z.tuple([z.number()]),
      returns: z.string(),
    },
  })

  // Method name taken from the key.
  expectTypeOf(schema.abe_foo.method).toEqualTypeOf<'abe_foo'>()

  // Usable with parse* methods.
  expectTypeOf(z_RpcSchema.parseParams(schema, 'abe_foo', [1])).toEqualTypeOf<
    [number]
  >()
  expectTypeOf(
    z_RpcSchema.parseReturns(schema, 'abe_foo', 'hello'),
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
