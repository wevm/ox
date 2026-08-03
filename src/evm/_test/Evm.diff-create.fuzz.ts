import { fc, test } from '@fast-check/vitest'
import { ContractAddress, Hex } from 'ox'
import { Evm, State } from 'ox/evm'
import { describe, expect } from 'vp/test'

import * as oracle from '../../../test/evm/oracle.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100
const self = '0x00000000000000000000000000000000000000aa' as const

const push2 = (value: number) => [0x61, value >> 8, value & 0xff]
const push32 = (value: bigint) => [
  0x7f,
  ...Hex.toBytes(Hex.fromNumber(value, { size: 32 })),
]

function initcode(runtime: Uint8Array): Uint8Array {
  return Uint8Array.from([
    ...push2(runtime.length),
    ...push2(13),
    0x5f,
    0x39,
    ...push2(runtime.length),
    0x5f,
    0xf3,
    ...runtime,
  ])
}

function program(options: {
  initcode: Uint8Array
  opcode: 0xf0 | 0xf5
  salt: bigint
  value: number
}): Uint8Array {
  const create = [
    ...(options.opcode === 0xf5 ? push32(options.salt) : []),
    ...push2(options.initcode.length),
    0x5f,
    ...(options.value === 0 ? [0x5f] : [0x60, options.value]),
    options.opcode,
  ]
  const tail = [0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3]
  const prefixLength = 8 + create.length + tail.length
  return Uint8Array.from([
    ...push2(options.initcode.length),
    ...push2(prefixLength),
    0x5f,
    0x39,
    ...create,
    ...tail,
    ...options.initcode,
  ])
}

function compare(options: {
  balance: bigint
  collision: 'code' | 'nonce' | 'none' | 'storage'
  gas: bigint
  nonce: bigint
  opcode: 0xf0 | 0xf5
  runtime: Uint8Array
  salt: bigint
  targetBalance: bigint
  value: number
}): void {
  const creationCode = initcode(options.runtime)
  const bytecode = program({
    initcode: creationCode,
    opcode: options.opcode,
    salt: options.salt,
    value: options.value,
  })
  const target = (
    options.opcode === 0xf5
      ? ContractAddress.fromCreate2({
          bytecode: creationCode,
          from: self,
          salt: Hex.fromNumber(options.salt, { size: 32 }),
        })
      : ContractAddress.fromCreate({ from: self, nonce: options.nonce })
  ).toLowerCase()
  const targetAccount =
    options.collision === 'none'
      ? undefined
      : {
          address: target,
          balance: options.targetBalance,
          code:
            options.collision === 'code'
              ? new Uint8Array([0x00])
              : new Uint8Array(0),
          nonce: options.collision === 'nonce' ? 1n : 0n,
        }
  const accounts = [
    {
      address: self,
      balance: options.balance,
      code: bytecode,
      nonce: options.nonce,
    },
    ...(targetAccount ? [targetAccount] : []),
  ]
  const storage =
    options.collision === 'storage'
      ? [{ address: target, slot: 1n, value: 2n }]
      : []

  const expected = oracle.execute({
    accounts,
    address: self,
    gas: options.gas,
    storage,
  })
  const state = State.fromMemory({
    accounts: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        {
          balance: account.balance,
          code: Hex.fromBytes(account.code),
          nonce: account.nonce,
        },
      ]),
    ),
  })
  for (const entry of storage)
    state.putStorage(entry.address as `0x${string}`, entry.slot, entry.value)
  const actual = Evm.run({
    address: self,
    bytecode,
    gas: options.gas,
    state,
  })

  expect(
    actual.status === 'halted' ? 'exceptional' : actual.status,
    `status (oracle: ${expected.status})`,
  ).toBe(expected.statusClass)
  expect(actual.gasUsed, `gas (oracle: ${expected.status})`).toBe(
    expected.gasUsed,
  )
  if (actual.status === 'halted') return
  expect(actual.output).toBe(Hex.fromBytes(expected.output))
  if (actual.status !== 'success') return

  expect(actual.gasRefund).toBe(expected.refund)
  for (const [address, account] of expected.accounts) {
    const actualAccount = state.getAccount(address as `0x${string}`)
    expect(actualAccount?.balance ?? 0n, `balance of ${address}`).toBe(
      account.balance,
    )
    expect(actualAccount?.nonce ?? 0n, `nonce of ${address}`).toBe(
      account.nonce,
    )
    expect(actualAccount?.code ?? '0x', `code of ${address}`).toBe(
      Hex.fromBytes(account.code),
    )
  }
  for (const [address, slots] of expected.storage)
    for (const [slot, value] of slots)
      expect(
        state.getStorage(address as `0x${string}`, slot),
        `storage ${address}[${slot}]`,
      ).toBe(value)
}

describe('TS interpreter matches the WASM engine over creation', () => {
  test.prop(
    {
      balance: fc.bigInt({ min: 0n, max: 200n }),
      collision: fc.constantFrom('code', 'nonce', 'none', 'storage'),
      gas: fc.constantFrom(35_000n, 100_000n, 1_000_000n),
      nonce: fc.bigInt({ min: 0n, max: 100n }),
      opcode: fc.constantFrom(0xf0, 0xf5),
      runtime: fc.uint8Array({ maxLength: 64 }),
      salt: fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }),
      targetBalance: fc.bigInt({ min: 0n, max: 100n }),
      value: fc.integer({ min: 0, max: 255 }),
    },
    { numRuns },
  )('creation outcomes and post-state agree', compare)
})
