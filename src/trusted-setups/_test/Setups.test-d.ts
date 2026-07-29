import { expectTypeOf, test } from 'vp/test'
import type * as WasmKzg from '../../wasm/Kzg.js'
import * as Setups from '../Setups.js'

test('mainnet satisfies the WASM KZG trusted setup', () => {
  expectTypeOf(Setups.mainnet).toMatchTypeOf<WasmKzg.TrustedSetup>()
})
