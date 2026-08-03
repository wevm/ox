// Shared `ethereum/execution-spec-tests` fixture types and public API runner.
//
// Fixtures: release v5.4.0 (`fixtures_develop.tar.gz`). Download into the
// gitignored fixtures directory with:
//
//   mkdir -p test/evm/fixtures && curl -sL \
//     https://github.com/ethereum/execution-spec-tests/releases/download/v5.4.0/fixtures_develop.tar.gz \
//     | tar -xz -C test/evm/fixtures --strip-components=1 fixtures/state_tests

import type * as Address from '../../src/core/Address.js'
import * as core_Hex from '../../src/core/Hex.js'
import * as Evm from '../../src/evm/Evm.js'
import type * as Hardfork from '../../src/evm/Hardfork.js'
import * as State from '../../src/evm/State.js'

type Hex = `0x${string}`

export const big = (hex: string | undefined): bigint =>
  !hex || hex === '0x' ? 0n : BigInt(hex)

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

export type Outcome =
  | { ok: true }
  | { detail?: string | undefined; ok: false; reason: string }

export type CaseResult = {
  gasPrice: bigint
  gasUsed: bigint
  outcome: Outcome
  rejected: boolean
  status: Evm.Receipt['status'] | Evm.HaltReason
}

const forkOrder = ['Cancun', 'Prague', 'Osaka'] as const

function forkAtLeast(fork: string, minimum: string): boolean {
  return forkOrder.indexOf(fork as never) >= forkOrder.indexOf(minimum as never)
}

function fakeExponential(
  factor: bigint,
  numerator: bigint,
  denominator: bigint,
) {
  let index = 1n
  let output = 0n
  let accumulator = factor * denominator
  while (accumulator > 0n) {
    output += accumulator
    accumulator = (accumulator * numerator) / (denominator * index)
    index += 1n
  }
  return output / denominator
}

function blobBaseFeeOf(
  excess: bigint,
  fork: string,
  schedule?: FixtureBlobSchedule,
) {
  const fraction =
    schedule?.baseFeeUpdateFraction !== undefined
      ? big(schedule.baseFeeUpdateFraction)
      : forkAtLeast(fork, 'Prague')
        ? 5007716n
        : 3338477n
  return fakeExponential(1n, excess, fraction)
}

/** Runs one state-test fixture through `Evm.transact`. */
export function runCase(
  test: FixtureCase,
  fork: string,
  post: FixturePost,
): CaseResult {
  const transaction = test.transaction
  const index = post.indexes
  const data = transaction.data[index.data] as Hex
  const gasLimit = big(transaction.gasLimit[index.gas])
  const value = big(transaction.value[index.value])
  const accessList =
    transaction.accessLists?.[index.data] ?? transaction.accessList
  const hardfork = (
    fork === 'Cancun' ? 'cancun' : fork === 'Prague' ? 'prague' : 'osaka'
  ) as Hardfork.Hardfork
  const environment = test.env
  const memory = State.fromMemory({
    accounts: Object.fromEntries(
      Object.entries(test.pre).map(([address, account]) => [
        address,
        {
          balance: big(account.balance),
          code: (account.code || '0x') as Hex,
          nonce: big(account.nonce),
          storage: account.storage as never,
        },
      ]),
    ) as never,
  })
  const addresses = new Set(
    Object.keys(test.pre).map((address) => address.toLowerCase()),
  )
  const trackedSlots = new Map<string, Set<bigint>>()
  for (const [address, account] of Object.entries(test.pre))
    trackedSlots.set(
      address.toLowerCase(),
      new Set(Object.keys(account.storage ?? {}).map(big)),
    )
  const state = State.from({
    ...memory,
    putAccount(address, account) {
      addresses.add(address.toLowerCase())
      memory.putAccount(address, account)
    },
    putStorage(address, slot, value) {
      const key = address.toLowerCase()
      addresses.add(key)
      let accountSlots = trackedSlots.get(key)
      if (!accountSlots) {
        accountSlots = new Set()
        trackedSlots.set(key, accountSlots)
      }
      accountSlots.add(slot)
      memory.putStorage(address, slot, value)
    },
  })
  const chainId = big(test.config?.chainid ?? '0x01')
  const evm = Evm.from({
    block: {
      baseFeePerGas: big(environment.currentBaseFee),
      blobBaseFee: blobBaseFeeOf(
        big(environment.currentExcessBlobGas),
        fork,
        test.config?.blobSchedule?.[fork],
      ),
      coinbase: environment.currentCoinbase as Address.Address,
      gasLimit: big(environment.currentGasLimit),
      number: big(environment.currentNumber),
      prevRandao: core_Hex.fromNumber(
        big(environment.currentRandom ?? environment.currentDifficulty),
        { size: 32 },
      ),
      timestamp: big(environment.currentTimestamp),
    },
    chainId,
    hardfork,
    state,
  })
  const authorizationList = transaction.authorizationList?.map(
    (authorization) => ({
      address: authorization.address as Address.Address,
      chainId: Number(big(authorization.chainId)),
      nonce: big(authorization.nonce),
      r: core_Hex.fromNumber(big(authorization.r), { size: 32 }),
      s: core_Hex.fromNumber(big(authorization.s), { size: 32 }),
      yParity: Number(big(authorization.yParity ?? authorization.v)),
    }),
  )
  const envelope = {
    ...(accessList
      ? {
          accessList: accessList.map((item) => ({
            address: item.address as Address.Address,
            storageKeys: (item.storageKeys ?? []) as readonly Hex[],
          })),
        }
      : {}),
    ...(authorizationList ? { authorizationList } : {}),
    ...(transaction.blobVersionedHashes
      ? {
          blobVersionedHashes:
            transaction.blobVersionedHashes as readonly Hex[],
        }
      : {}),
    chainId: Number(chainId),
    data,
    from: transaction.sender as Address.Address,
    gas: gasLimit,
    ...(transaction.gasPrice ? { gasPrice: big(transaction.gasPrice) } : {}),
    ...(transaction.maxFeePerBlobGas
      ? { maxFeePerBlobGas: big(transaction.maxFeePerBlobGas) }
      : {}),
    ...(transaction.maxFeePerGas
      ? { maxFeePerGas: big(transaction.maxFeePerGas) }
      : {}),
    ...(transaction.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: big(transaction.maxPriorityFeePerGas) }
      : {}),
    nonce: big(transaction.nonce),
    to: transaction.to ? (transaction.to as Address.Address) : null,
    type: authorizationList
      ? 'eip7702'
      : transaction.maxFeePerBlobGas
        ? 'eip4844'
        : transaction.maxFeePerGas
          ? 'eip1559'
          : accessList
            ? 'eip2930'
            : 'legacy',
    value,
  }
  let receipt: Evm.Receipt | undefined
  let rejected = false
  try {
    receipt = Evm.transact(evm, envelope as never)
  } catch (error) {
    if (!(error instanceof Evm.InvalidTransactionError)) throw error
    rejected = true
  }

  const actual = new Map<string, ReadAccount>()
  const storage = new Map<string, Map<bigint, bigint>>()
  for (const address of addresses) {
    const key = address as Address.Address
    const account = state.getAccount(key)
    if (!account) continue
    actual.set(key, {
      balance: account.balance,
      code: (account.code ?? state.getCode(key)) as Hex,
      nonce: account.nonce,
    })
    const actualSlots = new Map<bigint, bigint>()
    for (const slot of trackedSlots.get(key) ?? [])
      actualSlots.set(slot, state.getStorage(key, slot))
    storage.set(key, actualSlots)
  }
  const status =
    receipt?.status === 'halted'
      ? receipt.reason
      : (receipt?.status ?? 'success')
  const gasPrice = receipt?.effectiveGasPrice ?? 0n
  return {
    gasPrice,
    gasUsed: receipt?.gasUsed ?? 0n,
    outcome: post.state
      ? compare(actual, post.state, storage, status, gasPrice)
      : { ok: true },
    rejected,
    status,
  }
}

