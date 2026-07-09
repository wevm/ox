import type * as core_Abi from '../../core/Abi.js'
import type * as core_AbiConstructor from '../../core/AbiConstructor.js'
import type * as core_AbiError from '../../core/AbiError.js'
import type * as core_AbiEvent from '../../core/AbiEvent.js'
import type * as core_AbiFunction from '../../core/AbiFunction.js'
import type * as core_AbiItem from '../../core/AbiItem.js'
import type * as core_AbiParameter from '../../core/AbiParameter.js'
import type * as core_AbiParameters from '../../core/AbiParameters.js'
import { expectTypeOf, test } from 'vp/test'
import * as z_Abi from '../Abi.js'
import * as z_AbiConstructor from '../AbiConstructor.js'
import * as z_AbiError from '../AbiError.js'
import * as z_AbiEvent from '../AbiEvent.js'
import * as z_AbiFunction from '../AbiFunction.js'
import * as z_AbiItem from '../AbiItem.js'
import * as z_AbiParameter from '../AbiParameter.js'
import * as z_AbiParameters from '../AbiParameters.js'
import type * as z from 'zod/mini'

test('ABI schemas output Ox core ABI types', () => {
  expectTypeOf<z.output<typeof z_Abi.Abi>>().toMatchTypeOf<core_Abi.Abi>()
  expectTypeOf<
    z.output<typeof z_AbiConstructor.AbiConstructor>
  >().toMatchTypeOf<core_AbiConstructor.AbiConstructor>()
  expectTypeOf<
    z.output<typeof z_AbiError.AbiError>
  >().toMatchTypeOf<core_AbiError.AbiError>()
  expectTypeOf<
    z.output<typeof z_AbiEvent.AbiEvent>
  >().toMatchTypeOf<core_AbiEvent.AbiEvent>()
  expectTypeOf<
    z.output<typeof z_AbiFunction.AbiFunction>
  >().toMatchTypeOf<core_AbiFunction.AbiFunction>()
  expectTypeOf<
    z.output<typeof z_AbiItem.AbiItem>
  >().toMatchTypeOf<core_AbiItem.AbiItem>()
  expectTypeOf<
    z.output<typeof z_AbiParameter.AbiParameter>
  >().toMatchTypeOf<core_AbiParameter.AbiParameter>()
  expectTypeOf<
    z.output<typeof z_AbiParameter.AbiEventParameter>
  >().toMatchTypeOf<core_AbiParameter.AbiEventParameter>()
  expectTypeOf<
    z.output<typeof z_AbiParameters.AbiParameters>
  >().toMatchTypeOf<core_AbiParameters.AbiParameters>()
})
