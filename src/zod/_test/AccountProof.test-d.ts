import type * as core_AccountProof from '../../core/AccountProof.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AccountProof from '../AccountProof.js'

test('AccountProof schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_AccountProof.StorageProof>
  >().toEqualTypeOf<core_AccountProof.StorageProof>()
  expectTypeOf<core_AccountProof.StorageProofRpc>().toMatchTypeOf<
    z.input<typeof z_AccountProof.StorageProof>
  >()
  expectTypeOf<
    z.output<typeof z_AccountProof.AccountProof>
  >().toEqualTypeOf<core_AccountProof.AccountProof>()
  expectTypeOf<core_AccountProof.Rpc>().toMatchTypeOf<
    z.input<typeof z_AccountProof.AccountProof>
  >()
})
