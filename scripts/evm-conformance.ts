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
//
// Status: 40551/40553 (99.995%) across all forks. This is the same fixture set
// that Reth's `ef-tests` and evm2's `evm2-eest` run against.
//
// What is left is two cases, both `static_Call1MB1024Calldepth`, and both an
// engine limit rather than a semantic one: they pass a megabyte of calldata
// down every one of 1024 nested frames, so each frame's own memory is another
// megabyte and the whole thing wants about a gigabyte live at once. Frame
// memory comes out of a fixed arena, and wasm's address space would not hold
// it either. The engine reaches 47 frames.
//
// Blockchain tests are not run at all: they need block processing and a
// Merkle-Patricia trie for the state root, which state tests avoid by shipping
// an explicit post-state.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import * as Hash from '../src/core/Hash.js'
import * as Rlp from '../src/core/Rlp.js'
import * as Secp256k1 from '../src/core/Secp256k1.js'
import * as Opcode from '../src/evm/Opcode.js'
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

// `OX_WASM` points at a build other than the committed one — in practice the
// tracing build from `build-evm.ts --trace`, which `--trace-case` needs.
const binary = process.env.OX_WASM
  ? new Uint8Array(readFileSync(process.env.OX_WASM))
  : Uint8Array.from(Buffer.from(wasmBase64, 'base64'))
const module_ = new WebAssembly.Module(binary)

let engine: any
let vm: number

/**
 * Instantiates a fresh engine.
 *
 * Called again after any trap: a wasm trap leaves the shadow stack pointer
 * where it was, so a poisoned instance traps on every later call and one bad
 * case would be reported as tens of thousands.
 */
function instantiate() {
  engine = new WebAssembly.Instance(module_, {}).exports as any
  vm = engine.evm_new(0)
  // `evm_new` returns a null pointer when it cannot grow linear memory far
  // enough. Every later call would then write through it and trap, which looks
  // like an engine bug rather than the resource exhaustion it is.
  if (!vm) throw new Error('evm_new returned null: out of wasm memory')
}
instantiate()
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

/**
 * Every fork the engine numbers, in order.
 *
 * It must mirror `specIds` exactly. `forkAtLeast` is `indexOf >= indexOf`, so a
 * name missing from this list reads as -1 and makes *every* fork "at least" it
 * — which silently gave Byzantium the wrong block reward, because the list held
 * `ConstantinopleFix` and the comparison named `Constantinople`. Adding a fork
 * means adding it here as well.
 */
const forkOrder = [
  'Frontier',
  'Homestead',
  'Tangerine',
  'SpuriousDragon',
  'Byzantium',
  'Constantinople',
  'ConstantinopleFix',
  'Istanbul',
  'Berlin',
  'London',
  'Paris',
  'Shanghai',
  'Cancun',
  'Prague',
  'Osaka',
  // EIP-7892 blob-parameter-only forks. They change the blob schedule and
  // nothing else, so they are Osaka's rules with a different `blobSchedule`,
  // and the fixture supplies that. They have to sit after Osaka so
  // `forkAtLeast(fork, 'Osaka')` holds for them.
  'BPO1',
  'BPO2',
  'BPO3',
  'BPO4',
  'BPO5',
  // Reserved. Glamsterdam's execution-layer name; nothing keys off it yet.
  'Amsterdam',
]
const forkAtLeast = (fork: string, min: string) =>
  forkOrder.indexOf(fork) >= forkOrder.indexOf(min)

/**
 * The engine's `spec` id for a fork name.
 *
 * The engine numbers every fork that repriced something, including ones no
 * fixture targets directly (Tangerine, Spurious Dragon, Constantinople), so
 * these ids are not contiguous over `forkOrder`.
 */
const SPEC_LATEST = 14
const specIds: Record<string, number> = {
  Frontier: 0,
  Homestead: 1,
  Tangerine: 2,
  SpuriousDragon: 3,
  Byzantium: 4,
  Constantinople: 5,
  ConstantinopleFix: 6,
  Istanbul: 7,
  Berlin: 8,
  London: 9,
  Paris: 10,
  Shanghai: 11,
  Cancun: 12,
  Prague: 13,
  Osaka: 14,
  // A blob-parameter-only fork reprices nothing the engine charges, so they
  // all execute as Osaka.
  BPO1: 14,
  BPO2: 14,
  BPO3: 14,
  BPO4: 14,
  BPO5: 14,
  Amsterdam: 15,
}

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
/**
 * The precompile addresses EIP-2929 seeds the accessed set with.
 *
 * Contiguous from `0x01` until Osaka, where EIP-7951 put P256VERIFY at
 * `0x0100` and left a gap; hence a list rather than a count.
 */
function precompileAddresses(fork: string): number[] {
  const highest = forkAtLeast(fork, 'Prague')
    ? 0x11 // EIP-2537 BLS12-381
    : forkAtLeast(fork, 'Cancun')
      ? 0x0a // EIP-4844 point evaluation
      : forkAtLeast(fork, 'Istanbul')
        ? 0x09 // EIP-152 blake2f
        : forkAtLeast(fork, 'Byzantium')
          ? 0x08 // bn254 + modexp
          : 0x04
  const out: number[] = []
  for (let i = 1; i <= highest; i++) out.push(i)
  if (forkAtLeast(fork, 'Osaka')) out.push(0x0100)
  return out
}

const GAS_PER_BLOB = 131072n

/**
 * EIP-4844 `fake_exponential`: `factor * e ** (numerator / denominator)`
 * approximated with integer arithmetic.
 */
function fakeExponential(factor: bigint, numerator: bigint, denom: bigint) {
  let i = 1n
  let output = 0n
  let accum = factor * denom
  while (accum > 0n) {
    output += accum
    accum = (accum * numerator) / (denom * i)
    i += 1n
  }
  return output / denom
}

/** The blob base fee for a block's excess blob gas. */
function blobBaseFeeOf(excess: bigint, fork: string, schedule?: any) {
  // EIP-7691 raised the update fraction along with the target blob count, and
  // EIP-7840 moved it into the fixture's own schedule so a blob-parameter-only
  // fork can change it alone. The schedule wins where it exists.
  const fraction =
    schedule?.baseFeeUpdateFraction !== undefined
      ? big(schedule.baseFeeUpdateFraction)
      : forkAtLeast(fork, 'Prague')
        ? 5007716n
        : 3338477n
  return fakeExponential(1n, excess, fraction)
}

/**
 * `calc_excess_blob_gas`, EIP-4844 as amended by EIP-7918.
 *
 * The amendment stops the excess falling when a blob is already cheaper than
 * the execution gas it takes to carry one: below that floor the price signal is
 * meaningless, so the subtraction of the target is replaced by a proportional
 * decay. `BLOB_BASE_COST` is 2^13.
 */
