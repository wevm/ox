// Runs the `ethereum/execution-spec-tests` state tests against the Ox EVM.
//
//   bun scripts/evm-conformance.ts <fixtures-dir> [--fork Prague] [--limit N]
//                                 [--filter substring] [--show N]
//
// State tests carry an explicit expected post-state, so conformance is an
// account-by-account comparison and needs no Merkle-Patricia trie.
//
// The transaction layer lives here rather than in the engine: intrinsic gas,
// nonce and balance checks, the refund cap, and the coinbase payment are not
// hot, and keeping them out of C keeps the engine to executing frames.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { wasmBase64 } from '../src/evm/internal/evm.wasm.js'

type Hex = `0x${string}`

const STAGE_ADDR = 0
const STAGE_ADDR2 = 20
const STAGE_WORD_A = 64
const STAGE_WORD_B = 96
const STAGE_BYTES = 128

const status = [
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

const engine = await (async () => {
  const { instance } = await WebAssembly.instantiate(
    Uint8Array.from(Buffer.from(wasmBase64, 'base64')),
  )
  return instance.exports as any
})()

const vm = engine.evm_new(0)
const mem = () => new Uint8Array(engine.memory.buffer)
const stage = () => engine.evm_stage_ptr(vm)

function bytes(hex: string | undefined): Uint8Array {
  if (!hex || hex === '0x') return new Uint8Array(0)
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const p = h.length % 2 ? `0${h}` : h
  const out = new Uint8Array(p.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(p.slice(i * 2, i * 2 + 2), 16)
  return out
}
const big = (hex: string | undefined): bigint =>
  !hex || hex === '0x' ? 0n : BigInt(hex)
const toHex = (b: Uint8Array): Hex => `0x${Buffer.from(b).toString('hex')}`

/** Writes a bigint as 32 big-endian bytes at `offset` in the staging buffer. */
function putWord(offset: number, value: bigint) {
  const buf = new Uint8Array(32)
  let v = value & ((1n << 256n) - 1n)
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(v & 0xffn)
    v >>= 8n
  }
  mem().set(buf, stage() + offset)
}
function putAddr(offset: number, addr: string) {
  const a = bytes(addr)
  const buf = new Uint8Array(20)
  buf.set(a.subarray(Math.max(0, a.length - 20)), 20 - Math.min(20, a.length))
  mem().set(buf, stage() + offset)
}
const getWord = (offset: number): bigint =>
  BigInt(
    `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 32)).toString('hex')}`,
  )
const getAddr = (offset: number): Hex =>
  `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 20)).toString('hex')}`

type Account = {
  nonce: string
  balance: string
  code: string
  storage: Record<string, string>
}

/** Forks that changed intrinsic-gas or refund rules the runner models. */
const forkOrder = [
  'Frontier',
  'Homestead',
  'Byzantium',
  'ConstantinopleFix',
  'Istanbul',
  'Berlin',
  'London',
  'Paris',
  'Shanghai',
  'Cancun',
  'Prague',
]
const forkAtLeast = (fork: string, min: string) =>
  forkOrder.indexOf(fork) >= forkOrder.indexOf(min)

/** EIP-2028/7623 intrinsic gas for the calldata and access list. */
function intrinsicGas(
  data: Uint8Array,
  isCreate: boolean,
  accessList: { address: string; storageKeys?: string[] }[] | undefined,
  fork: string,
) {
  let zero = 0
  for (const b of data) if (b === 0) zero++
  const nonZero = data.length - zero
  let gas = 21000n
  gas +=
    BigInt(zero) * 4n +
    BigInt(nonZero) * (forkAtLeast(fork, 'Istanbul') ? 16n : 68n)
  if (isCreate && forkAtLeast(fork, 'Homestead')) gas += 32000n
  if (isCreate && forkAtLeast(fork, 'Shanghai'))
    gas += 2n * BigInt(Math.ceil(data.length / 32)) // EIP-3860 initcode word cost
  for (const item of accessList ?? []) {
    gas += 2400n
    gas += BigInt(item.storageKeys?.length ?? 0) * 1900n
  }
  // EIP-7623: a transaction pays at least a per-token floor.
  let floor = 0n
  if (forkAtLeast(fork, 'Prague')) {
    const tokens = BigInt(zero) + BigInt(nonZero) * 4n
    floor = 21000n + tokens * 10n
  }
  return { gas, floor }
}

/** Highest precompile address defined at each fork. */
function precompileCount(fork: string) {
  if (forkAtLeast(fork, 'Prague')) return 0x11 // EIP-2537 BLS12-381
  if (forkAtLeast(fork, 'Cancun')) return 0x0a // EIP-4844 point evaluation
  if (forkAtLeast(fork, 'Istanbul')) return 0x09 // EIP-152 blake2f
  if (forkAtLeast(fork, 'Byzantium')) return 0x08 // bn254 + modexp
  return 0x04
}

function warmPreamble(sender: string, to: string | undefined, fork: string) {
  putAddr(STAGE_ADDR, sender)
  engine.evm_warm_account(vm)
  if (to) {
    putAddr(STAGE_ADDR, to)
    engine.evm_warm_account(vm)
  }
  for (let i = 1; i <= precompileCount(fork); i++) {
    putAddr(STAGE_ADDR, `0x${i.toString(16).padStart(40, '0')}`)
    engine.evm_warm_account(vm)
  }
}

type Outcome = { ok: true } | { ok: false; reason: string; detail?: string }

// Set per case so `compare` can express a balance mismatch in gas units.
let gasPriceForDetail = 0n
let lastRc = 0

function runCase(test: any, fork: string, post: any): Outcome {
  const tx = test.transaction
  const idx = post.indexes
  const data = bytes(tx.data[idx.data])
  const gasLimit = big(tx.gasLimit[idx.gas])
  const value = big(tx.value[idx.value])
  const isCreate = !tx.to || tx.to === '0x' || tx.to === ''

  const accessList = tx.accessLists?.[idx.data] ?? tx.accessList
  if (tx.authorizationList) return { ok: false, reason: 'eip7702-unsupported' }

  engine.evm_reset(vm)

  // Pre-state.
  for (const [addr, acct] of Object.entries(
    test.pre as Record<string, Account>,
  )) {
    const code = bytes(acct.code)
    putAddr(STAGE_ADDR, addr)
    putWord(STAGE_WORD_A, big(acct.balance))
    mem().set(code, stage() + STAGE_BYTES)
    const rc = engine.evm_put_account(vm, big(acct.nonce), code.length)
    if (rc !== 0) return { ok: false, reason: 'state-capacity' }
    for (const [k, v] of Object.entries(acct.storage ?? {})) {
      putAddr(STAGE_ADDR, addr)
      putWord(STAGE_WORD_A, big(k))
      putWord(STAGE_WORD_B, big(v))
      if (engine.evm_put_storage(vm) !== 0)
        return { ok: false, reason: 'state-capacity' }
    }
  }

  // Environment.
  const env = test.env
  const baseFee = big(env.currentBaseFee)
  putAddr(STAGE_ADDR, tx.sender)
  putAddr(STAGE_ADDR2, env.currentCoinbase)
  const maxFee = tx.maxFeePerGas ? big(tx.maxFeePerGas) : big(tx.gasPrice)
  const maxPriority = tx.maxPriorityFeePerGas
    ? big(tx.maxPriorityFeePerGas)
    : big(tx.gasPrice)
  // biome-ignore lint/style/noCommaOperator: assignment before use
  const effectiveGasPrice = tx.maxFeePerGas
    ? baseFee +
      (maxFee - baseFee < maxPriority ? maxFee - baseFee : maxPriority)
    : big(tx.gasPrice)
  gasPriceForDetail = effectiveGasPrice
  putWord(64, effectiveGasPrice)
  putWord(96, baseFee)
  putWord(128, big(env.currentExcessBlobGas ? '0x1' : '0x0'))
  putWord(160, big(env.currentRandom ?? env.currentDifficulty))
  putWord(192, big(test.config?.chainid ?? '0x01'))
  engine.evm_set_context(
    vm,
    big(env.currentNumber),
    big(env.currentTimestamp),
    big(env.currentGasLimit),
    0,
    0,
  )

  // EIP-2930 access list warms addresses and slots before execution.
  for (const item of accessList ?? []) {
    putAddr(STAGE_ADDR, item.address)
    engine.evm_warm_account(vm)
    for (const k of item.storageKeys ?? []) {
      putAddr(STAGE_ADDR, item.address)
      putWord(STAGE_WORD_A, big(k))
      engine.evm_warm_storage(vm)
    }
  }

  const { gas: intrinsic, floor } = intrinsicGas(
    data,
    isCreate,
    accessList,
    fork,
  )
  if (intrinsic > gasLimit)
    return { ok: false, reason: 'intrinsic-exceeds-limit' }

  // Sender pays upfront and its nonce advances before execution.
  const senderPre = (test.pre as Record<string, Account>)[
    tx.sender.toLowerCase()
  ]
  const senderBalance = big(senderPre?.balance)
  const upfront = gasLimit * effectiveGasPrice + value
  if (senderBalance < upfront)
    return { ok: false, reason: 'insufficient-funds' }

  // Only the gas is deducted here. For a call the runner moves the value
  // below; for a create `evm_execute_create` moves it, so deducting it here as
  // well would double-charge the sender.
  putAddr(STAGE_ADDR, tx.sender)
  putWord(
    STAGE_WORD_A,
    senderBalance - gasLimit * effectiveGasPrice - (isCreate ? 0n : value),
  )
  engine.evm_put_account(vm, big(senderPre?.nonce) + 1n, 0)

  const toAddr = isCreate ? '' : tx.to.toLowerCase()
  let rc: number
  if (isCreate) {
    // A create transaction runs the calldata as initcode; the engine derives
    // the address from the sender's pre-increment nonce.
    putAddr(STAGE_ADDR2, tx.sender)
    putWord(STAGE_WORD_A, value)
    mem().set(data, stage() + STAGE_BYTES)
    warmPreamble(tx.sender, undefined, fork)
    rc = engine.evm_execute_create(vm, data.length, gasLimit - intrinsic)
    // `evm_execute_create` moves the value inside its own snapshot, so a
    // failure has already rolled it back and the runner must not undo it again.
    return settleAndCompare(
      rc,
      gasLimit,
      intrinsic,
      floor,
      fork,
      tx,
      env,
      effectiveGasPrice,
      baseFee,
      post,
      0n,
      '',
    )
  }

  // Recipient receives the value. When the sender is also the recipient the
  // two writes target one account, so the credit has to build on the balance
  // the sender write just produced rather than on the pre-state.
  const toPre = (test.pre as Record<string, Account>)[toAddr]
  const toCode = bytes(toPre?.code)
  const senderAdjusted = senderBalance - gasLimit * effectiveGasPrice - value
  const toBase =
    toAddr === tx.sender.toLowerCase() ? senderAdjusted : big(toPre?.balance)
  putAddr(STAGE_ADDR, toAddr)
  putWord(STAGE_WORD_A, toBase + value)
  mem().set(toCode, stage() + STAGE_BYTES)
  engine.evm_put_account(
    vm,
    toAddr === tx.sender.toLowerCase()
      ? big(senderPre?.nonce) + 1n
      : big(toPre?.nonce),
    toCode.length,
  )

  // EIP-2929 seeds the accessed-address set with the sender, the target, and
  // every precompile. Missing the precompiles made each precompile call pay
  // the cold 2600 instead of the warm 100.
  warmPreamble(tx.sender, toAddr, fork)

  // Execute.
  putAddr(STAGE_ADDR, toAddr)
  putAddr(STAGE_ADDR2, tx.sender)
  putWord(STAGE_WORD_A, value)
  mem().set(data, stage() + STAGE_BYTES)
  const execGas = gasLimit - intrinsic
  rc = engine.evm_execute(vm, data.length, execGas, 0)
  return settleAndCompare(
    rc,
    gasLimit,
    intrinsic,
    floor,
    fork,
    tx,
    env,
    effectiveGasPrice,
    baseFee,
    post,
    value,
    toAddr,
  )
}

/** Applies the gas refund, repays the sender, pays the coinbase, compares. */
function settleAndCompare(
  rc: number,
  gasLimit: bigint,
  _intrinsic: bigint,
  floor: bigint,
  fork: string,
  tx: any,
  env: any,
  effectiveGasPrice: bigint,
  baseFee: bigint,
  post: any,
  value: bigint,
  toAddr: string,
): Outcome {
  lastRc = rc
  const gasLeft = engine.evm_gas_left(vm)
  const refundCounter = BigInt(engine.evm_refund(vm))

  let gasUsed = gasLimit - gasLeft
  if (rc === 0) {
    // EIP-3529 caps the refund at a fifth of the gas consumed. The counter can
    // be negative mid-transaction; a negative total refunds nothing.
    const counter = refundCounter > 0n ? refundCounter : 0n
    const cap = gasUsed / 5n
    gasUsed -= counter < cap ? counter : cap
  }
  if (forkAtLeast(fork, 'Prague') && gasUsed < floor) gasUsed = floor

  // Settle: sender is repaid the unused gas, coinbase collects the tip.
  const post_ = readState()
  const senderIdx = post_.findIndex(
    (a) => a.address === tx.sender.toLowerCase(),
  )
  const settle = new Map(post_.map((a) => [a.address, a]))
  const sender = settle.get(tx.sender.toLowerCase())
  // The runner performs the call-path value transfer outside the engine, as
  // part of loading state, so the engine's journal cannot roll it back. Undo it
  // here when the top-level frame did not succeed — REVERT included.
  if (rc !== 0 && value > 0n && toAddr) {
    const to = settle.get(toAddr as Hex)
    if (to) to.balance -= value
    if (sender) sender.balance += value
  }
  if (sender) sender.balance += (gasLimit - gasUsed) * effectiveGasPrice
  const cbAddr =
    `0x${bytes(env.currentCoinbase).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}` as Hex
  // The base fee is burned for every transaction type from London onward, so
  // the coinbase receives only the priority portion. Pre-London `baseFee` is
  // zero and this reduces to the full gas price.
  const tip = effectiveGasPrice - baseFee
  const cb = settle.get(cbAddr)
  if (cb) cb.balance += gasUsed * tip
  else if (gasUsed * tip > 0n)
    settle.set(cbAddr, {
      address: cbAddr,
      balance: gasUsed * tip,
      nonce: 0n,
      code: '0x',
    })
  void senderIdx

  return compare(settle, post.state, readStorage())
}

type Acct = { address: Hex; balance: bigint; nonce: bigint; code: Hex }

function readState(): Acct[] {
  const out: Acct[] = []
  const n = engine.evm_account_count(vm)
  for (let i = 0; i < n; i++) {
    const codeLen = engine.evm_account_at(vm, i)
    if (codeLen < 0) continue
    out.push({
      address: getAddr(STAGE_ADDR),
      balance: getWord(STAGE_WORD_A),
      nonce: BigInt(engine.evm_account_nonce(vm, i)),
      code: toHex(
        mem().slice(stage() + STAGE_BYTES, stage() + STAGE_BYTES + codeLen),
      ),
    })
  }
  return out
}

function readStorage(): Map<string, Map<bigint, bigint>> {
  const out = new Map<string, Map<bigint, bigint>>()
  const n = engine.evm_storage_count(vm)
  for (let i = 0; i < n; i++) {
    if (engine.evm_storage_at(vm, i) !== 1) continue
    const addr = getAddr(STAGE_ADDR)
    const key = getWord(STAGE_WORD_A)
    const value = getWord(STAGE_WORD_B)
    let m = out.get(addr)
    if (!m) out.set(addr, (m = new Map()))
    m.set(key, value)
  }
  return out
}

function compare(
  actual: Map<string, Acct>,
  expected: Record<string, Account>,
  storage: Map<string, Map<bigint, bigint>>,
): Outcome {
  for (const [rawAddr, want] of Object.entries(expected)) {
    const addr = rawAddr.toLowerCase() as Hex
    const got = actual.get(addr)
    if (!got) return { ok: false, reason: 'missing-account', detail: addr }
    if (got.balance !== big(want.balance))
      return {
        ok: false,
        reason: 'balance',
        detail: `${addr} rc=${status[lastRc] ?? lastRc} wei-delta ${got.balance - big(want.balance)}${
          gasPriceForDetail
            ? ` gas-delta ${(got.balance - big(want.balance)) / gasPriceForDetail}`
            : ''
        }`,
      }
    if (got.nonce !== big(want.nonce))
      return {
        ok: false,
        reason: 'nonce',
        detail: `${addr} got ${got.nonce} want ${big(want.nonce)}`,
      }
    if (got.code.toLowerCase() !== (want.code || '0x').toLowerCase())
      return { ok: false, reason: 'code', detail: addr }
    // Compare storage in both directions, keyed by numeric slot so that
    // `0x1` and `0x01` are the same slot.
    const slots = storage.get(addr) ?? new Map<bigint, bigint>()
    const wanted = new Map<bigint, bigint>()
    for (const [k, v] of Object.entries(want.storage ?? {}))
      if (big(v) !== 0n) wanted.set(big(k), big(v))
    for (const [k, v] of wanted) {
      const have = slots.get(k) ?? 0n
      if (have !== v)
        return {
          ok: false,
          reason: 'storage',
          detail: `${addr}[0x${k.toString(16)}] got ${have} want ${v}`,
        }
    }
    for (const [k, v] of slots)
      if (v !== 0n && !wanted.has(k))
        return {
          ok: false,
          reason: 'extra-storage',
          detail: `${addr}[0x${k.toString(16)}]=${v}`,
        }
  }
  return { ok: true }
}

// --- driver ---

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (entry.endsWith('.json')) yield p
  }
}

