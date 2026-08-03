// Engine-agnostic core of the `ethereum/execution-spec-tests` state-test
// runner: fixture types, the transaction layer (intrinsic gas, the validity
// ladder, EIP-7702 authorization application, the refund cap, coinbase
// settlement), and the account-by-account post-state comparison.
//
// Execution goes through an {@link Adapter} — the ~13 engine touchpoints as
// one interface — with two implementations:
//
// - `wasm()`: the conformance-validated C→WASM engine (63554/63556 state
//   tests on the pinned corpus), staged through its fixed stage-buffer ABI.
// - `ts()`: the pure-TypeScript interpreter + journal from `ox/evm`
//   internals. Single-frame only until the call family lands, so cases that
//   reach `CALL`/`CREATE`-in-frame halt with `invalid-opcode` and fail — an
//   expected gap the runner reports rather than hides.
//
// The transaction layer stays out here so consensus-critical fee logic has
// one implementation whichever engine executes frames.
//
// Fixtures: `ethereum/execution-spec-tests` release v5.4.0
// (`fixtures_develop.tar.gz`), the corpus the WASM engine was validated
// against. Download into the gitignored fixtures directory with:
//
//   mkdir -p test/evm/fixtures && curl -sL \
//     https://github.com/ethereum/execution-spec-tests/releases/download/v5.4.0/fixtures_develop.tar.gz \
//     | tar -xz -C test/evm/fixtures --strip-components=1 fixtures/state_tests
//
// State tests carry an explicit expected post-state, so conformance is an
// account-by-account comparison and needs no Merkle-Patricia trie.

import { readFileSync } from 'node:fs'

import type * as Address from '../../src/core/Address.js'
import * as ContractAddress from '../../src/core/ContractAddress.js'
import * as Hash from '../../src/core/Hash.js'
import * as Rlp from '../../src/core/Rlp.js'
import * as Secp256k1 from '../../src/core/Secp256k1.js'
import type * as Hardfork from '../../src/evm/Hardfork.js'
import { analyzed } from '../../src/evm/internal/analysis.js'
import { table } from '../../src/evm/internal/instructions.js'
import { execute as interpret } from '../../src/evm/internal/interpreter.js'
import * as journal_ from '../../src/evm/internal/journal.js'
import {
  addressToWord,
  createFrame,
  type Frame,
  type Machine,
} from '../../src/evm/internal/machine.js'
import { wasmBase64 } from './engine.wasm.js'

type Hex = `0x${string}`

