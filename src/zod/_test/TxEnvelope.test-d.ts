import type * as core_TxEnvelopeEip1559 from '../../core/TxEnvelopeEip1559.js'
import type * as core_TxEnvelopeEip2930 from '../../core/TxEnvelopeEip2930.js'
import type * as core_TxEnvelopeEip4844 from '../../core/TxEnvelopeEip4844.js'
import type * as core_TxEnvelopeEip7702 from '../../core/TxEnvelopeEip7702.js'
import type * as core_TxEnvelopeLegacy from '../../core/TxEnvelopeLegacy.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TxEnvelopeEip1559 from '../TxEnvelopeEip1559.js'
import * as z_TxEnvelopeEip2930 from '../TxEnvelopeEip2930.js'
import * as z_TxEnvelopeEip4844 from '../TxEnvelopeEip4844.js'
import * as z_TxEnvelopeEip7702 from '../TxEnvelopeEip7702.js'
import * as z_TxEnvelopeLegacy from '../TxEnvelopeLegacy.js'

test('TxEnvelope schemas preserve decoded and encoded types', () => {
  expectTypeOf<core_TxEnvelopeLegacy.TxEnvelopeLegacy>().toMatchTypeOf<
    z.output<typeof z_TxEnvelopeLegacy.TxEnvelopeLegacy>
  >()
  expectTypeOf<core_TxEnvelopeLegacy.Rpc>().toMatchTypeOf<
    z.input<typeof z_TxEnvelopeLegacy.TxEnvelopeLegacy>
  >()
  expectTypeOf<
    z.output<typeof z_TxEnvelopeLegacy.Signed>
  >().toEqualTypeOf<core_TxEnvelopeLegacy.Signed>()

  expectTypeOf<core_TxEnvelopeEip2930.TxEnvelopeEip2930>().toMatchTypeOf<
    z.output<typeof z_TxEnvelopeEip2930.TxEnvelopeEip2930>
  >()
  expectTypeOf<core_TxEnvelopeEip2930.Rpc>().toMatchTypeOf<
    z.input<typeof z_TxEnvelopeEip2930.TxEnvelopeEip2930>
  >()
  expectTypeOf<
    z.output<typeof z_TxEnvelopeEip2930.Signed>
  >().toEqualTypeOf<core_TxEnvelopeEip2930.Signed>()

  expectTypeOf<core_TxEnvelopeEip1559.TxEnvelopeEip1559>().toMatchTypeOf<
    z.output<typeof z_TxEnvelopeEip1559.TxEnvelopeEip1559>
  >()
  expectTypeOf<core_TxEnvelopeEip1559.Rpc>().toMatchTypeOf<
    z.input<typeof z_TxEnvelopeEip1559.TxEnvelopeEip1559>
  >()
  expectTypeOf<
    z.output<typeof z_TxEnvelopeEip1559.Signed>
  >().toEqualTypeOf<core_TxEnvelopeEip1559.Signed>()

  expectTypeOf<z.output<typeof z_TxEnvelopeEip4844.Sidecars>>().toEqualTypeOf<
    core_TxEnvelopeEip4844.Sidecars<`0x${string}`>
  >()
  expectTypeOf<core_TxEnvelopeEip4844.TxEnvelopeEip4844>().toMatchTypeOf<
    z.output<typeof z_TxEnvelopeEip4844.TxEnvelopeEip4844>
  >()
  expectTypeOf<core_TxEnvelopeEip4844.Rpc>().toMatchTypeOf<
    z.input<typeof z_TxEnvelopeEip4844.TxEnvelopeEip4844>
  >()
  expectTypeOf<
    z.output<typeof z_TxEnvelopeEip4844.Signed>
  >().toEqualTypeOf<core_TxEnvelopeEip4844.Signed>()

  expectTypeOf<core_TxEnvelopeEip7702.TxEnvelopeEip7702>().toMatchTypeOf<
    z.output<typeof z_TxEnvelopeEip7702.TxEnvelopeEip7702>
  >()
  expectTypeOf<core_TxEnvelopeEip7702.Rpc>().toMatchTypeOf<
    z.input<typeof z_TxEnvelopeEip7702.TxEnvelopeEip7702>
  >()
  expectTypeOf<
    z.output<typeof z_TxEnvelopeEip7702.Signed>
  >().toEqualTypeOf<core_TxEnvelopeEip7702.Signed>()
})
