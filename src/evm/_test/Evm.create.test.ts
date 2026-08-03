import { ContractAddress, Hex } from 'ox'
import { Evm, State } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

import * as oracle from '../../../test/evm/oracle.js'

const self = '0x00000000000000000000000000000000000000aa' as const
const zeroAddress = '0x0000000000000000000000000000000000000000' as const

const push2 = (value: number) => [0x61, value >> 8, value & 0xff]
const push32 = (value: bigint) =>
  [0x7f, ...Hex.toBytes(Hex.fromNumber(value, { size: 32 }))] as const

function initcode(runtime: readonly number[]): Uint8Array {
  const header = [
    ...push2(runtime.length),
    ...push2(13),
    0x5f,
    0x39,
    ...push2(runtime.length),
    0x5f,
    0xf3,
  ]
  return Uint8Array.from([...header, ...runtime])
}

function program(options: {
  initcode: Uint8Array
  opcode?: 0xf0 | 0xf5 | undefined
  salt?: bigint | undefined
  tail?: readonly number[] | undefined
  value?: number | undefined
}): Uint8Array {
  const {
    initcode,
    opcode = 0xf0,
    salt = 0n,
    tail = [0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3],
    value = 0,
  } = options
  const create = [
    ...(opcode === 0xf5 ? push32(salt) : []),
    ...push2(initcode.length),
    0x5f,
    ...(value === 0 ? [0x5f] : [0x60, value]),
    opcode,
  ]
  const prefixLength = 8 + create.length + tail.length
  return Uint8Array.from([
    ...push2(initcode.length),
    ...push2(prefixLength),
    0x5f,
    0x39,
    ...create,
    ...tail,
    ...initcode,
  ])
}

function compare(options: {
  accounts: readonly {
    address: string
    balance: bigint
    code: Uint8Array
    nonce: bigint
  }[]
  address?: string | undefined
  gas?: bigint | undefined
  storage?:
    | readonly { address: string; slot: bigint; value: bigint }[]
    | undefined
}) {
  const { accounts, address = self, gas = 1_000_000n, storage = [] } = options
  const expected = oracle.execute({ accounts, address, gas, storage })
  const state = State.fromMemory({
    accounts: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        {
          balance: account.balance,
          code: Hex.fromBytes(account.code),
          nonce: account.nonce,
          storage: Object.fromEntries(
            storage
              .filter((entry) => entry.address === account.address)
              .map((entry) => [
                Hex.fromNumber(entry.slot),
                Hex.fromNumber(entry.value),
              ]),
          ),
        },
      ]),
    ),
  })
  const actual = Evm.run({
    address: address as `0x${string}`,
    bytecode:
      accounts.find((account) => account.address === address)?.code ??
      new Uint8Array(0),
    gas,
    state,
  })
  expect({
    gasUsed: actual.gasUsed,
    output:
      actual.status === 'halted'
        ? new Uint8Array(0)
        : Hex.toBytes(actual.output),
    statusClass: actual.status === 'halted' ? 'exceptional' : actual.status,
  }).toEqual({
    gasUsed: expected.gasUsed,
    output: expected.output,
    statusClass: expected.statusClass,
  })
  return { actual, expected, state }
}

