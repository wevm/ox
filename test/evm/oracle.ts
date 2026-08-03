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
  evm_stage_ptr(vm: number): number
  evm_reset(vm: number): void
  evm_put_account(vm: number, nonce: bigint, codeLength: number): number
  evm_put_storage(vm: number): number
  evm_warm_account(vm: number): number
  evm_warm_storage(vm: number): number
  evm_set_context(
    vm: number,
    number_: bigint,
    timestamp: bigint,
    blockGasLimit: bigint,
    blobCount: number,
    blockHashCount: number,
    spec: number,
  ): number
  evm_execute(
    vm: number,
    inputLength: number,
    gas: bigint,
    isStatic: number,
  ): number
  evm_refund(vm: number): bigint
  evm_account_count(vm: number): number
  evm_account_at(vm: number, index: number): number
  evm_account_nonce(vm: number, index: number): bigint
  evm_storage_count(vm: number): number
  evm_storage_at(vm: number, index: number): number
  evm_log_count(vm: number): number
  evm_log_at(vm: number, index: number): number
}

// Stage-buffer layout (matches the engine's fixed offsets).
const STAGE_ADDR = 0
const STAGE_ADDR2 = 20
const STAGE_WORD_A = 64
const STAGE_WORD_B = 96
const STAGE_BYTES = 128

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

export type ExecuteResult = {
  statusClass: 'success' | 'reverted' | 'exceptional'
  status: (typeof statuses)[number]
  gasUsed: bigint
  refund: bigint
  output: Uint8Array
  /** Post-state accounts as the engine enumerates them. */
  accounts: Map<string, { balance: bigint; nonce: bigint; code: Uint8Array }>
  /** Post-state storage writes as the engine enumerates them. */
  storage: Map<string, Map<bigint, bigint>>
  logs: { address: string; topics: bigint[]; data: Uint8Array }[]
}

/**
 * Executes a call frame over staged state on the WASM engine — the stateful
 * differential path. The frame runs the code of the staged account at
 * `address`. Warms exactly `address`, `caller`, and `origin` (matching the
 * TS `Evm.run` preamble); no value transfer is performed (`CALLVALUE` only).
 */