export function bytes(hex: string | undefined): Uint8Array {
  if (!hex || hex === '0x') return new Uint8Array(0)
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const p = h.length % 2 ? `0${h}` : h
  const out = new Uint8Array(p.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(p.slice(i * 2, i * 2 + 2), 16)
  return out
}

export const big = (hex: string | undefined): bigint =>
  !hex || hex === '0x' ? 0n : BigInt(hex)

export const toHex = (b: Uint8Array): Hex =>
  `0x${Buffer.from(b).toString('hex')}`

// Fixture shapes, as `ethereum/execution-spec-tests` state-test JSON carries
// them. Scalars are hex strings throughout.

export type FixtureAccount = {
  balance: string
  code: string
  nonce: string
  storage?: Record<string, string> | undefined
}

export type FixtureAccessItem = {
  address: string
  storageKeys?: readonly string[] | undefined
}

export type FixtureAuthorization = {
  address: string
  chainId: string
  nonce: string
  r: string
  s: string
  v?: string | undefined
  yParity?: string | undefined
}

export type FixtureEnv = {
  currentBaseFee?: string | undefined
  currentCoinbase: string
  currentDifficulty?: string | undefined
  currentExcessBlobGas?: string | undefined
  currentGasLimit: string
  currentNumber: string
  currentRandom?: string | undefined
  currentTimestamp: string
}

export type FixtureTransaction = {
  accessList?: readonly FixtureAccessItem[] | undefined
  accessLists?:
    | readonly (readonly FixtureAccessItem[] | undefined)[]
    | undefined
  authorizationList?: readonly FixtureAuthorization[] | undefined
  blobVersionedHashes?: readonly string[] | undefined
  data: readonly string[]
  gasLimit: readonly string[]
  gasPrice?: string | undefined
  maxFeePerBlobGas?: string | undefined
  maxFeePerGas?: string | undefined
  maxPriorityFeePerGas?: string | undefined
  nonce: string
  sender: string
  to?: string | undefined
  value: readonly string[]
}

export type FixtureBlobSchedule = {
  baseFeeUpdateFraction?: string | undefined
  max?: string | undefined
  target?: string | undefined
}

export type FixtureConfig = {
  blobSchedule?: Record<string, FixtureBlobSchedule | undefined> | undefined
  chainid?: string | undefined
}

export type FixtureCase = {
  config?: FixtureConfig | undefined
  env: FixtureEnv
  post?: Record<string, readonly FixturePost[]> | undefined
  pre: Record<string, FixtureAccount>
  transaction: FixtureTransaction
}

export type FixturePost = {
  indexes: { data: number; gas: number; value: number }
  state?: Record<string, FixtureAccount> | undefined
}

/**
 * Every fork the engine numbers, in order.
 *
 * It must mirror `specIds` exactly. `forkAtLeast` is `indexOf >= indexOf`, so
 * a name missing from this list reads as -1 and makes *every* fork "at least"
 * it. Adding a fork means adding it here as well.
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

export const forkAtLeast = (fork: string, min: string): boolean =>
  forkOrder.indexOf(fork) >= forkOrder.indexOf(min)

/**
 * The WASM engine's `spec` id for a fork name.
 *
 * The engine numbers every fork that repriced something, including ones no
 * fixture targets directly (Tangerine, Spurious Dragon, Constantinople), so
 * these ids are not contiguous over `forkOrder`.
 */
const specLatest = 14
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

// The engine adapter seam.

/** How a frame ended. The engines classify some exceptional conditions
 * differently (`code-too-large` vs `code-size-exceeded`); only the
 * success/reverted/exceptional split is consensus-meaningful, the names are
 * diagnostics. */
export type Status =
  | 'success'
  | 'reverted'
  | 'call-depth-exceeded'
  | 'code-size-exceeded'
  | 'code-too-large'
  | 'create-collision'
  | 'initcode-size-exceeded'
  | 'input-too-large'
  | 'invalid-code'
  | 'invalid-jump'
  | 'invalid-opcode'
  | 'memory-limit'
  | 'nonce-overflow'
  | 'out-of-gas'
  | 'out-of-memory'
  | 'stack-overflow'
  | 'stack-underflow'
  | 'static-violation'

/** Execution context for one transaction: block environment plus the
 * transaction-derived values opcodes read. */
export type Context = {
  baseFee: bigint
  blobBaseFee: bigint
  blobHashes: readonly bigint[]
  /** Ancestor hashes `BLOCKHASH` can see, nearest first (`chainHashes[0]` is
   * block `number - 1`). A state test has none. */
  chainHashes: readonly bigint[]
  chainId: bigint
  coinbase: string
  /** Fixture fork name (`Cancun`, `Prague`, …). */
  fork: string
  gasLimit: bigint
  gasPrice: bigint
  number: bigint
  origin: string
  prevRandao: bigint
  timestamp: bigint
}

/** An account as the engine enumerates it back. */
export type ReadAccount = {
  address: Hex
  balance: bigint
  code: Hex
  nonce: bigint
}

/** A log as the engine enumerates it back. */
export type LogEntry = {
  address: Hex
  data: Uint8Array
  topics: readonly Hex[]
}

/** Per-instruction trace access, when the engine build carries it. */
export type Trace = {
  reset(): void
  read(): {
    at: (index: number) => {
      depth: number
      gas: bigint
      op: number
      pc: number
      sp: number
    }
    capacity: number
    total: number
  }
}

/**
 * One engine behind the runner: staged state in, one executed top-level
 * frame (internal frames included), results enumerated out. The transaction
 * layer stays outside the seam.
 */
export type Adapter = {
  name: 'ts' | 'wasm'
  /** Whether this engine can execute under `fork`'s rules. */
  supports(fork: string): boolean
  /** Clears staged state, warm sets, context, and results. */
  reset(): void
  /** Upserts an account (balance, nonce, code); staged storage survives. */
  putAccount(
    address: string,
    account: { balance: bigint; code: Uint8Array; nonce: bigint },
  ): void
  putStorage(address: string, slot: bigint, value: bigint): void
  /** EIP-2929: seeds the accessed-address set. */
  warmAccount(address: string): void
  /** EIP-2929: seeds the accessed-slot set. */
  warmStorage(address: string, slot: bigint): void
  setContext(context: Context): void
  /** Runs the staged account's code. No value transfer — the runner moves
   * value as part of staging; `value` only feeds `CALLVALUE`. */
  execute(frame: {
    address: string
    caller: string
    data: Uint8Array
    gas: bigint
    static?: boolean | undefined
    value: bigint
  }): Status
  /** Runs `data` as a create transaction's initcode. The engine derives the
   * created address from the sender's staged (pre-increment) nonce and moves
   * `value` inside its own snapshot. */
  executeCreate(frame: {
    data: Uint8Array
    gas: bigint
    sender: string
    value: bigint
  }): Status
  /** Gas remaining after the last `execute`/`executeCreate`. */
  gasLeft(): bigint
  /** Refund counter after the last successful execution. */
  refund(): bigint
  /** Output of the last execution (`RETURN`/`REVERT` data). */
  output(): Uint8Array
  readState(): ReadAccount[]
  readStorage(): Map<string, Map<bigint, bigint>>
  readLogs(): LogEntry[]
  /** Re-arms the engine after a thrown error may have poisoned it. */
  recover(): void
  trace?: Trace | undefined
}

// The transaction layer.

/** EIP-2028/7623 intrinsic gas for the calldata and access list. */
function intrinsicGas(
  data: Uint8Array,
  isCreate: boolean,
  accessList: readonly FixtureAccessItem[] | undefined,
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
  return { floor, gas }
}

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

export const gasPerBlob = 131072n

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
export function blobBaseFeeOf(
  excess: bigint,
  fork: string,
  schedule?: FixtureBlobSchedule,
) {
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
 * the execution gas it takes to carry one: below that floor the price signal
 * is meaningless, so the subtraction of the target is replaced by a
 * proportional decay. `BLOB_BASE_COST` is 2^13.
 */
export function calcExcessBlobGas(
  parent: { baseFeePerGas: bigint; blobGasUsed: bigint; excessBlobGas: bigint },
  fork: string,
  schedule: FixtureBlobSchedule | undefined,
) {
  const target =
    big(schedule?.target) || (forkAtLeast(fork, 'Prague') ? 6n : 3n)
  const max = big(schedule?.max) || (forkAtLeast(fork, 'Prague') ? 9n : 6n)
  const targetGas = gasPerBlob * target
  if (parent.excessBlobGas + parent.blobGasUsed < targetGas) return 0n
  if (
    forkAtLeast(fork, 'Osaka') &&
    8192n * parent.baseFeePerGas >
      gasPerBlob * blobBaseFeeOf(parent.excessBlobGas, fork, schedule)
  )
    return parent.excessBlobGas + (parent.blobGasUsed * (max - target)) / max
  return parent.excessBlobGas + parent.blobGasUsed - targetGas
}

function warmPreamble(
  adapter: Adapter,
  sender: string,
  to: string | undefined,
  fork: string,
  coinbase?: string,
) {
  adapter.warmAccount(sender)
  if (to) adapter.warmAccount(to)
  // EIP-3651 added the coinbase to the accessed set at Shanghai.
  if (coinbase && forkAtLeast(fork, 'Shanghai'))
    adapter.warmAccount(coinbase.toLowerCase())
  for (const i of precompileAddresses(fork))
    adapter.warmAccount(`0x${i.toString(16).padStart(40, '0')}`)
}

const secpN =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** RLP takes minimal big-endian bytes, so a zero is the empty string. */
function minimal(v: bigint): Hex {
  if (v === 0n) return '0x'
  let h = v.toString(16)
  if (h.length % 2) h = `0${h}`
  return `0x${h}`
}

/**
 * Recovers the authority of an EIP-7702 authorization tuple, or `undefined`
 * if the tuple is malformed.
 *
 * The signed payload is `keccak(0x05 || rlp([chain_id, address, nonce]))`.
 */
function authority(
  auth: FixtureAuthorization,
  chainId: bigint,
): Hex | undefined {
  const r = big(auth.r)
  const sig = big(auth.s)
  const yParity = Number(big(auth.yParity ?? auth.v))
  if (r === 0n || sig === 0n || r >= secpN) return undefined
  // EIP-2 rejects the high half of the s range.
  if (sig > secpN / 2n) return undefined
  if (yParity !== 0 && yParity !== 1) return undefined
  const authChain = big(auth.chainId)
  if (authChain !== 0n && authChain !== chainId) return undefined
  // EIP-7702 step 2: a tuple whose nonce is at the u64 ceiling cannot be
  // applied, because applying it would have to increment past the cap. This
  // is checked before the authority is recovered, so such a tuple never
  // reaches step 4 and never warms anything.
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

export type Outcome =
  | { ok: true }
  | { detail?: string | undefined; ok: false; reason: string }

/** One case's verdict plus what blockchain mode needs to chain cases. */
export type CaseResult = {
  /** Effective gas price — lets `compare` express a balance mismatch in gas
   * units, which is what points a delta at a wrong constant. */
  gasPrice: bigint
  outcome: Outcome
  /**
   * Whether the runner refused the transaction instead of running it.
   *
   * A state test cannot tell the two apart — a rejected transaction's
   * expected post-state is the pre-state, which is also what a transaction
   * that does nothing produces — but a blockchain test can: a block
   * containing an invalid transaction is itself invalid.
   */
  rejected: boolean
  /** Post-transaction accounts, gas settlement included. Settlement happens
   * out here rather than in the engine, so blockchain mode carries one
   * transaction's result into the next through this rather than reading the
   * engine back. */
  settled: Map<string, ReadAccount>
  status: Status
}

/**
 * Applies a set-code transaction's authorization list and returns the gas to
 * refund.
 *
 * Each tuple is validated independently; an invalid one is skipped but still
 * paid for. Authorities are warmed whether or not the tuple applies.
 */
function applyAuthorizations(
  adapter: Adapter,
  authList: readonly FixtureAuthorization[],
  chainId: bigint,
  pre: Record<string, FixtureAccount>,
): bigint {
  let refund = 0n
  // The refund is for an authority already in the trie. The runner writes the
  // transaction's recipient into the engine as part of moving value, which
  // can conjure an account that the trie does not have, so pre-state
  // membership is the authority on this rather than the engine's current
  // view.
  const created = new Set<string>()
  for (const auth of authList) {
    const who = authority(auth, chainId)
    if (!who) continue
    adapter.warmAccount(who)

    const current = adapter.readState().find((a) => a.address === who)
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
    // The zero address is the way to undelegate: it clears the code instead
    // of writing a designation.
    const designation =
      big(auth.address) === 0n
        ? new Uint8Array(0)
        : Uint8Array.from([0xef, 0x01, 0x00, ...target])
    adapter.putAccount(who, {
      balance: current?.balance ?? 0n,
      code: designation,
      nonce: nonce + 1n,
    })
  }
  return refund
}

/** Compares the engine's current state against the expected post-state
 * without running anything — the rejected-transaction path. */
function compareLoaded(
  adapter: Adapter,
  post: FixturePost,
  gasPrice: bigint,
): CaseResult {
  const settled = new Map(adapter.readState().map((a) => [a.address, a]))
  return {
    gasPrice,
    outcome: compare(
      settled,
      post.state ?? {},
      adapter.readStorage(),
      'success',
      gasPrice,
    ),
    rejected: true,
    settled,
    status: 'success',
  }
}

/**
 * Runs one state-test case (one `post` entry of one fork) through the
 * adapter and compares the engine's post-state against the expected one.
 */
export function runCase(
  adapter: Adapter,
  test: FixtureCase,
  fork: string,
  post: FixturePost,
  options: { chainHashes?: readonly bigint[] | undefined } = {},
): CaseResult {
  const { chainHashes = [] } = options
  const tx = test.transaction
  const idx = post.indexes
  const data = bytes(tx.data[idx.data])
  const gasLimit = big(tx.gasLimit[idx.gas])
  const value = big(tx.value[idx.value])
  const isCreate = !tx.to || tx.to === '0x' || tx.to === ''

  const accessList = tx.accessLists?.[idx.data] ?? tx.accessList
  const authList = tx.authorizationList ?? []

  adapter.reset()

  // Pre-state.
  for (const [addr, acct] of Object.entries(test.pre)) {
    adapter.putAccount(addr, {
      balance: big(acct.balance),
      code: bytes(acct.code),
      nonce: big(acct.nonce),
    })
    for (const [k, v] of Object.entries(acct.storage ?? {}))
      adapter.putStorage(addr, big(k), big(v))
  }

  // Environment.
  const env = test.env
  const baseFee = big(env.currentBaseFee)
  const maxFee = tx.maxFeePerGas ? big(tx.maxFeePerGas) : big(tx.gasPrice)
  const maxPriority = tx.maxPriorityFeePerGas
    ? big(tx.maxPriorityFeePerGas)
    : big(tx.gasPrice)
  const effectiveGasPrice = tx.maxFeePerGas
    ? baseFee +
      (maxFee - baseFee < maxPriority ? maxFee - baseFee : maxPriority)
    : big(tx.gasPrice)
  // EIP-4844. The data fee is burnt, so it leaves the sender's balance
  // without reaching the coinbase; `BLOBBASEFEE` and `BLOBHASH` read the same
  // values.
  const blobHashes = tx.blobVersionedHashes ?? []
  const excessBlobGas = big(env.currentExcessBlobGas)
  // The schedule, not the fork constant: a blob-parameter-only fork changes
  // the update fraction and nothing else, so reading it from the fork name
  // alone prices every BPO block wrong.
  const blobBaseFee = forkAtLeast(fork, 'Cancun')
    ? blobBaseFeeOf(excessBlobGas, fork, test.config?.blobSchedule?.[fork])
    : 0n
  const blobFee = BigInt(blobHashes.length) * gasPerBlob * blobBaseFee
  adapter.setContext({
    baseFee,
    blobBaseFee,
    blobHashes: blobHashes.map((h) => big(h)),
    chainHashes,
    chainId: big(test.config?.chainid ?? '0x01'),
    coinbase: env.currentCoinbase,
    fork,
    gasLimit: big(env.currentGasLimit),
    gasPrice: effectiveGasPrice,
    number: big(env.currentNumber),
    origin: tx.sender,
    prevRandao: big(env.currentRandom ?? env.currentDifficulty),
    timestamp: big(env.currentTimestamp),
  })

  // EIP-2930 access list warms addresses and slots before execution.
  for (const item of accessList ?? []) {
    adapter.warmAccount(item.address.toLowerCase())
    for (const k of item.storageKeys ?? [])
      adapter.warmStorage(item.address.toLowerCase(), big(k))
  }

  const { floor, gas: intrinsic } = intrinsicGas(
    data,
    isCreate,
    accessList,
    fork,
  )
  // EIP-7702 charges PER_EMPTY_ACCOUNT_COST per authorization up front.
  const authGas = BigInt(authList.length) * 25000n
  // An invalid transaction is rejected outright: no nonce bump, no gas
  // charged, no execution. The expected post-state is simply the pre-state,
  // which is what the engine currently holds.
  // EIP-7623 makes the floor part of the validity requirement, not just the
  // settlement: a transaction whose limit cannot cover the larger of the two
  // is rejected before it runs. The authorization cost belongs *inside* that
  // comparison, as part of the intrinsic gas — adding it to the maximum
  // instead rejected set-code transactions whose limit sat between the two.
  const withAuth = intrinsic + authGas
  const required = withAuth > floor ? withAuth : floor
  if (required > gasLimit)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // EIP-7825 caps a single transaction at 2^24 gas from Osaka, whatever the
  // block allows. It is a validity rule, so the transaction is rejected
  // before it runs rather than running out of gas.
  if (forkAtLeast(fork, 'Osaka') && gasLimit > 16_777_216n)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // A set-code transaction must have at least one authorization and must not
  // be a create.
  if (tx.authorizationList && (authList.length === 0 || isCreate))
    return compareLoaded(adapter, post, effectiveGasPrice)

  // Sender pays upfront and its nonce advances before execution.
  const senderPre = test.pre[tx.sender.toLowerCase()]
  const senderBalance = big(senderPre?.balance)
  // EIP-3607: a transaction from an account with deployed code is invalid, so
  // that an address cannot be both a contract and an externally-owned
  // account. EIP-7702 carved out the delegation designator, which is code but
  // is not a contract — that is the whole point of a set-code transaction.
  if (forkAtLeast(fork, 'London')) {
    const senderCodeHex = (senderPre?.code ?? '0x').toLowerCase()
    const delegating =
      forkAtLeast(fork, 'Prague') && senderCodeHex.startsWith('0xef0100')
    if (senderCodeHex !== '0x' && senderCodeHex !== '' && !delegating)
      return compareLoaded(adapter, post, effectiveGasPrice)
  }
  // A blob transaction is invalid if it cannot pay the block's blob base fee.
  if (blobHashes.length && big(tx.maxFeePerBlobGas) < blobBaseFee)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // Type-specific validity. A rejected transaction leaves the pre-state
  // untouched, which is what the engine currently holds.
  // `maxFeePerBlobGas` is what makes a transaction type 3, not the presence
  // of blobs: an empty blob list is exactly what one of these tests sends.
  if (tx.maxFeePerBlobGas !== undefined) {
    if (!forkAtLeast(fork, 'Cancun'))
      return compareLoaded(adapter, post, effectiveGasPrice)
    // EIP-7691 raised the per-block maximum from 6 to 9, and from Osaka the
    // number is not a fork constant at all: EIP-7892 lets a
    // blob-parameter-only fork move it without any other change, so the
    // fixture's own schedule is the authority and the constants are only a
    // fallback.
    const scheduled = test.config?.blobSchedule?.[fork]?.max
    const maxBlobs =
      scheduled !== undefined
        ? Number(big(scheduled))
        : forkAtLeast(fork, 'Prague')
          ? 9
          : 6
    // EIP-7594 adds a per-*transaction* cap of six, below the per-block max,
    // so that one transaction cannot fill a block's whole blob capacity.
    const perTx = forkAtLeast(fork, 'Osaka') ? 6 : maxBlobs
    if (
      blobHashes.length === 0 ||
      blobHashes.length > maxBlobs ||
      blobHashes.length > perTx
    )
      return compareLoaded(adapter, post, effectiveGasPrice)
    // A blob transaction cannot be a create, and every hash must carry the
    // version byte.
    if (isCreate) return compareLoaded(adapter, post, effectiveGasPrice)
    for (const h of blobHashes)
      if (!h.startsWith('0x01'))
        return compareLoaded(adapter, post, effectiveGasPrice)
  }
  // EIP-1559: the fee cap has to cover the base fee. That applies to a legacy
  // transaction's `gasPrice` too — it is both caps at once, and one that
  // cannot pay the base fee is as invalid as a type-2 that cannot.
  if (forkAtLeast(fork, 'London') && maxFee < baseFee)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // A tip above the fee cap is nonsense and rejected, rather than clamped.
  if (tx.maxPriorityFeePerGas !== undefined && maxPriority > maxFee)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // EIP-2681 caps an account's nonce at 2^64 - 1, so a transaction at that
  // nonce could never be followed by another and is refused outright.
  if (big(tx.nonce) >= (1n << 64n) - 1n)
    return compareLoaded(adapter, post, effectiveGasPrice)
  // The nonce has to be exactly the account's. A state test always supplies a
  // matching one, so this never mattered until a block put two transactions
  // from the same sender in sequence.
  if (big(tx.nonce) !== big(senderPre?.nonce))
    return compareLoaded(adapter, post, effectiveGasPrice)
  // A transaction cannot reserve more gas than the block has to give.
  if (gasLimit > big(env.currentGasLimit))
    return compareLoaded(adapter, post, effectiveGasPrice)
  if (tx.authorizationList && !forkAtLeast(fork, 'Prague'))
    return compareLoaded(adapter, post, effectiveGasPrice)
  // A transaction type is invalid before the fork that introduced it:
  // EIP-2930 brought the access list at Berlin, EIP-1559 the fee caps at
  // London.
  if (accessList !== undefined && !forkAtLeast(fork, 'Berlin'))
    return compareLoaded(adapter, post, effectiveGasPrice)
  if (tx.maxFeePerGas !== undefined && !forkAtLeast(fork, 'London'))
    return compareLoaded(adapter, post, effectiveGasPrice)
  // EIP-3860 caps initcode at twice the deployed-code limit.
  if (isCreate && forkAtLeast(fork, 'Shanghai') && data.length > 49152)
    return compareLoaded(adapter, post, effectiveGasPrice)

  // Validity is judged against the caps the sender signed, not the effective
  // price: a transaction that cannot cover `gasLimit * maxFeePerGas` plus the
  // blob allowance is rejected before it runs.
  const maxBlobFee =
    BigInt(blobHashes.length) * gasPerBlob * big(tx.maxFeePerBlobGas)
  if (senderBalance < gasLimit * maxFee + value + maxBlobFee)
    return compareLoaded(adapter, post, effectiveGasPrice)

  // Only the gas is deducted here. For a call the runner moves the value
  // below; for a create `executeCreate` moves it, so deducting it here as
  // well would double-charge the sender.
  const senderCode = bytes(senderPre?.code)
  adapter.putAccount(tx.sender, {
    balance:
      senderBalance -
      gasLimit * effectiveGasPrice -
      blobFee -
      (isCreate ? 0n : value),
    code: senderCode,
    nonce: big(senderPre?.nonce) + 1n,
  })

  const toAddr = isCreate ? '' : (tx.to as string).toLowerCase()
  if (isCreate) {
    // A create transaction runs the calldata as initcode; the engine derives
    // the address from the sender's pre-increment nonce.
    warmPreamble(adapter, tx.sender, undefined, fork, env.currentCoinbase)
    const status = adapter.executeCreate({
      data,
      gas: gasLimit - intrinsic,
      sender: tx.sender,
      value,
    })
    // `executeCreate` moves the value inside its own snapshot, so a failure
    // has already rolled it back and the runner must not undo it again.
    return settleAndCompare(adapter, {
      baseFee,
      effectiveGasPrice,
      env,
      floor,
      fork,
      gasLimit,
      post,
      status,
      toAddr: '',
      tx,
      value: 0n,
    })
  }

  // Recipient receives the value. When the sender is also the recipient the
  // two writes target one account, so the credit has to build on the balance
  // the sender write just produced rather than on the pre-state.
  const toPre = test.pre[toAddr]
  const toCode = bytes(toPre?.code)
  const senderAdjusted =
    senderBalance - gasLimit * effectiveGasPrice - blobFee - value
  const toBase =
    toAddr === tx.sender.toLowerCase() ? senderAdjusted : big(toPre?.balance)
  adapter.putAccount(toAddr, {
    balance: toBase + value,
    code: toCode,
    nonce:
      toAddr === tx.sender.toLowerCase()
        ? big(senderPre?.nonce) + 1n
        : big(toPre?.nonce),
  })

  // Authorizations land before execution so the delegations they write are
  // visible to the first frame, and after the sender and recipient writes
  // above because those come from the pre-state and would otherwise clobber
  // them.
  const authRefund = applyAuthorizations(
    adapter,
    authList,
    big(test.config?.chainid ?? '0x01'),
    test.pre,
  )

  // EIP-2929 seeds the accessed-address set with the sender, the target, and
  // every precompile. Missing the precompiles made each precompile call pay
  // the cold 2600 instead of the warm 100.
  warmPreamble(adapter, tx.sender, toAddr, fork, env.currentCoinbase)

  // Execute.
  const execGas = gasLimit - intrinsic - authGas
  const status = adapter.execute({
    address: toAddr,
    caller: tx.sender,
    data,
    gas: execGas,
    value,
  })
  return settleAndCompare(adapter, {
    baseFee,
    effectiveGasPrice,
    env,
    extraRefund: authRefund,
    floor,
    fork,
    gasLimit,
    post,
    status,
    toAddr,
    tx,
    value,
  })
}

/** Applies the gas refund, repays the sender, pays the coinbase, compares. */
function settleAndCompare(
  adapter: Adapter,
  options: {
    baseFee: bigint
    effectiveGasPrice: bigint
    env: FixtureEnv
    extraRefund?: bigint | undefined
    floor: bigint
    fork: string
    gasLimit: bigint
    post: FixturePost
    status: Status
    toAddr: string
    tx: FixtureTransaction
    value: bigint
  },
): CaseResult {
  const {
    baseFee,
    effectiveGasPrice,
    env,
    extraRefund = 0n,
    floor,
    fork,
    gasLimit,
    post,
    status,
    toAddr,
    tx,
    value,
  } = options
  const gasLeft = adapter.gasLeft()
  const refundCounter = adapter.refund() + extraRefund

  let gasUsed = gasLimit - gasLeft
  if (status !== 'success' && extraRefund > 0n) {
    // An authorization is processed before execution, so its refund stands
    // even when the top-level frame reverts.
    const cap = gasUsed / 5n
    gasUsed -= extraRefund < cap ? extraRefund : cap
  }
  if (status === 'success') {
    // EIP-3529 caps the refund at a fifth of the gas consumed. The counter
    // can be negative mid-transaction; a negative total refunds nothing.
    const counter = refundCounter > 0n ? refundCounter : 0n
    // EIP-3529 tightened the cap from a half to a fifth.
    const cap = forkAtLeast(fork, 'London') ? gasUsed / 5n : gasUsed / 2n
    gasUsed -= counter < cap ? counter : cap
  }
  if (forkAtLeast(fork, 'Prague') && gasUsed < floor) gasUsed = floor

  // Settle: sender is repaid the unused gas, coinbase collects the tip.
  const settle = new Map(adapter.readState().map((a) => [a.address, a]))
  const sender = settle.get(tx.sender.toLowerCase() as Hex)
  // The runner performs the call-path value transfer outside the engine, as
  // part of loading state, so the engine's journal cannot roll it back. Undo
  // it here when the top-level frame did not succeed — REVERT included.
  if (status !== 'success' && value > 0n && toAddr) {
    const to = settle.get(toAddr as Hex)
    if (to) to.balance -= value
    if (sender) sender.balance += value
  }
  if (sender) sender.balance += (gasLimit - gasUsed) * effectiveGasPrice
  const cbAddr = env.currentCoinbase.toLowerCase() as Hex
  // The base fee is burned for every transaction type from London onward, so
  // the coinbase receives only the priority portion. Pre-London `baseFee` is
  // zero and this reduces to the full gas price.
  const tip = effectiveGasPrice - baseFee
  const cb = settle.get(cbAddr)
  if (cb) cb.balance += gasUsed * tip
  // Paying the coinbase touches it, and before EIP-161 a touched account
  // joins the trie and stays there with nothing in it — even when the fee is
  // zero, which a zero-gas-price transaction makes it.
  else if (gasUsed * tip > 0n || !forkAtLeast(fork, 'SpuriousDragon'))
    settle.set(cbAddr, {
      address: cbAddr,
      balance: gasUsed * tip,
      code: '0x',
      nonce: 0n,
    })

  return {
    gasPrice: effectiveGasPrice,
    outcome: compare(
      settle,
      post.state ?? {},
      adapter.readStorage(),
      status,
      effectiveGasPrice,
    ),
    rejected: false,
    settled: settle,
    status,
  }
}

function compare(
  actual: Map<string, ReadAccount>,
  expected: Record<string, FixtureAccount>,
  storage: Map<string, Map<bigint, bigint>>,
  status: Status,
  gasPrice: bigint,
): Outcome {
  // `DIFF=1` reports every mismatching account rather than the first, which
  // is what tells a gas discrepancy (the sender pays) from a value one.
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
    if (!got) return { detail: addr, ok: false, reason: 'missing-account' }
    if (got.balance !== big(want.balance))
      return {
        detail: `${addr} status=${status} wei-delta ${got.balance - big(want.balance)}${
          gasPrice
            ? ` gas-delta ${(got.balance - big(want.balance)) / gasPrice}`
            : ''
        }`,
        ok: false,
        reason: 'balance',
      }
    if (got.nonce !== big(want.nonce))
      return {
        detail: `${addr} got ${got.nonce} want ${big(want.nonce)}`,
        ok: false,
        reason: 'nonce',
      }
    if (got.code.toLowerCase() !== (want.code || '0x').toLowerCase())
      return { detail: addr, ok: false, reason: 'code' }
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
          detail: `${addr}[0x${k.toString(16)}] got ${have} want ${v}`,
          ok: false,
          reason: 'storage',
        }
    }
    for (const [k, v] of slots)
      if (v !== 0n && !wanted.has(k))
        return {
          detail: `${addr}[0x${k.toString(16)}]=${v}`,
          ok: false,
          reason: 'extra-storage',
        }
  }
  return { ok: true }
}