describe('CREATE', () => {
  test('creates from the bare frame over empty state', () => {
    const creationCode = initcode([])
    const result = Evm.run({ bytecode: program({ initcode: creationCode }) })
    const created = ContractAddress.fromCreate({ from: zeroAddress, nonce: 0n })

    Evm.assertSuccess(result)
    expect(result.output).toBe(Hex.padLeft(created, 32))
  })

  test('deploys returned runtime code, transfers value, and increments nonces', () => {
    const runtime = [0x60, 0x2a, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3]
    const creationCode = initcode(runtime)
    const bytecode = program({ initcode: creationCode, value: 3 })
    const created = ContractAddress.fromCreate({ from: self, nonce: 1n })
    const { actual, state } = compare({
      accounts: [{ address: self, balance: 10n, code: bytecode, nonce: 1n }],
    })

    Evm.assertSuccess(actual)
    expect(actual.output).toBe(Hex.padLeft(created, 32))
    expect(state.getAccount(self)).toMatchObject({ balance: 7n, nonce: 2n })
    expect(state.getAccount(created)).toMatchObject({
      balance: 3n,
      code: Hex.fromBytes(Uint8Array.from(runtime)),
      nonce: 1n,
    })
  })

  test('preserves the creator nonce and revert data when initialization reverts', () => {
    const creationCode = Hex.toBytes('0x60aa5f526001601ffd')
    const bytecode = program({
      initcode: creationCode,
      tail: [0x3d, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3],
      value: 3,
    })
    const created = ContractAddress.fromCreate({ from: self, nonce: 1n })
    const { actual, state } = compare({
      accounts: [{ address: self, balance: 10n, code: bytecode, nonce: 1n }],
    })

    Evm.assertSuccess(actual)
    expect(actual.output).toBe(Hex.fromNumber(1n, { size: 32 }))
    expect(state.getAccount(self)).toMatchObject({ balance: 10n, nonce: 2n })
    expect(state.getAccount(created)).toBeUndefined()
  })

  test('rejects oversized initcode before execution', () => {
    const result = Evm.run({
      bytecode: '0x61c0015f5ff0',
      gas: 100_000n,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 100000n,
        "reason": "initcode-size-exceeded",
        "status": "halted",
      }
    `)
  })

  test('rejects creation in a static frame', () => {
    const result = Evm.run({ bytecode: '0x5f5f5ff0', static: true })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 30000000n,
        "reason": "static-violation",
        "status": "halted",
      }
    `)
  })
})

describe('CREATE2', () => {
  test('derives the address from the salt and initcode hash', () => {
    const creationCode = initcode([0x00])
    const salt = 42n
    const bytecode = program({ initcode: creationCode, opcode: 0xf5, salt })
    const created = ContractAddress.fromCreate2({
      bytecode: creationCode,
      from: self,
      salt: Hex.fromNumber(salt, { size: 32 }),
    })
    const { actual, state } = compare({
      accounts: [{ address: self, balance: 0n, code: bytecode, nonce: 1n }],
    })

    Evm.assertSuccess(actual)
    expect(actual.output).toBe(Hex.padLeft(created, 32))
    expect(state.getAccount(created)?.code).toBe('0x00')
  })

  test('storage-only collisions consume the child allowance', () => {
    const creationCode = initcode([0x00])
    const salt = 7n
    const bytecode = program({ initcode: creationCode, opcode: 0xf5, salt })
    const created = ContractAddress.fromCreate2({
      bytecode: creationCode,
      from: self,
      salt: Hex.fromNumber(salt, { size: 32 }),
    }).toLowerCase()
    const storage = [{ address: created, slot: 1n, value: 2n }]
    const { actual, state } = compare({
      accounts: [
        { address: self, balance: 0n, code: bytecode, nonce: 1n },
        {
          address: created,
          balance: 0n,
          code: new Uint8Array(0),
          nonce: 0n,
        },
      ],
      storage,
    })

    Evm.assertSuccess(actual)
    expect(actual.output).toBe(Hex.fromNumber(0n, { size: 32 }))
    expect(state.getAccount(self)?.nonce).toBe(2n)
    expect(state.getStorage(created as `0x${string}`, 1n)).toBe(2n)
  })
})

describe('code deposit', () => {
  test.each([
    ['oversized runtime', Hex.toBytes('0x6160015ff3')],
    ['reserved 0xef prefix', initcode([0xef])],
  ])(
    '%s fails creation and consumes the child allowance',
    (_, creationCode) => {
      const bytecode = program({ initcode: creationCode })
      const { actual, state } = compare({
        accounts: [{ address: self, balance: 0n, code: bytecode, nonce: 1n }],
      })
      const created = ContractAddress.fromCreate({ from: self, nonce: 1n })

      Evm.assertSuccess(actual)
      expect(actual.output).toBe(Hex.fromNumber(0n, { size: 32 }))
      expect(state.getAccount(self)?.nonce).toBe(2n)
      expect(state.getAccount(created)).toBeUndefined()
    },
  )
})