function calcExcessBlobGas(
  parent: { excessBlobGas: bigint; blobGasUsed: bigint; baseFeePerGas: bigint },
  fork: string,
  schedule: any,
) {
  const target = big(schedule?.target) || (forkAtLeast(fork, 'Prague') ? 6n : 3n)
  const max = big(schedule?.max) || (forkAtLeast(fork, 'Prague') ? 9n : 6n)
  const targetGas = GAS_PER_BLOB * target
  if (parent.excessBlobGas + parent.blobGasUsed < targetGas) return 0n
  if (
    forkAtLeast(fork, 'Osaka') &&
    8192n * parent.baseFeePerGas >
      GAS_PER_BLOB * blobBaseFeeOf(parent.excessBlobGas, fork, schedule)
  )
    return parent.excessBlobGas + (parent.blobGasUsed * (max - target)) / max
  return parent.excessBlobGas + parent.blobGasUsed - targetGas
}

function warmPreamble(
  sender: string,
  to: string | undefined,
  fork: string,
  coinbase?: string,
) {
  putAddr(STAGE_ADDR, sender)
  engine.evm_warm_account(vm)
  if (to) {
    putAddr(STAGE_ADDR, to)
    engine.evm_warm_account(vm)
  }
  // EIP-3651 added the coinbase to the accessed set at Shanghai.
  if (coinbase && forkAtLeast(fork, 'Shanghai')) {
    putAddr(STAGE_ADDR, coinbase)
    engine.evm_warm_account(vm)
  }
  for (const i of precompileAddresses(fork)) {
    putAddr(STAGE_ADDR, `0x${i.toString(16).padStart(40, '0')}`)
    engine.evm_warm_account(vm)
  }
}

const SECP_N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** RLP takes minimal big-endian bytes, so a zero is the empty string. */
function minimal(v: bigint): Hex {
  if (v === 0n) return '0x'
  let h = v.toString(16)
  if (h.length % 2) h = `0${h}`
  return `0x${h}`
}

type Authorization = {
  chainId: string
  address: string
  nonce: string
  r: string
  s: string
  yParity?: string
  v?: string
}

/**
 * Recovers the authority of an EIP-7702 authorization tuple, or `undefined` if
 * the tuple is malformed.
 *
 * The signed payload is `keccak(0x05 || rlp([chain_id, address, nonce]))`.
 */
function authority(auth: Authorization, chainId: bigint): Hex | undefined {
  const r = big(auth.r)
  const sig = big(auth.s)
  const yParity = Number(big(auth.yParity ?? auth.v))
  if (r === 0n || sig === 0n || r >= SECP_N) return undefined
  // EIP-2 rejects the high half of the s range.
  if (sig > SECP_N / 2n) return undefined
  if (yParity !== 0 && yParity !== 1) return undefined
  const authChain = big(auth.chainId)
  if (authChain !== 0n && authChain !== chainId) return undefined
  // EIP-7702 step 2: a tuple whose nonce is at the u64 ceiling cannot be
  // applied, because applying it would have to increment past the cap. This is
  // checked before the authority is recovered, so such a tuple never reaches
  // step 4 and never warms anything.
  const nonce = big(auth.nonce)
  if (nonce >= (1n << 64n) - 1n) return undefined
  const encoded = Rlp.fromHex([
    minimal(authChain),
    auth.address as Hex,
    minimal(nonce),
  ])
  const payload = Hash.keccak256(`0x05${encoded.slice(2)}` as Hex)
  try {
    return Secp256k1.recoverAddress({
      payload,
      // `Signature` carries r and s as 32-byte hex, not as bigints.
      signature: {
        r: `0x${r.toString(16).padStart(64, '0')}`,
        s: `0x${sig.toString(16).padStart(64, '0')}`,
        yParity,
      },
    }).toLowerCase() as Hex
  } catch {
    return undefined
  }
}

type Outcome = { ok: true } | { ok: false; reason: string; detail?: string }

/** Compares the engine's current state against the expected post-state. */
// The ancestors BLOCKHASH can see, nearest first. A state test has none — its
// `env` describes one block with no history — so this is empty except under
// `--blockchain`, where the fixture supplies every header's hash.
let chainHashes: string[] = []

/**
 * Stages the ancestor hashes and returns how many. They go after the sixteen
 * blob-hash slots, which is where `evm_set_context` reads them from.
 */
function putChainHashes(): number {
  const n = Math.min(chainHashes.length, 256)
  for (let i = 0; i < n; i++) putWord(224 + 16 * 32 + i * 32, big(chainHashes[i]))
  return n
}

/**
 * Whether the last `runCase` refused the transaction instead of running it.
 *
 * A state test cannot tell the two apart — a rejected transaction's expected
 * post-state is the pre-state, which is also what a transaction that does
 * nothing produces — but a blockchain test can: a block containing an invalid
 * transaction is itself invalid and must not be applied.
 */
let lastRejected = false

function compareLoaded(post: any): Outcome {
  lastRc = 0
  lastRejected = true
  lastSettled = new Map(readState().map((a) => [a.address, a]))
  return compare(lastSettled, post.state, readStorage())
}

// The post-transaction accounts, gas settlement included. Settlement happens
// out here rather than in the engine — the transaction layer is the runner's
// job — so a blockchain test, which has to carry one transaction's result into
// the next, cannot just read the engine back.
let lastSettled: Map<string, Acct> | undefined

/**
 * Applies a set-code transaction's authorization list and returns the gas to
 * refund.
 *
 * Each tuple is validated independently; an invalid one is skipped but still
 * paid for. Authorities are warmed whether or not the tuple applies.
 */
