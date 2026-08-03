// Runs the conformance-validated WASM EVM engine as a differential oracle for
// the TypeScript interpreter. Stateless subset only: bytecode + calldata in,
// status class + gas + output out.

import { wasmBase64 } from './engine.wasm.js'

type Engine = {
  memory: WebAssembly.Memory
  evm_new(memoryCap: number): number
  evm_code_ptr(vm: number): number
  evm_input_ptr(vm: number): number
  evm_output_ptr(vm: number): number
  evm_output_len(vm: number): number
  evm_gas_left(vm: number): bigint
  evm_max_code(): number
  evm_max_input(): number
  evm_set_code(vm: number, codeLength: number): number
  evm_set_spec(vm: number, spec: number): number
  evm_run(vm: number, inputLength: number, gas: bigint): number
}

// The engine's internal spec ids for the forks the TS core implements.
const specs = { cancun: 12, osaka: 14, prague: 13 } as const

const statuses = [
  'success',
  'reverted',
  'out-of-gas',
  'stack-underflow',
  'stack-overflow',
  'invalid-opcode',
  'invalid-jump',
  'out-of-memory',
  'code-too-large',
  'input-too-large',
  'static-violation',
] as const

let module_: WebAssembly.Module | undefined
let engine: Engine | undefined
let vm = 0

function instantiate(): void {
  module_ ??= new WebAssembly.Module(
    Uint8Array.from(Buffer.from(wasmBase64, 'base64')),
  )
  engine = new WebAssembly.Instance(module_, {}).exports as unknown as Engine
  vm = engine.evm_new(0)
  if (!vm) throw new Error('oracle: evm_new returned null')
}

export type OracleResult = {
  /** Consensus-meaningful classification — halt reasons are equivalent. */
  statusClass: 'success' | 'reverted' | 'exceptional'
  /** The engine's own status string, for failure diagnostics. */
  status: (typeof statuses)[number]
  gasUsed: bigint
  /** Output bytes for `success`/`reverted`; empty for exceptional halts. */
  output: Uint8Array
}

/** Executes bytecode on the WASM engine. */
export function run(options: {
  bytecode: Uint8Array
  data?: Uint8Array | undefined
  gas: bigint
  hardfork?: keyof typeof specs | undefined
}): OracleResult {
  const {
    bytecode,
    data = new Uint8Array(0),
    gas,
    hardfork = 'osaka',
  } = options
  if (!engine) instantiate()
  const e = engine as Engine

  if (bytecode.length > e.evm_max_code())
    throw new Error('oracle: bytecode exceeds engine capacity')
  if (data.length > e.evm_max_input())
    throw new Error('oracle: calldata exceeds engine capacity')

  try {
    e.evm_set_spec(vm, specs[hardfork])
    // Re-derive the view after every call that can grow linear memory —
    // growth detaches earlier views.
    new Uint8Array(e.memory.buffer).set(bytecode, e.evm_code_ptr(vm))
    e.evm_set_code(vm, bytecode.length)
    new Uint8Array(e.memory.buffer).set(data, e.evm_input_ptr(vm))

    const status = statuses[e.evm_run(vm, data.length, gas)] ?? 'invalid-opcode'
    const gasLeft = e.evm_gas_left(vm)
    const outputPtr = e.evm_output_ptr(vm)
    const output = new Uint8Array(e.memory.buffer).slice(
      outputPtr,
      outputPtr + e.evm_output_len(vm),
    )
    return {
      gasUsed: gas - gasLeft,
      output,
      status,
      statusClass:
        status === 'success' || status === 'reverted' ? status : 'exceptional',
    }
  } catch (error) {
    // A wasm trap leaves the shadow stack pointer where it was, poisoning the
    // instance — re-instantiate so one bad case is not reported as thousands.
    instantiate()
    throw error
  }
}