// The WASM adapter: the conformance-validated closed-world engine, staged
// through its fixed stage-buffer offsets.

const STAGE_ADDR = 0
const STAGE_ADDR2 = 20
const STAGE_WORD_A = 64
const STAGE_WORD_B = 96
const STAGE_BYTES = 128

/** The engine's status codes, by return value. */
const wasmStatuses = [
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
] as const satisfies readonly Status[]

type WasmEngine = {
  memory: WebAssembly.Memory
  evm_new(memoryCap: number): number
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
  evm_execute_create(vm: number, inputLength: number, gas: bigint): number
  evm_gas_left(vm: number): bigint
  evm_refund(vm: number): bigint
  evm_output_ptr(vm: number): number
  evm_output_len(vm: number): number
  evm_account_count(vm: number): number
  evm_account_at(vm: number, index: number): number
  evm_account_nonce(vm: number, index: number): bigint
  evm_storage_count(vm: number): number
  evm_storage_at(vm: number, index: number): number
  evm_log_count(vm: number): number
  evm_log_at(vm: number, index: number): number
  evm_trace_ptr?(vm: number): number
  evm_trace_count?(vm: number): number
  evm_trace_reset?(vm: number): void
}

/**
 * The staging-ABI adapter over the committed WASM engine blob.
 *
 * `OX_WASM` points at a build other than the committed one — in practice the
 * tracing build from `build-evm.ts --trace`, which `--trace-case` needs.
 */
