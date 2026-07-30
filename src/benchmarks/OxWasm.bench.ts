import { Engine } from 'ox'
import {
  Engine as WasmEngine,
  Keystore as WasmKeystore,
  Secp256k1 as WasmSecp256k1,
} from 'ox/wasm'
import { register } from '../../test/benchmarks/comparison.js'
import { createOperations } from '../../test/benchmarks/comparison.current.js'

const [wasm, keystore, secp256k1] = await Promise.all([
  WasmEngine.engine(),
  WasmKeystore.engine(),
  WasmSecp256k1.engine(),
])

Engine.reset()
Engine.set({
  ...wasm,
  Keystore: keystore,
  Secp256k1: secp256k1,
})
register('ox/wasm', createOperations())