const args = process.argv.slice(2)
const root = args[0]
if (!root) {
  console.error('usage: evm-conformance.ts <fixtures/state_tests> [options]')
  process.exit(2)
}
const opt = (name: string) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args[i + 1]
}
const onlyFork = opt('--fork')
const limit = Number(opt('--limit') ?? Number.POSITIVE_INFINITY)
const filter = opt('--filter')
const show = Number(opt('--show') ?? 8)

let pass = 0
let fail = 0
// A histogram of gas deltas points straight at a wrong constant: one recurring
// value is one bug, however many tests it breaks.
const gasDeltas = new Map<string, number>()
const reasons = new Map<string, number>()
const samples = new Map<string, string>()

outer: for (const file of walk(root)) {
  if (filter && !file.includes(filter)) continue
  let doc: any
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    continue
  }
  for (const [name, test] of Object.entries<any>(doc)) {
    for (const [fork, posts] of Object.entries<any[]>(test.post ?? {})) {
      if (onlyFork && fork !== onlyFork) continue
      for (const post of posts) {
        let outcome: Outcome
        try {
          outcome = runCase(test, fork, post)
        } catch (error) {
          outcome = {
            ok: false,
            reason: `threw:${(error as Error).message.slice(0, 40)}`,
          }
        }
        if (outcome.ok) pass++
        else {
          fail++
          reasons.set(outcome.reason, (reasons.get(outcome.reason) ?? 0) + 1)
          if (outcome.reason === 'balance' && outcome.detail) {
            const m = /gas-delta (-?\d+)/.exec(outcome.detail)
            const w = /wei-delta (-?\d+)/.exec(outcome.detail)
            // When the gas matches, the discrepancy is a value transfer, so
            // bucket those by wei instead.
            const key =
              m && m[1] !== '0' ? `gas ${m[1]}` : `wei ${w?.[1] ?? '?'}`
            gasDeltas.set(key, (gasDeltas.get(key) ?? 0) + 1)
            if (!samples.has(key))
              samples.set(key, `${name.slice(0, 100)}\n      ${outcome.detail}`)
          }
          if (!samples.has(outcome.reason))
            samples.set(
              outcome.reason,
              `${name.slice(0, 110)}${outcome.detail ? `\n      ${outcome.detail}` : ''}`,
            )
        }
        if (pass + fail >= limit) break outer
      }
    }
  }
}

const total = pass + fail
console.log(
  `\n${pass}/${total} passed (${((pass / total) * 100).toFixed(2)}%)  ${onlyFork ?? 'all forks'}\n`,
)
if (gasDeltas.size) {
  console.log('most common gas deltas (balance failures):')
  for (const [delta, count] of [...gasDeltas]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12))
    console.log(
      `${String(count).padStart(7)}  ${delta}${
        samples.has(delta) ? `\n         ${samples.get(delta)}` : ''
      }`,
    )
  console.log()
}
const ranked = [...reasons].sort((a, b) => b[1] - a[1])
for (const [reason, count] of ranked.slice(0, show))
  console.log(
    `${String(count).padStart(7)}  ${reason}\n         e.g. ${samples.get(reason)}`,
  )