export function wasm(): Adapter {
  const binary = process.env.OX_WASM
    ? new Uint8Array(readFileSync(process.env.OX_WASM))
    : Uint8Array.from(Buffer.from(wasmBase64, 'base64'))
  const module_ = new WebAssembly.Module(binary)

  // Definitely assigned by the `instantiate()` call below.
  let engine!: WasmEngine
  let vm!: number

  /**
   * Instantiates a fresh engine.
   *
   * Called again after any trap: a wasm trap leaves the shadow stack pointer
   * where it was, so a poisoned instance traps on every later call and one
   * bad case would be reported as tens of thousands.
   */
  function instantiate() {
    engine = new WebAssembly.Instance(module_, {})
      .exports as unknown as WasmEngine
    vm = engine.evm_new(0)
    // `evm_new` returns a null pointer when it cannot grow linear memory far
    // enough. Every later call would then write through it and trap, which
    // looks like an engine bug rather than the resource exhaustion it is.
    if (!vm) throw new Error('evm_new returned null: out of wasm memory')
  }
  instantiate()

  const mem = () => new Uint8Array(engine.memory.buffer)
  const stage = () => engine.evm_stage_ptr(vm)

  /** Writes a bigint as 32 big-endian bytes at `offset` in the staging
   * buffer. */
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

  return {
    execute(frame) {
      putAddr(STAGE_ADDR, frame.address)
      putAddr(STAGE_ADDR2, frame.caller)
      putWord(STAGE_WORD_A, frame.value)
      mem().set(frame.data, stage() + STAGE_BYTES)
      const rc = engine.evm_execute(
        vm,
        frame.data.length,
        frame.gas,
        frame.static ? 1 : 0,
      )
      return wasmStatuses[rc] ?? 'invalid-opcode'
    },
    executeCreate(frame) {
      putAddr(STAGE_ADDR2, frame.sender)
      putWord(STAGE_WORD_A, frame.value)
      mem().set(frame.data, stage() + STAGE_BYTES)
      const rc = engine.evm_execute_create(vm, frame.data.length, frame.gas)
      return wasmStatuses[rc] ?? 'invalid-opcode'
    },
    gasLeft: () => engine.evm_gas_left(vm),
    name: 'wasm',
    output() {
      const at = engine.evm_output_ptr(vm)
      return mem().slice(at, at + engine.evm_output_len(vm))
    },
    putAccount(address, account) {
      putAddr(STAGE_ADDR, address)
      putWord(STAGE_WORD_A, account.balance)
      mem().set(account.code, stage() + STAGE_BYTES)
      if (engine.evm_put_account(vm, account.nonce, account.code.length) !== 0)
        throw new Error('state-capacity')
    },
    putStorage(address, slot, value) {
      putAddr(STAGE_ADDR, address)
      putWord(STAGE_WORD_A, slot)
      putWord(STAGE_WORD_B, value)
      if (engine.evm_put_storage(vm) !== 0) throw new Error('state-capacity')
    },
    readLogs() {
      const out: LogEntry[] = []
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
        out.push({ address, data: mem().slice(from, from + dataLen), topics })
      }
      return out
    },
    readState() {
      const out: ReadAccount[] = []
      const n = engine.evm_account_count(vm)
      for (let i = 0; i < n; i++) {
        const codeLen = engine.evm_account_at(vm, i)
        if (codeLen < 0) continue
        out.push({
          address: getAddr(STAGE_ADDR),
          balance: getWord(STAGE_WORD_A),
          code: toHex(
            mem().slice(stage() + STAGE_BYTES, stage() + STAGE_BYTES + codeLen),
          ),
          // The export returns i64, so a nonce past 2^63 comes back negative.
          nonce: BigInt.asUintN(64, engine.evm_account_nonce(vm, i)),
        })
      }
      return out
    },
    readStorage() {
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
    },
    recover: instantiate,
    refund: () => engine.evm_refund(vm),
    reset: () => engine.evm_reset(vm),
    setContext(context) {
      putAddr(STAGE_ADDR, context.origin)
      putAddr(STAGE_ADDR2, context.coinbase)
      putWord(64, context.gasPrice)
      putWord(96, context.baseFee)
      putWord(128, context.blobBaseFee)
      putWord(160, context.prevRandao)
      putWord(192, context.chainId)
      const blobCount = Math.min(context.blobHashes.length, 16)
      for (let i = 0; i < blobCount; i++)
        putWord(224 + i * 32, context.blobHashes[i] as bigint)
      // Ancestor hashes go after the sixteen blob-hash slots, which is where
      // `evm_set_context` reads them from.
      const hashCount = Math.min(context.chainHashes.length, 256)
      for (let i = 0; i < hashCount; i++)
        putWord(224 + 16 * 32 + i * 32, context.chainHashes[i] as bigint)
      engine.evm_set_context(
        vm,
        context.number,
        context.timestamp,
        context.gasLimit,
        blobCount,
        hashCount,
        specIds[context.fork] ?? specLatest,
      )
    },
    supports: (fork) => specIds[fork] !== undefined,
    trace: engine.evm_trace_ptr
      ? {
          read() {
            const capacity = 1 << 18
            const total = engine.evm_trace_count?.(vm) ?? 0
            const base = engine.evm_trace_ptr?.(vm) ?? 0
            const view = new DataView(engine.memory.buffer)
            return {
              at(index) {
                const o = base + (index & (capacity - 1)) * 24
                return {
                  depth: view.getInt32(o + 16, true),
                  gas: view.getBigInt64(o + 8, true),
                  op: view.getInt32(o + 4, true),
                  pc: view.getInt32(o, true),
                  sp: view.getInt32(o + 20, true),
                }
              },
              capacity,
              total,
            }
          },
          reset: () => engine.evm_trace_reset?.(vm),
        }
      : undefined,
    warmAccount(address) {
      putAddr(STAGE_ADDR, address)
      engine.evm_warm_account(vm)
    },
    warmStorage(address, slot) {
      putAddr(STAGE_ADDR, address)
      putWord(STAGE_WORD_A, slot)
      engine.evm_warm_storage(vm)
    },
  }
}