export function execute(options: {
  accounts: readonly {
    address: string
    balance: bigint
    code: Uint8Array
    nonce: bigint
  }[]
  address: string
  blobHashes?: readonly bigint[] | undefined
  block?:
    | {
        baseFee?: bigint | undefined
        blobBaseFee?: bigint | undefined
        chainId?: bigint | undefined
        coinbase?: string | undefined
        gasLimit?: bigint | undefined
        number?: bigint | undefined
        prevRandao?: bigint | undefined
        timestamp?: bigint | undefined
      }
    | undefined
  caller?: string | undefined
  /** Ancestor hashes, nearest first (`chainHashes[0]` is block `number - 1`). */
  chainHashes?: readonly bigint[] | undefined
  data?: Uint8Array | undefined
  gas: bigint
  gasPrice?: bigint | undefined
  hardfork?: keyof typeof specs | undefined
  static?: boolean | undefined
  storage?:
    | readonly { address: string; slot: bigint; value: bigint }[]
    | undefined
  value?: bigint | undefined
}): ExecuteResult {
  const {
    accounts,
    address,
    blobHashes = [],
    block = {},
    caller = `0x${'00'.repeat(20)}`,
    chainHashes = [],
    data = new Uint8Array(0),
    gas,
    gasPrice = 0n,
    hardfork = 'osaka',
    static: static_ = false,
    storage = [],
    value = 0n,
  } = options
  if (!engine) instantiate()
  const e = engine as Engine

  const mem = () => new Uint8Array(e.memory.buffer)
  const stage = () => e.evm_stage_ptr(vm)
  const putAddr = (offset: number, value: string) => {
    const bytes = Buffer.from(value.slice(2).padStart(40, '0'), 'hex')
    mem().set(bytes, stage() + offset)
  }
  const putWord = (offset: number, value: bigint) => {
    const bytes = Buffer.from(value.toString(16).padStart(64, '0'), 'hex')
    mem().set(bytes, stage() + offset)
  }
  const getAddr = (offset: number) =>
    `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 20)).toString('hex')}`
  const getWord = (offset: number) =>
    BigInt(
      `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 32)).toString('hex')}`,
    )

  try {
    e.evm_reset(vm)

    // Pre-state.
    for (const account of accounts) {
      putAddr(STAGE_ADDR, account.address)
      putWord(STAGE_WORD_A, account.balance)
      mem().set(account.code, stage() + STAGE_BYTES)
      if (e.evm_put_account(vm, account.nonce, account.code.length) !== 0)
        throw new Error('oracle: account staging capacity exceeded')
    }
    for (const entry of storage) {
      putAddr(STAGE_ADDR, entry.address)
      putWord(STAGE_WORD_A, entry.slot)
      putWord(STAGE_WORD_B, entry.value)
      if (e.evm_put_storage(vm) !== 0)
        throw new Error('oracle: storage staging capacity exceeded')
    }

    // Context: origin at STAGE_ADDR, coinbase at STAGE_ADDR2, then gas price,
    // base fee, blob base fee, prevRandao, chain id, blob hashes, ancestors.
    putAddr(STAGE_ADDR, caller)
    putAddr(STAGE_ADDR2, block.coinbase ?? `0x${'00'.repeat(20)}`)
    putWord(64, gasPrice)
    putWord(96, block.baseFee ?? 0n)
    putWord(128, block.blobBaseFee ?? 1n)
    putWord(160, block.prevRandao ?? 0n)
    putWord(192, block.chainId ?? 1n)
    for (let i = 0; i < Math.min(blobHashes.length, 16); i++)
      putWord(224 + i * 32, blobHashes[i] as bigint)
    const hashCount = Math.min(chainHashes.length, 256)
    for (let i = 0; i < hashCount; i++)
      putWord(224 + 16 * 32 + i * 32, chainHashes[i] as bigint)
    e.evm_set_context(
      vm,
      block.number ?? 0n,
      block.timestamp ?? 0n,
      block.gasLimit ?? 30_000_000n,
      Math.min(blobHashes.length, 16),
      hashCount,
      specs[hardfork],
    )

    // Warm preamble, matching `Evm.run`.
    for (const warm of new Set([address, caller])) {
      putAddr(STAGE_ADDR, warm)
      e.evm_warm_account(vm)
    }

    // Execute the account's code.
    putAddr(STAGE_ADDR, address)
    putAddr(STAGE_ADDR2, caller)
    putWord(STAGE_WORD_A, value)
    mem().set(data, stage() + STAGE_BYTES)
    const status =
      statuses[e.evm_execute(vm, data.length, gas, static_ ? 1 : 0)] ??
      'invalid-opcode'

    const gasLeft = e.evm_gas_left(vm)
    const outputPtr = e.evm_output_ptr(vm)
    const output = mem().slice(outputPtr, outputPtr + e.evm_output_len(vm))

    const accountsOut = new Map<
      string,
      { balance: bigint; nonce: bigint; code: Uint8Array }
    >()
    for (let i = 0, n = e.evm_account_count(vm); i < n; i++) {
      const codeLength = e.evm_account_at(vm, i)
      if (codeLength < 0) continue
      accountsOut.set(getAddr(STAGE_ADDR), {
        balance: getWord(STAGE_WORD_A),
        code: mem().slice(
          stage() + STAGE_BYTES,
          stage() + STAGE_BYTES + codeLength,
        ),
        nonce: BigInt.asUintN(64, e.evm_account_nonce(vm, i)),
      })
    }
    const storageOut = new Map<string, Map<bigint, bigint>>()
    for (let i = 0, n = e.evm_storage_count(vm); i < n; i++) {
      if (e.evm_storage_at(vm, i) !== 1) continue
      const account = getAddr(STAGE_ADDR)
      let slots = storageOut.get(account)
      if (!slots) {
        slots = new Map()
        storageOut.set(account, slots)
      }
      slots.set(getWord(STAGE_WORD_A), getWord(STAGE_WORD_B))
    }
    const logs: ExecuteResult['logs'] = []
    for (let i = 0, n = e.evm_log_count(vm); i < n; i++) {
      const packed = e.evm_log_at(vm, i)
      if (packed < 0) continue
      const topicCount = packed >>> 24
      const dataLength = packed & 0xffffff
      const logAddress = getAddr(STAGE_ADDR)
      const base = stage() + STAGE_BYTES
      const topics: bigint[] = []
      for (let t = 0; t < topicCount; t++)
        topics.push(
          BigInt(
            `0x${Buffer.from(mem().slice(base + t * 32, base + (t + 1) * 32)).toString('hex')}`,
          ),
        )
      logs.push({
        address: logAddress,
        data: mem().slice(
          base + topicCount * 32,
          base + topicCount * 32 + dataLength,
        ),
        topics,
      })
    }

    return {
      accounts: accountsOut,
      gasUsed: gas - gasLeft,
      logs,
      output,
      refund: e.evm_refund(vm),
      status,
      statusClass:
        status === 'success' || status === 'reverted' ? status : 'exceptional',
      storage: storageOut,
    }
  } catch (error) {
    instantiate()
    throw error
  }
}