type ReadAccount = {
  balance: bigint
  code: Hex
  nonce: bigint
}

function compare(
  actual: Map<string, ReadAccount>,
  expected: Record<string, FixtureAccount>,
  storage: Map<string, Map<bigint, bigint>>,
  status: CaseResult['status'],
  gasPrice: bigint,
): Outcome {
  const expectedAddresses = new Set(
    Object.keys(expected).map((address) => address.toLowerCase()),
  )
  for (const address of actual.keys())
    if (!expectedAddresses.has(address.toLowerCase()))
      return { detail: address, ok: false, reason: 'extra-account' }
  for (const [address, account] of Object.entries(expected)) {
    const key = address.toLowerCase()
    const actualAccount = actual.get(key)
    if (!actualAccount)
      return { detail: key, ok: false, reason: 'missing-account' }
    if (actualAccount.balance !== big(account.balance))
      return {
        detail: `${key} status=${status} wei-delta ${actualAccount.balance - big(account.balance)}${
          gasPrice
            ? ` gas-delta ${(actualAccount.balance - big(account.balance)) / gasPrice}`
            : ''
        }`,
        ok: false,
        reason: 'balance',
      }
    if (actualAccount.nonce !== big(account.nonce))
      return {
        detail: `${key} got ${actualAccount.nonce} want ${big(account.nonce)}`,
        ok: false,
        reason: 'nonce',
      }
    if (
      actualAccount.code.toLowerCase() !== (account.code || '0x').toLowerCase()
    )
      return { detail: key, ok: false, reason: 'code' }
    const actualSlots = storage.get(key) ?? new Map<bigint, bigint>()
    const expectedSlots = new Map<bigint, bigint>()
    for (const [slot, value] of Object.entries(account.storage ?? {}))
      if (big(value) !== 0n) expectedSlots.set(big(slot), big(value))
    for (const [slot, value] of expectedSlots) {
      const actualValue = actualSlots.get(slot) ?? 0n
      if (actualValue !== value)
        return {
          detail: `${key}[0x${slot.toString(16)}] got ${actualValue} want ${value}`,
          ok: false,
          reason: 'storage',
        }
    }
    for (const [slot, value] of actualSlots)
      if (value !== 0n && !expectedSlots.has(slot))
        return {
          detail: `${key}[0x${slot.toString(16)}]=${value}`,
          ok: false,
          reason: 'extra-storage',
        }
  }
  return { ok: true }
}