// The TypeScript adapter: drives the `ox/evm` interpreter + journal over the
// same staged-state protocol.

/** The fixture forks the TypeScript core implements. BPO forks change only
 * the blob schedule, which the runner prices — they execute as Osaka. */
const tsForks: Record<string, Hardfork.Hardfork> = {
  BPO1: 'osaka',
  BPO2: 'osaka',
  BPO3: 'osaka',
  BPO4: 'osaka',
  BPO5: 'osaka',
  Cancun: 'cancun',
  Osaka: 'osaka',
  Prague: 'prague',
}

const empty = new Uint8Array(0)

/**
 * The `ox/evm` adapter: the pure-TypeScript interpreter and journal behind
 * the same staged-state protocol the WASM engine speaks.
 *
 * Single-frame only until the call family lands (PR 2+): a case whose code
 * reaches `CALL`/`CREATE`/`RETURNDATA*` halts with `invalid-opcode` and
 * fails its comparison — expected, and reported rather than hidden.
 */
export function ts(): Adapter {
  type StagedAccount = { balance: bigint; code: Uint8Array; nonce: bigint }
  const accounts = new Map<string, StagedAccount>()
  const storage = new Map<string, Map<bigint, bigint>>()
  const warmAddresses = new Set<string>()
  const warmSlots: { address: string; slot: bigint }[] = []
  let context: Context | undefined
  let gasLeft = 0n
  let refund = 0n
  let output = empty
  let logs: LogEntry[] = []

  function slots(address: string): Map<bigint, bigint> {
    let map = storage.get(address)
    if (!map) {
      map = new Map()
      storage.set(address, map)
    }
    return map
  }

  /** Answers interpreter state misses from the staged maps. */
  function resolve(request: journal_.StateRequest): journal_.Seed {
    switch (request.kind) {
      case 'account':
        return {
          account: accounts.get(request.address),
          address: request.address,
          kind: 'account',
        }
      case 'blockHash': {
        const { chainHashes, number } = context as Context
        const index = Number(number - request.number - 1n)
        return {
          hash:
            index >= 0 && index < chainHashes.length
              ? (chainHashes[index] as bigint)
              : 0n,
          kind: 'blockHash',
          number: request.number,
        }
      }
      case 'code':
        return {
          address: request.address,
          code: accounts.get(request.address)?.code ?? empty,
          kind: 'code',
        }
      case 'storage':
        return {
          address: request.address,
          kind: 'storage',
          slot: request.slot,
          value: storage.get(request.address)?.get(request.slot) ?? 0n,
        }
    }
  }

  /** Builds the machine for one frame, seeds the runner-staged warm sets,
   * and runs it to completion against the staged state. */
  function runFrame(
    journal: journal_.Journal,
    frame: {
      address: string
      caller: string
      code: Uint8Array
      data: Uint8Array
      gas: bigint
      static: boolean
      value: bigint
    },
  ): { frame: Frame; machine: Machine } {
    const ctx = context as Context
    for (const address of warmAddresses) journal_.warmAddress(journal, address)
    for (const { address, slot } of warmSlots)
      journal_.warmSlot(journal, address, slot)
    const { analysis, bytes: code } = analyzed(frame.code)
    const top = createFrame({
      address: frame.address,
      analysis,
      caller: addressToWord(frame.caller),
      code,
      gas: frame.gas,
      input: frame.data,
      static: frame.static,
      value: frame.value,
    })
    const machine: Machine = {
      blobHashes: ctx.blobHashes,
      block: {
        baseFee: ctx.baseFee,
        blobBaseFee: ctx.blobBaseFee,
        chainId: ctx.chainId,
        coinbase: addressToWord(ctx.coinbase.toLowerCase()),
        gasLimit: ctx.gasLimit,
        number: ctx.number,
        prevRandao: ctx.prevRandao,
        timestamp: ctx.timestamp,
      },
      done: false,
      frames: [top],
      gasPrice: ctx.gasPrice,
      halt: undefined,
      journal,
      origin: addressToWord(ctx.origin.toLowerCase()),
      request: undefined,
      reverted: false,
      table: table(tsForks[ctx.fork] as Hardfork.Hardfork),
    }
    let request = interpret(machine)
    while (request !== undefined) {
      journal_.seed(journal, resolve(request))
      request = interpret(machine)
    }
    return { frame: top, machine }
  }

  /** Applies a successful frame's journal back onto the staged maps. */
  function commit(journal: journal_.Journal): void {
    for (const [address, account] of journal.accounts) {
      if (journal.selfdestructs.has(address)) {
        accounts.delete(address)
        storage.delete(address)
        continue
      }
      if (account === null) continue
      const code =
        journal.codes.get(address) ?? accounts.get(address)?.code ?? empty
      accounts.set(address, {
        balance: account.balance,
        code,
        nonce: account.nonce,
      })
    }
    for (const [address, changed] of journal.storage) {
      if (journal.selfdestructs.has(address)) continue
      for (const [slot, value] of changed) slots(address).set(slot, value)
    }
  }

  function finish(
    journal: journal_.Journal,
    frame: Frame,
    machine: Machine,
  ): Status {
    gasLeft = frame.gas
    if (machine.halt) {
      output = empty
      return machine.halt
    }
    output = frame.output ?? empty
    if (machine.reverted) return 'reverted'
    refund = journal.refund
    logs = journal.logs.map((log) => ({
      address: log.address as Hex,
      data: log.data,
      topics: log.topics.map(
        (topic): Hex => `0x${topic.toString(16).padStart(64, '0')}`,
      ),
    }))
    commit(journal)
    return 'success'
  }

  return {
    execute(frame) {
      refund = 0n
      logs = []
      const journal = journal_.create()
      const address = frame.address.toLowerCase()
      const { frame: top, machine } = runFrame(journal, {
        address,
        caller: frame.caller.toLowerCase(),
        code: accounts.get(address)?.code ?? empty,
        data: frame.data,
        gas: frame.gas,
        static: frame.static ?? false,
        value: frame.value,
      })
      return finish(journal, top, machine)
    },
    executeCreate(frame) {
      refund = 0n
      logs = []
      const journal = journal_.create()
      const sender = frame.sender.toLowerCase()
      const senderAccount = accounts.get(sender)
      // The runner already advanced the staged nonce; the created address
      // derives from the pre-increment one.
      const nonce = (senderAccount?.nonce ?? 1n) - 1n
      const created = ContractAddress.fromCreate({
        from: sender as Address.Address,
        nonce,
      }).toLowerCase()
      const existing = accounts.get(created)
      const existingSlots = storage.get(created)
      // EIP-684/7610: an account with code, a nonce, or storage cannot be
      // created over. An exceptional collision consumes all gas.
      if (
        existing &&
        (existing.code.length > 0 ||
          existing.nonce > 0n ||
          (existingSlots &&
            [...existingSlots.values()].some((value) => value !== 0n)))
      ) {
        gasLeft = 0n
        output = empty
        return 'create-collision'
      }
      // The value moves inside the journal so a failed create rolls it back.
      journal_.seed(journal, {
        account: senderAccount,
        address: sender,
        kind: 'account',
      })
      journal_.seed(journal, {
        account: existing,
        address: created,
        kind: 'account',
      })
      journal_.setBalance(
        journal,
        sender,
        (senderAccount?.balance ?? 0n) - frame.value,
      )
      journal_.setBalance(
        journal,
        created,
        (existing?.balance ?? 0n) + frame.value,
      )
      journal_.setNonce(journal, created, 1n)
      journal_.markCreated(journal, created)
      journal_.warmAddress(journal, created)
      const { frame: top, machine } = runFrame(journal, {
        address: created,
        caller: sender,
        code: frame.data,
        data: empty,
        gas: frame.gas,
        static: false,
        value: frame.value,
      })
      if (machine.halt || machine.reverted) return finish(journal, top, machine)
      const code = top.output ?? empty
      // EIP-170 deployed-code cap and EIP-3541's 0xEF ban both consume the
      // frame's remaining gas, as does an unaffordable deposit (EIP-2).
      if (code.length > 24576) {
        gasLeft = 0n
        output = empty
        return 'code-size-exceeded'
      }
      if (code[0] === 0xef) {
        gasLeft = 0n
        output = empty
        return 'invalid-code'
      }
      const deposit = 200n * BigInt(code.length)
      if (deposit > top.gas) {
        gasLeft = 0n
        output = empty
        return 'out-of-gas'
      }
      journal_.setCode(journal, created, code)
      top.gas -= deposit
      top.output = undefined
      return finish(journal, top, machine)
    },
    gasLeft: () => gasLeft,
    name: 'ts',
    output: () => output,
    putAccount(address, account) {
      accounts.set(address.toLowerCase(), {
        balance: account.balance,
        code: account.code,
        nonce: account.nonce,
      })
    },
    putStorage(address, slot, value) {
      slots(address.toLowerCase()).set(slot, value)
    },
    readLogs: () => logs,
    readState() {
      return [...accounts].map(([address, account]) => ({
        address: address as Hex,
        balance: account.balance,
        code: toHex(account.code),
        nonce: account.nonce,
      }))
    },
    readStorage() {
      return new Map(
        [...storage].map(([address, map]) => [address, new Map(map)]),
      )
    },
    recover() {},
    refund: () => refund,
    reset() {
      accounts.clear()
      storage.clear()
      warmAddresses.clear()
      warmSlots.length = 0
      context = undefined
      gasLeft = 0n
      refund = 0n
      output = empty
      logs = []
    },
    setContext(next) {
      context = next
    },
    supports: (fork) => tsForks[fork] !== undefined,
    warmAccount(address) {
      warmAddresses.add(address.toLowerCase())
    },
    warmStorage(address, slot) {
      warmSlots.push({ address: address.toLowerCase(), slot })
    },
  }
}