function applyAuthorizations(
  authList: Authorization[],
  chainId: bigint,
  pre: Record<string, Account>,
): bigint {
  let refund = 0n
  // The refund is for an authority already in the trie. The runner writes the
  // transaction's recipient into the engine as part of moving value, which can
  // conjure an account that the trie does not have, so pre-state membership is
  // the authority on this rather than the engine's current view.
  const created = new Set<string>()
  for (const auth of authList) {
    const who = authority(auth, chainId)
    if (!who) continue
    putAddr(STAGE_ADDR, who)
    engine.evm_warm_account(vm)

    const current = readState().find((a) => a.address === who)
    const code = current ? bytes(current.code) : new Uint8Array(0)
    // Only an empty account or one already delegating may be re-delegated.
    const delegating =
      code.length === 23 &&
      code[0] === 0xef &&
      code[1] === 0x01 &&
      code[2] === 0x00
    if (code.length !== 0 && !delegating) continue
    const nonce = current?.nonce ?? 0n
    if (nonce !== big(auth.nonce)) continue
    // PER_EMPTY_ACCOUNT_COST - PER_AUTH_BASE_COST, for an account in the trie.
    if (pre[who] || created.has(who)) refund += 12500n
    created.add(who)

    const target = bytes(auth.address)
    // The zero address is the way to undelegate: it clears the code instead of
    // writing a designation.
    const designation =
      big(auth.address) === 0n
        ? new Uint8Array(0)
        : Uint8Array.from([0xef, 0x01, 0x00, ...target])
    putAddr(STAGE_ADDR, who)
    putWord(STAGE_WORD_A, current?.balance ?? 0n)
    mem().set(designation, stage() + STAGE_BYTES)
    engine.evm_put_account(vm, nonce + 1n, designation.length)
  }
  return refund
}

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
  const authList: Authorization[] = tx.authorizationList ?? []

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
  // EIP-4844. The data fee is burnt, so it leaves the sender's balance without
  // reaching the coinbase; `BLOBBASEFEE` and `BLOBHASH` read the same values.
  const blobHashes: string[] = tx.blobVersionedHashes ?? []
  const excessBlobGas = big(env.currentExcessBlobGas)
  // The schedule, not the fork constant: a blob-parameter-only fork changes the
  // update fraction and nothing else, so reading it from the fork name alone
  // prices every BPO block wrong.
  const blobBaseFee = forkAtLeast(fork, 'Cancun')
    ? blobBaseFeeOf(excessBlobGas, fork, test.config?.blobSchedule?.[fork])
    : 0n
  const blobFee = BigInt(blobHashes.length) * GAS_PER_BLOB * blobBaseFee
  putWord(128, blobBaseFee)
  putWord(160, big(env.currentRandom ?? env.currentDifficulty))
  putWord(192, big(test.config?.chainid ?? '0x01'))
  for (let i = 0; i < Math.min(blobHashes.length, 16); i++)
    putWord(224 + i * 32, big(blobHashes[i]))
  engine.evm_set_context(
    vm,
    big(env.currentNumber),
    big(env.currentTimestamp),
    big(env.currentGasLimit),
    Math.min(blobHashes.length, 16),
    putChainHashes(),
    specIds[fork] ?? SPEC_LATEST,
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
  // EIP-7702 charges PER_EMPTY_ACCOUNT_COST per authorization up front.
  const authGas = BigInt(authList.length) * 25000n
  // An invalid transaction is rejected outright: no nonce bump, no gas charged,
  // no execution. The expected post-state is simply the pre-state, which is
  // what the engine currently holds.
  // EIP-7623 makes the floor part of the validity requirement, not just the
  // settlement: a transaction whose limit cannot cover the larger of the two is
  // rejected before it runs. The authorization cost belongs *inside* that
  // comparison, as part of the intrinsic gas — adding it to the maximum
  // instead rejected set-code transactions whose limit sat between the two.
  const withAuth = intrinsic + authGas
  const required = withAuth > floor ? withAuth : floor
  if (required > gasLimit) return compareLoaded(post)
  // EIP-7825 caps a single transaction at 2^24 gas from Osaka, whatever the
  // block allows. It is a validity rule, so the transaction is rejected before
  // it runs rather than running out of gas.
  if (forkAtLeast(fork, 'Osaka') && gasLimit > 16_777_216n)
    return compareLoaded(post)
  // A set-code transaction must have at least one authorization and must not be
  // a create.
  if (tx.authorizationList && (authList.length === 0 || isCreate))
    return compareLoaded(post)

  // Sender pays upfront and its nonce advances before execution.
  const senderPre = (test.pre as Record<string, Account>)[
    tx.sender.toLowerCase()
  ]
  const senderBalance = big(senderPre?.balance)
  // EIP-3607: a transaction from an account with deployed code is invalid, so
  // that an address cannot be both a contract and an externally-owned account.
  // EIP-7702 carved out the delegation designator, which is code but is not a
  // contract — that is the whole point of a set-code transaction.
  if (forkAtLeast(fork, 'London')) {
    const senderCodeHex = (senderPre?.code ?? '0x').toLowerCase()
    const delegating =
      forkAtLeast(fork, 'Prague') && senderCodeHex.startsWith('0xef0100')
    if (senderCodeHex !== '0x' && senderCodeHex !== '' && !delegating)
      return compareLoaded(post)
  }
  // A blob transaction is invalid if it cannot pay the block's blob base fee.
  if (blobHashes.length && big(tx.maxFeePerBlobGas) < blobBaseFee)
    return compareLoaded(post)
  // Type-specific validity. A rejected transaction leaves the pre-state
  // untouched, which is what the engine currently holds.
  // `maxFeePerBlobGas` is what makes a transaction type 3, not the presence of
  // blobs: an empty blob list is exactly what one of these tests sends.
  if (tx.maxFeePerBlobGas !== undefined) {
    if (!forkAtLeast(fork, 'Cancun')) return compareLoaded(post)
    // EIP-7691 raised the per-block maximum from 6 to 9, and from Osaka the
    // number is not a fork constant at all: EIP-7892 lets a blob-parameter-only
    // fork move it without any other change, so the fixture's own schedule is
    // the authority and the constants are only a fallback.
    const scheduled = test.config?.blobSchedule?.[fork]?.max
    const maxBlobs =
      scheduled !== undefined
        ? Number(big(scheduled))
        : forkAtLeast(fork, 'Prague')
          ? 9
          : 6
    // EIP-7594 adds a per-*transaction* cap of six, below the per-block max, so
    // that one transaction cannot fill a block's whole blob capacity.
    const perTx = forkAtLeast(fork, 'Osaka') ? 6 : maxBlobs
    if (
      blobHashes.length === 0 ||
      blobHashes.length > maxBlobs ||
      blobHashes.length > perTx
    )
      return compareLoaded(post)
    // A blob transaction cannot be a create, and every hash must carry the
    // version byte.
    if (isCreate) return compareLoaded(post)
    for (const h of blobHashes)
      if (!h.startsWith('0x01')) return compareLoaded(post)
  }
  // EIP-1559: the fee cap has to cover the base fee. That applies to a legacy
  // transaction's `gasPrice` too — it is both caps at once, and one that
  // cannot pay the base fee is as invalid as a type-2 that cannot.
  if (forkAtLeast(fork, 'London') && maxFee < baseFee)
    return compareLoaded(post)
  // A tip above the fee cap is nonsense and rejected, rather than clamped.
  if (tx.maxPriorityFeePerGas !== undefined && maxPriority > maxFee)
    return compareLoaded(post)
  // EIP-2681 caps an account's nonce at 2^64 - 1, so a transaction at that
  // nonce could never be followed by another and is refused outright.
  if (big(tx.nonce) >= (1n << 64n) - 1n) return compareLoaded(post)
  // The nonce has to be exactly the account's. A state test always supplies a
  // matching one, so this never mattered until a block put two transactions
  // from the same sender in sequence.
  if (big(tx.nonce) !== big(senderPre?.nonce)) return compareLoaded(post)
  // A transaction cannot reserve more gas than the block has to give.
  if (gasLimit > big(env.currentGasLimit)) return compareLoaded(post)
  if (tx.authorizationList && !forkAtLeast(fork, 'Prague'))
    return compareLoaded(post)
  // A transaction type is invalid before the fork that introduced it: EIP-2930
  // brought the access list at Berlin, EIP-1559 the fee caps at London.
  if (accessList !== undefined && !forkAtLeast(fork, 'Berlin'))
    return compareLoaded(post)
  if (tx.maxFeePerGas !== undefined && !forkAtLeast(fork, 'London'))
    return compareLoaded(post)
  // EIP-3860 caps initcode at twice the deployed-code limit.
  if (isCreate && forkAtLeast(fork, 'Shanghai') && data.length > 49152)
    return compareLoaded(post)

  // Validity is judged against the caps the sender signed, not the effective
  // price: a transaction that cannot cover `gasLimit * maxFeePerGas` plus the
  // blob allowance is rejected before it runs.
  const maxBlobFee =
    BigInt(blobHashes.length) * GAS_PER_BLOB * big(tx.maxFeePerBlobGas)
  if (senderBalance < gasLimit * maxFee + value + maxBlobFee)
    return compareLoaded(post)

  // Only the gas is deducted here. For a call the runner moves the value
  // below; for a create `evm_execute_create` moves it, so deducting it here as
  // well would double-charge the sender.
  putAddr(STAGE_ADDR, tx.sender)
  putWord(
    STAGE_WORD_A,
    senderBalance -
      gasLimit * effectiveGasPrice -
      blobFee -
      (isCreate ? 0n : value),
  )
  const senderCode = bytes(senderPre?.code)
  mem().set(senderCode, stage() + STAGE_BYTES)
  engine.evm_put_account(vm, big(senderPre?.nonce) + 1n, senderCode.length)

  const toAddr = isCreate ? '' : tx.to.toLowerCase()
  let rc: number
  if (isCreate) {
    // A create transaction runs the calldata as initcode; the engine derives
    // the address from the sender's pre-increment nonce.
    putAddr(STAGE_ADDR2, tx.sender)
    putWord(STAGE_WORD_A, value)
    mem().set(data, stage() + STAGE_BYTES)
    warmPreamble(tx.sender, undefined, fork, env.currentCoinbase)
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
  const senderAdjusted =
    senderBalance - gasLimit * effectiveGasPrice - blobFee - value
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

  // Authorizations land before execution so the delegations they write are
  // visible to the first frame, and after the sender and recipient writes above
  // because those come from the pre-state and would otherwise clobber them.
  const authRefund = applyAuthorizations(
    authList,
    big(test.config?.chainid ?? '0x01'),
    test.pre as Record<string, Account>,
  )

  // EIP-2929 seeds the accessed-address set with the sender, the target, and
  // every precompile. Missing the precompiles made each precompile call pay
  // the cold 2600 instead of the warm 100.
  warmPreamble(tx.sender, toAddr, fork, env.currentCoinbase)

  // Execute.
  putAddr(STAGE_ADDR, toAddr)
  putAddr(STAGE_ADDR2, tx.sender)
  putWord(STAGE_WORD_A, value)
  mem().set(data, stage() + STAGE_BYTES)
  const execGas = gasLimit - intrinsic - authGas
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
    authRefund,
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
  extraRefund = 0n,
): Outcome {
  lastRc = rc
  lastRejected = false
  const gasLeft = engine.evm_gas_left(vm)
  const refundCounter = BigInt(engine.evm_refund(vm)) + extraRefund

  let gasUsed = gasLimit - gasLeft
  if (rc !== 0 && extraRefund > 0n) {
    // An authorization is processed before execution, so its refund stands even
    // when the top-level frame reverts.
    const cap = gasUsed / 5n
    gasUsed -= extraRefund < cap ? extraRefund : cap
  }
  if (rc === 0) {
    // EIP-3529 caps the refund at a fifth of the gas consumed. The counter can
    // be negative mid-transaction; a negative total refunds nothing.
    const counter = refundCounter > 0n ? refundCounter : 0n
    // EIP-3529 tightened the cap from a half to a fifth.
    const cap = forkAtLeast(fork, 'London') ? gasUsed / 5n : gasUsed / 2n
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
  // Paying the coinbase touches it, and before EIP-161 a touched account joins
  // the trie and stays there with nothing in it — even when the fee is zero,
  // which a zero-gas-price transaction makes it.
  else if (gasUsed * tip > 0n || !forkAtLeast(fork, 'SpuriousDragon'))
    settle.set(cbAddr, {
      address: cbAddr,
      balance: gasUsed * tip,
      nonce: 0n,
      code: '0x',
    })
  void senderIdx

  lastSettled = settle
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
      // The export returns i64, so a nonce past 2^63 comes back negative.
      nonce: BigInt.asUintN(64, BigInt(engine.evm_account_nonce(vm, i))),
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
  // `DIFF=1` reports every mismatching account rather than the first, which is
  // what tells a gas discrepancy (the sender pays) from a value one.
  if (process.env.DIFF)
    for (const [rawAddr, want] of Object.entries(expected)) {
      const addr = rawAddr.toLowerCase() as Hex
      const got = actual.get(addr)
      if (!got) console.log(`DIFF ${addr} missing`)
      else if (got.balance !== big(want.balance))
        console.log(
          `DIFF ${addr} balance got ${got.balance} want ${big(want.balance)} delta ${got.balance - big(want.balance)}`,
        )
      else if (got.nonce !== big(want.nonce))
        console.log(
          `DIFF ${addr} nonce got ${got.nonce} want ${big(want.nonce)}`,
        )
    }
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

// --- blockchain tests ---
//
// A blockchain fixture is a chain of blocks rather than one transaction, but
// every one of them carries an explicit `postState`, so none of this needs a
// Merkle Patricia trie: the state root in the header is never checked. What it
// does need is for one transaction's result to feed the next, and settlement
// happens out here in the runner, so the state is carried in `lastSettled`
// rather than read back out of the engine.
//
// Each transaction is run by handing `runCase` a state test synthesised from
// the running state and the block's header. That reloads the whole state per
// transaction, which is wasteful and is also why no other part of the runner
// had to change.

/** The running state, in the shape `runCase` wants for a fixture's `pre`. */
function preFromSettled(): Record<string, Account> {
  const storage = readStorage()
  const pre: Record<string, Account> = {}
  for (const a of lastSettled?.values() ?? []) {
    const slots: Record<string, string> = {}
    for (const [k, v] of storage.get(a.address) ?? [])
      if (v !== 0n) slots[`0x${k.toString(16)}`] = `0x${v.toString(16)}`
    pre[a.address] = {
      balance: `0x${a.balance.toString(16)}`,
      nonce: `0x${a.nonce.toString(16)}`,
      code: a.code,
      storage: slots,
    } as Account
  }
  return pre
}

/** The block reward paid to the coinbase, which the merge ended. */
function blockReward(fork: string): bigint {
  if (forkAtLeast(fork, 'Paris')) return 0n
  if (forkAtLeast(fork, 'Constantinople')) return 2_000_000_000_000_000_000n
  if (forkAtLeast(fork, 'Byzantium')) return 3_000_000_000_000_000_000n
  return 5_000_000_000_000_000_000n
}

function credit(pre: Record<string, Account>, addr: string, wei: bigint) {
  const key = addr.toLowerCase()
  const a = (pre[key] ??= {
    balance: '0x0',
    nonce: '0x0',
    code: '0x',
    storage: {},
  } as Account)
  a.balance = `0x${(big(a.balance) + wei).toString(16)}`
}

// The predeploys a block invokes outside any transaction. Each is an ordinary
// call from the system address with 30M gas, charged to nobody: no nonce bump
// and no gas accounting, which is why they cannot go through `runCase`.
const SYSTEM_ADDR = '0xfffffffffffffffffffffffffffffffffffffffe'
const BEACON_ROOTS = '0x000f3df6d732807ef1319fb7b8bb8522d0beac02'
const HISTORY_STORAGE = '0x0000f90827f1c53a10cb7a02335b175320002935'
const WITHDRAWAL_REQUESTS = '0x00000961ef480eb55e80d19ad83579a64c007002'
const CONSOLIDATION_REQUESTS = '0x0000bbddc7ce488642fb579f8b00f3a590007251'

/** Loads `pre` into the engine and sets the block context. */
function loadInto(
  pre: Record<string, Account>,
  env: any,
  fork: string,
  config: any,
): boolean {
  engine.evm_reset(vm)
  for (const [addr, acct] of Object.entries(pre)) {
    const code = bytes(acct.code)
    putAddr(STAGE_ADDR, addr)
    putWord(STAGE_WORD_A, big(acct.balance))
    mem().set(code, stage() + STAGE_BYTES)
    if (engine.evm_put_account(vm, big(acct.nonce), code.length) !== 0)
      return false
    for (const [k, v] of Object.entries(acct.storage ?? {})) {
      putAddr(STAGE_ADDR, addr)
      putWord(STAGE_WORD_A, big(k))
      putWord(STAGE_WORD_B, big(v))
      if (engine.evm_put_storage(vm) !== 0) return false
    }
  }
  putAddr(STAGE_ADDR, SYSTEM_ADDR)
  putAddr(STAGE_ADDR2, env.currentCoinbase)
  putWord(64, 0n)
  putWord(96, big(env.currentBaseFee))
  putWord(128, 0n)
  putWord(160, big(env.currentRandom ?? env.currentDifficulty))
  putWord(192, big(config?.chainid ?? '0x01'))
  engine.evm_set_context(
    vm,
    big(env.currentNumber),
    big(env.currentTimestamp),
    big(env.currentGasLimit),
    0,
    putChainHashes(),
    specIds[fork] ?? SPEC_LATEST,
  )
  return true
}

/** Reads the engine back into a `pre`, with no settlement to apply. */
function preFromEngine(): Record<string, Account> {
  lastSettled = new Map(readState().map((a) => [a.address, a]))
  return preFromSettled()
}

/**
 * One predeploy call, if the contract is deployed. Returns the state after.
 *
 * A call to an address with no code is a no-op that still touches the account,
 * so an absent predeploy is skipped rather than called into.
 */
function systemCall(
  pre: Record<string, Account>,
  env: any,
  fork: string,
  config: any,
  to: string,
  data: Uint8Array,
  requirePresent: boolean,
): { pre: Record<string, Account>; failed: boolean; output: Uint8Array } {
  const acct = pre[to]
  // Absence and failure are different. EIP-7002 and EIP-7251 require their
  // predeploy to exist — the chain is invalid without it. EIP-4788 and
  // EIP-2935 tolerate absence and skip the call, which is what lets a chain
  // deploy the history contract partway through and stay valid. A call that
  // *halts* is invalid either way.
  const none = new Uint8Array()
  if (!acct || !acct.code || acct.code === '0x')
    return { pre, failed: requirePresent, output: none }
  if (!loadInto(pre, env, fork, config))
    return { pre, failed: false, output: none }
  putAddr(STAGE_ADDR, to)
  putAddr(STAGE_ADDR2, SYSTEM_ADDR)
  putWord(STAGE_WORD_A, 0n)
  mem().set(data, stage() + STAGE_BYTES)
  const rc = engine.evm_execute(vm, data.length, 30_000_000n, 0)
  const at = engine.evm_output_ptr(vm)
  const output = mem().slice(at, at + engine.evm_output_len(vm))
  return { pre: preFromEngine(), failed: rc !== 0, output }
}

// --- Merkle Patricia trie ---
//
// Only enough of one to compute a root over a list keyed by its index, which is
// what the withdrawals, transactions and receipts roots all are. There is no
// storage, no lookup and no proof: a root is a pure function of the pairs, so
// the trie is built and hashed in one pass and thrown away.

/** keccak of the RLP of the empty string — the root of an empty trie. */
const EMPTY_ROOT =
  '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

/**
 * Hex-prefix encoding: the path, packed two nibbles to a byte, behind a flag
 * nibble carrying the node kind and the parity.
 *
 * The parity matters because a path of odd length cannot be packed without a
 * spare nibble, and the flag byte donates it.
 */
function hpEncode(nibbles: number[], leaf: boolean): Uint8Array {
  const odd = nibbles.length % 2 === 1
  const out = [((leaf ? 2 : 0) + (odd ? 1 : 0)) << 4]
  if (odd) out[0] |= nibbles[0] as number
  for (let i = odd ? 1 : 0; i < nibbles.length; i += 2)
    out.push(((nibbles[i] as number) << 4) | (nibbles[i + 1] as number))
  return Uint8Array.from(out)
}

type Node = Rlp.RecursiveArray<Uint8Array>

/**
 * How a parent refers to a child: inline when the child's encoding is under 32
 * bytes, by hash otherwise. This is the rule that makes the root depend on
 * node *sizes* and not only on the key set.
 */
function trieRef(node: Node): Node {
  const encoded = Rlp.fromBytes(node, { as: 'Bytes' })
  return encoded.length < 32 ? node : bytes(Hash.keccak256(toHex(encoded)))
}

function trieNode(pairs: { key: number[]; value: Uint8Array }[]): Node {
  if (pairs.length === 1) {
    const only = pairs[0] as { key: number[]; value: Uint8Array }
    return [hpEncode(only.key, true), only.value]
  }
  // The longest prefix every key shares becomes an extension node.
  const first = (pairs[0] as { key: number[] }).key
  let common = 0
  while (
    common < first.length &&
    pairs.every((p) => p.key.length > common && p.key[common] === first[common])
  )
    common++
  if (common > 0)
    return [
      hpEncode(first.slice(0, common), false),
      trieRef(trieNode(pairs.map((p) => ({ ...p, key: p.key.slice(common) })))),
    ]
  const branch: Node = Array.from({ length: 17 }, () => new Uint8Array())
  for (let nib = 0; nib < 16; nib++) {
    const below = pairs.filter((p) => p.key[0] === nib)
    if (below.length)
      branch[nib] = trieRef(
        trieNode(below.map((p) => ({ ...p, key: p.key.slice(1) }))),
      )
  }
  // A key that ends here rather than descending sits in the seventeenth slot.
  const here = pairs.find((p) => p.key.length === 0)
  if (here) branch[16] = here.value
  return branch
}

/** The root over `values`, keyed by `RLP(index)` as every list trie is. */
function listRoot(values: Uint8Array[]): Hex {
  if (values.length === 0) return EMPTY_ROOT
  const pairs = values.map((value, i) => {
    const key = Rlp.fromBytes(minimalBytes(BigInt(i)), { as: 'Bytes' })
    const nibbles: number[] = []
    for (const b of key) nibbles.push(b >> 4, b & 0xf)
    return { key: nibbles, value }
  })
  return Hash.keccak256(
    toHex(Rlp.fromBytes(trieNode(pairs), { as: 'Bytes' })),
  )
}

/** A scalar as the shortest big-endian byte string, which is how RLP wants it. */
function minimalBytes(v: bigint): Uint8Array {
  if (v === 0n) return new Uint8Array()
  let hex = v.toString(16)
  if (hex.length % 2) hex = `0${hex}`
  return bytes(`0x${hex}`)
}

// EIP-6110's deposit contract, and the canonical ABI layout of its event: five
// dynamic `bytes` fields, so five offsets followed by five length-prefixed
// padded bodies. The offsets and lengths are fixed by the field sizes, and a
// log that does not match them exactly is what INVALID_DEPOSIT_EVENT_LAYOUT
// means — the consensus layer parses this by position, not by decoding.
const DEPOSIT_CONTRACT = '0x00000000219ab540356cbb839cbe05303d7705fa'
// keccak of `DepositEvent(bytes,bytes,bytes,bytes,bytes)`. The contract emits
// other logs, and one of those is not a malformed deposit — it is not a
// deposit at all.
const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
const DEPOSIT_EVENT_LAYOUT = [
  { offset: 0xa0, length: 48 }, // pubkey
  { offset: 0x100, length: 32 }, // withdrawal credentials
  { offset: 0x140, length: 8 }, // amount
  { offset: 0x180, length: 96 }, // signature
  { offset: 0x200, length: 8 }, // index
]
const DEPOSIT_EVENT_SIZE = 576

/** Every log the last `runCase` produced. */
function readLogs(): { address: Hex; topics: Hex[]; data: Uint8Array }[] {
  const out: { address: Hex; topics: Hex[]; data: Uint8Array }[] = []
  for (let i = 0; i < engine.evm_log_count(vm); i++) {
    const packed = engine.evm_log_at(vm, i)
    if (packed < 0) continue
    const topicCount = packed >>> 24
    const dataLen = packed & 0xffffff
    const address = getAddr(STAGE_ADDR)
    const base = stage() + STAGE_BYTES
    const topics: Hex[] = []
    for (let t = 0; t < topicCount; t++)
      topics.push(toHex(mem().slice(base + t * 32, base + (t + 1) * 32)))
    const from = base + topicCount * 32
    out.push({ address, topics, data: mem().slice(from, from + dataLen) })
  }
  return out
}

/**
 * The 192-byte deposit request a log encodes, or null if its layout is wrong.
 *
 * The fields are concatenated unpadded, in declaration order, which is not
 * what the ABI encoding holds — hence reading each body out of its own slot
 * rather than decoding.
 */
function depositRequest(data: Uint8Array): Uint8Array | null {
  if (data.length !== DEPOSIT_EVENT_SIZE) return null
  const word = (at: number) => {
    let v = 0n
    for (let i = 0; i < 32; i++) v = (v << 8n) | BigInt(data[at + i] as number)
    return v
  }
  const parts: Uint8Array[] = []
  for (const { offset, length } of DEPOSIT_EVENT_LAYOUT) {
    if (word(parts.length * 32) !== BigInt(offset)) return null
    if (word(offset) !== BigInt(length)) return null
    parts.push(data.slice(offset + 32, offset + 32 + length))
  }
  const out = new Uint8Array(192)
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/**
 * EIP-7685: `sha256` over the `sha256` of each non-empty `type || data`.
 *
 * The three lists are deposits scraped from the block's logs, and the raw
 * output of the EIP-7002 and EIP-7251 predeploy calls.
 */
function requestsHashOf(lists: (Uint8Array | null)[]): Hex {
  const digests: number[] = []
  for (let type = 0; type < lists.length; type++) {
    const body = lists[type]
    if (!body || body.length === 0) continue
    const framed = new Uint8Array(1 + body.length)
    framed[0] = type
    framed.set(body, 1)
    digests.push(...bytes(Hash.sha256(toHex(framed))))
  }
  return Hash.sha256(toHex(Uint8Array.from(digests)))
}

/**
 * Header checks that need only the header and its parent.
 *
 * Everything here is arithmetic on fields the fixture already decodes, so none
 * of it needs a trie. What is deliberately *not* here is anything rooted in
 * one: the withdrawals root, the receipts root and the EIP-7685 requests hash.
 *
 * Over-rejection is the danger — a rule slightly too strict quietly discards
 * valid blocks — so the caller treats a rejection of a block with no
 * `expectException` as a failure rather than letting it pass silently.
 */
function headerInvalid(
  h: any,
  parent: any,
  fork: string,
  b: any,
  transition: boolean,
): boolean {
  const gasLimit = big(h.gasLimit)
  // The floor and the 1/1024 band, unchanged since Frontier.
  if (gasLimit < 5000n) return true
  if (big(h.gasUsed) > gasLimit) return true
  if (parent && !transition) {
    const pl = parent.gasLimit
    const diff = gasLimit > pl ? gasLimit - pl : pl - gasLimit
    if (diff >= pl / 1024n) return true
  }
  // EIP-7934 caps the encoded block from Osaka at `MAX_BLOCK_SIZE` less a
  // `SAFETY_MARGIN` — 10 MiB less 2 MiB, so 8 MiB, not the 10 the headline
  // number suggests.
  if (forkAtLeast(fork, 'Osaka') && b.rlp && (b.rlp.length - 2) / 2 > 8_388_608)
    return true
  // Every fork that added a header field made it mandatory from that block and
  // forbidden before it, so presence is as much a consensus rule as value —
  // which is what INCORRECT_BLOCK_FORMAT means. `parentBeaconBlockRoot` is
  // excluded: the fixtures omit it on blocks they still expect to be valid.
  for (const [field, since] of [
    ['baseFeePerGas', 'London'],
    ['withdrawalsRoot', 'Shanghai'],
    ['blobGasUsed', 'Cancun'],
    ['excessBlobGas', 'Cancun'],
    ['requestsHash', 'Prague'],
  ] as const)
    if ((h[field] !== undefined) !== forkAtLeast(fork, since)) return true

  // EIP-4895's withdrawals root. A withdrawal is `RLP([index, validatorIndex,
  // address, amount])` and the trie is keyed by position, so this needs only
  // the list the fixture already gives.
  if (h.withdrawalsRoot !== undefined) {
    const encoded = ((b.withdrawals ?? b.rlp_decoded?.withdrawals ?? []) as any[]).map(
      (w) =>
        Rlp.fromBytes(
          [
            minimalBytes(big(w.index)),
            minimalBytes(big(w.validatorIndex)),
            bytes(w.address),
            minimalBytes(big(w.amount)),
          ],
          { as: 'Bytes' },
        ),
    )
    if (listRoot(encoded) !== h.withdrawalsRoot.toLowerCase()) return true
  }

  // Not checked: the block hash. It is `keccak(RLP(header))`, and the fixture
  // supplies `RLP(block)` — decoding and re-encoding the header would repair
  // exactly the corruption the INVALID_BLOCK_HASH cases are testing for, so it
  // needs either a header encoder or a byte-range extraction, for twelve
  // tests.
  return false
}

/**
 * Runs one blockchain fixture and compares its `postState`.
 *
 * Blocks carrying `expectException` are the invalid-block corpus: rejecting
 * them means validating the header, which means the state root, which means a
 * trie. They are reported as skipped rather than failed.
 */
function runBlockchainTest(t: any): Outcome {
  // A transition network names two forks and the timestamp the second takes
  // effect at, so the fork is a property of the block rather than the test.
  const transition = /^(\w+)To(\w+)AtTime(\d+)k$/.exec(t.network)
  const forkAt = (timestamp: bigint): string =>
    transition
      ? timestamp >= BigInt(transition[3]) * 1000n
        ? transition[2]
        : transition[1]
      : t.network
  let fork: string = forkAt(0n)
  if (specIds[fork] === undefined) return { ok: false, reason: `fork:${fork}` }
  let pre: Record<string, Account> = t.pre
  // Nearest ancestor first, starting from the genesis header the fixture
  // carries; BLOCKHASH indexes back from the current block.
  chainHashes = t.genesisBlockHeader?.hash ? [t.genesisBlockHeader.hash] : []
  const headerOf = (x: any) =>
    x
      ? {
          excessBlobGas: big(x.excessBlobGas),
          blobGasUsed: big(x.blobGasUsed),
          baseFeePerGas: big(x.baseFeePerGas),
          gasLimit: big(x.gasLimit),
        }
      : undefined
  // The excess is defined against the previous block, so the genesis header
  // seeds it.
  let parent = headerOf(t.genesisBlockHeader)
  for (const b of t.blocks ?? []) {
    // A block the chain must reject. Where the reason is a transaction, the
    // runner already decides that — it is the same set of validity rules a
    // state test exercises — so the block can be run and the verdict read off
    // `lastRejected`. A `BlockException` is a property of the header, which
    // means the state root, which means a trie; those are still skipped.
    const expected: string = b.expectException ?? ''
    const h = b.blockHeader ?? b.rlp_decoded?.blockHeader
    // An RLP-only block is one whose encoding is itself what is wrong, so
    // there is nothing decoded to check.
    if (!h) return { ok: false, reason: 'skip:undecodable-block' }
    fork = forkAt(big(h.timestamp))
    if (specIds[fork] === undefined) return { ok: false, reason: `fork:${fork}` }
    const env = {
      currentCoinbase: h.coinbase,
      currentNumber: h.number,
      currentTimestamp: h.timestamp,
      currentGasLimit: h.gasLimit,
      currentBaseFee: h.baseFeePerGas ?? '0x0',
      // Only from the merge. A pre-merge header still has a `mixHash`, and
      // passing it as the random would shadow `difficulty`, which is what
      // opcode 0x44 still means before Paris.
      currentRandom: forkAtLeast(fork, 'Paris') ? h.mixHash : undefined,
      currentDifficulty: h.difficulty,
      currentExcessBlobGas: h.excessBlobGas ?? '0x0',
    }
    // An invalid block leaves the chain where it was, so everything it does is
    // discarded — the predeploy calls below included, which is why the
    // snapshot is taken before them and not just before the transactions.
    const before = pre
    // Declared before the predeploy calls below, which report into it.
    let rejected = false
    // EIP-4788 and EIP-2935 run before the block's transactions.
    const sys = (to: string, data: Uint8Array, required: boolean) => {
      const r = systemCall(pre, env, fork, t.config, to, data, required)
      pre = r.pre
      if (r.failed) rejected = true
      return r.output
    }
    // Deposits are scraped from the block's logs as its transactions run.
    const deposits: number[] = []
    let badDepositLog = false
    if (forkAtLeast(fork, 'Cancun') && h.parentBeaconBlockRoot !== undefined)
      sys(BEACON_ROOTS, bytes(h.parentBeaconBlockRoot), false)
    if (forkAtLeast(fork, 'Prague'))
      sys(HISTORY_STORAGE, bytes(h.parentHash), false)
    // The blob limit is per *block* as well as per transaction, and no single
    // transaction can see the total, so it is summed here. A block over the
    // schedule's maximum is invalid however valid each transaction is on its
    // own.
    const txs = b.transactions ?? b.rlp_decoded?.transactions ?? []
    const blobTotal = txs.reduce(
      (n: number, tx: any) => n + (tx.blobVersionedHashes?.length ?? 0),
      0,
    )
    const scheduledMax = t.config?.blobSchedule?.[fork]?.max
    const blockMaxBlobs =
      scheduledMax !== undefined
        ? Number(big(scheduledMax))
        : forkAtLeast(fork, 'Prague')
          ? 9
          : 6
    if (blobTotal > blockMaxBlobs) rejected = true
    // A transaction is only includable while the gas already committed plus its
    // own limit still fits the block, so the sum of the limits is the binding
    // constraint — and no single transaction can see it. EIP-7825's 2^24 cap
    // makes this reachable with a handful of transactions.
    const gasCommitted = txs.reduce(
      (n: bigint, tx: any) => n + big(tx.gasLimit),
      0n,
    )
    if (gasCommitted > big(h.gasLimit)) rejected = true
    // A transition block's gas limit is allowed to jump — London doubled it —
    // so the 1/1024 band is not applied across one.
    if (headerInvalid(h, parent, fork, b, transition !== null)) rejected = true

    // The blob fields of the header are a pure function of the block's blobs
    // and its parent, so they can be checked without any of the rest of the
    // header. That is 729 of the invalid-block corpus, and validating them is
    // also the only place EIP-7918 is observable — the excess is computed from
    // the parent, never by the engine.
    if (forkAtLeast(fork, 'Cancun') && h.blobGasUsed !== undefined) {
      const schedule = t.config?.blobSchedule?.[fork]
      const usedWant = GAS_PER_BLOB * BigInt(blobTotal)
      if (big(h.blobGasUsed) !== usedWant) rejected = true
      if (usedWant > GAS_PER_BLOB * BigInt(blockMaxBlobs)) rejected = true
      if (parent && h.excessBlobGas !== undefined) {
        const want = calcExcessBlobGas(parent, fork, schedule)
        if (big(h.excessBlobGas) !== want) rejected = true
      }
    }
    for (const tx of rejected ? [] : txs) {
      const synthetic = {
        pre,
        env,
        config: t.config,
        transaction: {
          ...tx,
          data: [tx.data],
          gasLimit: [tx.gasLimit],
          value: [tx.value],
        },
      }
      const out = runCase(synthetic, fork, {
        indexes: { data: 0, gas: 0, value: 0 },
        state: {},
      })
      if (!out.ok && !expected) return out
      rejected = rejected || lastRejected
      if (forkAtLeast(fork, 'Prague') && !lastRejected)
        for (const log of readLogs()) {
          if (log.address !== DEPOSIT_CONTRACT) continue
          if (log.topics[0] !== DEPOSIT_EVENT_TOPIC) continue
          const req = depositRequest(log.data)
          if (!req) badDepositLog = true
          else deposits.push(...req)
        }
      pre = preFromSettled()
    }
    // EIP-7002 and EIP-7251 dequeue their request lists after the
    // transactions, and their output is two thirds of the requests hash. This
    // has to run before the verdict below: for an invalid block the hash is
    // often the very thing that is wrong.
    if (forkAtLeast(fork, 'Prague')) {
      const withdrawals = sys(WITHDRAWAL_REQUESTS, new Uint8Array(), true)
      const consolidations = sys(CONSOLIDATION_REQUESTS, new Uint8Array(), true)
      if (badDepositLog) rejected = true
      else if (h.requestsHash !== undefined) {
        const want = requestsHashOf([
          Uint8Array.from(deposits),
          withdrawals,
          consolidations,
        ])
        if (want !== h.requestsHash.toLowerCase()) rejected = true
      }
    }
    if (!expected && rejected)
      return { ok: false, reason: 'rejected-valid-block' }
    if (expected) {
      // `continue` skips the parent update below too: a rejected block is
      // never the parent of the next one.
      pre = before
      if (!rejected)
        return {
          ok: false,
          reason: 'accepted-invalid-block',
          detail: expected,
        }
      continue
    }
    // Withdrawals are denominated in gwei, unlike everything else here.
    for (const w of b.withdrawals ?? [])
      credit(pre, w.address, big(w.amount) * 1_000_000_000n)
    const reward = blockReward(fork)
    if (reward > 0n) credit(pre, h.coinbase, reward)
    if (h.hash) chainHashes.unshift(h.hash)
    parent = headerOf(h)
  }
  // Load the final state back so `compare` reads it from the engine, which is
  // the only path that also produces storage.
  chainHashes = []
  const out = runCase(
    {
      pre,
      env: {
        currentCoinbase: '0x0000000000000000000000000000000000000000',
        currentNumber: '0x1',
        currentTimestamp: '0x1',
        currentGasLimit: '0x1',
        currentBaseFee: '0x0',
      },
      config: t.config,
      // A transaction that cannot pay its intrinsic gas is rejected before it
      // runs, which loads the state and compares without touching it.
      transaction: {
        sender: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        gasPrice: '0x0',
        nonce: '0x0',
        data: ['0x'],
        gasLimit: ['0x0'],
        value: ['0x0'],
      },
    },
    fork,
    { indexes: { data: 0, gas: 0, value: 0 }, state: t.postState },
  )
  return out
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
// `--trace-case <substring>` dumps a per-instruction trace for the first case
// whose name matches, then exits. Needs the tracing build:
//
//   node --import tsx scripts/build-evm.ts --trace /tmp/evm.trace.wasm
//   OX_WASM=/tmp/evm.trace.wasm node --import tsx scripts/evm-conformance.ts \
//     <fixtures> --trace-case <substring>
const blockchain = args.includes('--blockchain')
const traceCase = opt('--trace-case')
if (traceCase && !engine.evm_trace_ptr)
  throw new Error('--trace-case needs OX_WASM pointing at a --trace build')

function dumpTrace() {
  const total = engine.evm_trace_count(vm)
  const CAP = 1 << 18
  // The buffer is a ring, so a long program leaves only its tail. `--trace-tail
  // N` narrows that further; the default is the whole ring.
  const tail = Number(opt('--trace-tail') ?? CAP)
  const first = Math.max(0, total - Math.min(tail, CAP))
  const n = total - first
  const base = engine.evm_trace_ptr(vm)
  const view = new DataView(engine.memory.buffer)
  console.log(
    `\n${total} steps, showing the last ${n}  (pc, op, gas before, cost, depth, stack height)`,
  )
  let prev: { gas: bigint; depth: number } | undefined
  for (let i = 0; i < n; i++) {
    const o = base + ((first + i) & (CAP - 1)) * 24
    const pc = view.getInt32(o, true)
    const op = view.getInt32(o + 4, true)
    const gas = view.getBigInt64(o + 8, true)
    const depth = view.getInt32(o + 16, true)
    const sp = view.getInt32(o + 20, true)
    // The cost of the *previous* instruction, which is the interesting column;
    // it is only meaningful within one frame.
    const cost =
      prev && prev.depth === depth
        ? String(prev.gas - gas).padStart(8)
        : '        '
    if (i > 0) process.stdout.write(`${cost}\n`)
    process.stdout.write(
      `${String(first + i).padStart(8)}  d${depth} pc=${String(pc).padStart(5)} ` +
        `${Opcode.toName(op) ?? `0x${op.toString(16)}`}`.padEnd(22) +
        `gas=${String(gas).padStart(12)} sp=${String(sp).padStart(3)}`,
    )
    prev = { gas, depth }
  }
  process.stdout.write('\n')
}

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
    // `--blockchain` switches to the chain fixtures, whose shape is a list of
    // blocks and one `postState` rather than a `post` keyed by fork.
    if (blockchain) {
      let outcome: Outcome
      try {
        outcome = runBlockchainTest(test)
      } catch (error) {
        outcome = {
          ok: false,
          reason: `threw:${(error as Error).message.slice(0, 40)}`,
        }
        instantiate()
      }
      if (process.env.CASES)
        console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
      if (outcome.ok) pass++
      else {
        fail++
        reasons.set(outcome.reason, (reasons.get(outcome.reason) ?? 0) + 1)
        if (!samples.has(outcome.reason))
          samples.set(
            outcome.reason,
            `${name.slice(0, 110)}${outcome.detail ? `\n      ${outcome.detail}` : ''}`,
          )
      }
      if (pass + fail >= limit) break outer
      continue
    }
    for (const [fork, posts] of Object.entries<any[]>(test.post ?? {})) {
      if (onlyFork && fork !== onlyFork) continue
      for (const post of posts) {
        let outcome: Outcome
        if (traceCase) engine.evm_trace_reset?.(vm)
        try {
          outcome = runCase(test, fork, post)
        } catch (error) {
          outcome = {
            ok: false,
            reason: `threw:${(error as Error).message.slice(0, 40)}`,
          }
          instantiate()
        }
        if (process.env.CASES)
          console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
        if (traceCase && name.includes(traceCase)) {
          console.log(
            `${name}\n  ${outcome.ok ? 'PASS' : `FAIL ${outcome.reason} ${outcome.detail ?? ''}`}`,
          )
          dumpTrace()
          process.exit(0)
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
