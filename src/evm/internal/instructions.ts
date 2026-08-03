import * as hash from '../../core/internal/hash.js'
import type * as Address from '../../core/Address.js'
import * as ContractAddress from '../../core/ContractAddress.js'
import * as Hex from '../../core/Hex.js'
import * as Hardfork from '../Hardfork.js'
import { analyzed } from './analysis.js'
import * as delegation from './delegation.js'
import * as journal from './journal.js'
import {
  bitLength,
  copyPadded,
  createFrame,
  emptyBytes,
  expandMemory,
  halt,
  loadWordPadded,
  MASK256,
  need,
  pop,
  push,
  readWord,
  wordToAddress,
  writeWord,
  type Frame,
  type Instruction,
  type Machine,
  type Table,
} from './machine.js'

/** keccak256 of empty input — `EXTCODEHASH` of a codeless, non-empty account. */
const KECCAK_EMPTY =
  0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470n

/** Charges EIP-2929 account access (100 warm / 2600 cold) and warms. */
function chargeAccount(f: Frame, m: Machine, address: string): boolean {
  const warm = journal.isWarmAddress(m.journal, address)
  const cost = warm ? 100n : 2600n
  if (cost > f.gas) {
    halt(m, f, 'out-of-gas')
    return false
  }
  f.gas -= cost
  if (!warm) journal.warmAddress(m.journal, address)
  return true
}

function chargeDynamic(f: Frame, m: Machine, cost: bigint): boolean {
  if (cost > f.gas) {
    halt(m, f, 'out-of-gas')
    return false
  }
  f.gas -= cost
  return true
}

const signed = (value: bigint) => BigInt.asIntN(256, value)
const wrap = (value: bigint) => BigInt.asUintN(256, value)
const wordCount = (length: bigint) => (length + 31n) >> 5n

function op(
  gas: bigint,
  inputs: number,
  outputs: number,
  handler: (frame: Frame, machine: Machine) => void,
): Instruction {
  return { gas, handler, inputs, outputs }
}

const tables = new Map<Hardfork.Hardfork, Table>()

/** Returns the dispatch table for a hardfork, built once. */
export function table(hardfork: Hardfork.Hardfork): Table {
  let table = tables.get(hardfork)
  if (!table) {
    table = build(hardfork)
    tables.set(hardfork, table)
  }
  return table
}

function build(hardfork: Hardfork.Hardfork): Table {
  const table = Array.from<Instruction | undefined>({ length: 256 })
  const delegationEnabled = Hardfork.atLeast(hardfork, 'prague')

  // Control

  table[0x00] = op(0n, 0, 0, (f, m) => {
    f.output = undefined
    m.done = true
  })

  table[0xfe] = op(0n, 0, 0, (f, m) => {
    // INVALID is "designated invalid": defined, and consumes all gas.
    halt(m, f, 'invalid-opcode')
  })

  table[0xf3] = op(0n, 2, 0, (f, m) => {
    const offset = pop(f)
    const length = pop(f)
    if (!expandMemory(m, f, offset, length)) return
    const start = Number(offset)
    f.output = f.memory.slice(start, start + Number(length))
    m.done = true
  })

  table[0xfd] = op(0n, 2, 0, (f, m) => {
    const offset = pop(f)
    const length = pop(f)
    if (!expandMemory(m, f, offset, length)) return
    const start = Number(offset)
    f.output = f.memory.slice(start, start + Number(length))
    m.reverted = true
    m.done = true
  })

  // Arithmetic

  table[0x01] = op(3n, 2, 1, (f) => push(f, wrap(pop(f) + pop(f))))
  table[0x02] = op(5n, 2, 1, (f) => push(f, wrap(pop(f) * pop(f))))
  table[0x03] = op(3n, 2, 1, (f) => {
    const a = pop(f)
    const b = pop(f)
    push(f, wrap(a - b))
  })
  table[0x04] = op(5n, 2, 1, (f) => {
    const a = pop(f)
    const b = pop(f)
    push(f, b === 0n ? 0n : a / b)
  })
  table[0x05] = op(5n, 2, 1, (f) => {
    const a = signed(pop(f))
    const b = signed(pop(f))
    // BigInt division truncates toward zero, as SDIV requires. The one case
    // the wrap matters: MIN_INT256 / -1 overflows back to MIN_INT256.
    push(f, b === 0n ? 0n : wrap(a / b))
  })
  table[0x06] = op(5n, 2, 1, (f) => {
    const a = pop(f)
    const b = pop(f)
    push(f, b === 0n ? 0n : a % b)
  })
  table[0x07] = op(5n, 2, 1, (f) => {
    const a = signed(pop(f))
    const b = signed(pop(f))
    // BigInt `%` takes the dividend's sign, as SMOD requires.
    push(f, b === 0n ? 0n : wrap(a % b))
  })
  table[0x08] = op(8n, 3, 1, (f) => {
    const a = pop(f)
    const b = pop(f)
    const m = pop(f)
    // The intermediate sum is 257-bit; reduce before wrapping.
    push(f, m === 0n ? 0n : (a + b) % m)
  })
  table[0x09] = op(8n, 3, 1, (f) => {
    const a = pop(f)
    const b = pop(f)
    const m = pop(f)
    // The intermediate product is 512-bit; reduce before wrapping.
    push(f, m === 0n ? 0n : (a * b) % m)
  })
  table[0x0a] = op(10n, 2, 1, (f, m) => {
    const base = pop(f)
    const exponent = pop(f)
    const byteLength = (bitLength(exponent) + 7) >> 3
    const cost = 50n * BigInt(byteLength)
    if (cost > f.gas) {
      halt(m, f, 'out-of-gas')
      return
    }
    f.gas -= cost
    let result = 1n
    let b = base
    let e = exponent
    while (e > 0n) {
      if (e & 1n) result = wrap(result * b)
      b = wrap(b * b)
      e >>= 1n
    }
    push(f, result)
  })
  table[0x0b] = op(5n, 2, 1, (f) => {
    const size = pop(f)
    const value = pop(f)
    if (size >= 31n) {
      push(f, value)
      return
    }
    const bit = size * 8n + 7n
    const mask = (1n << bit) - 1n
    push(f, (value >> bit) & 1n ? value | (MASK256 ^ mask) : value & mask)
  })

  // Comparison & bitwise

  table[0x10] = op(3n, 2, 1, (f) => {
    const a = pop(f)
    push(f, a < pop(f) ? 1n : 0n)
  })
  table[0x11] = op(3n, 2, 1, (f) => {
    const a = pop(f)
    push(f, a > pop(f) ? 1n : 0n)
  })
  table[0x12] = op(3n, 2, 1, (f) => {
    const a = signed(pop(f))
    push(f, a < signed(pop(f)) ? 1n : 0n)
  })
  table[0x13] = op(3n, 2, 1, (f) => {
    const a = signed(pop(f))
    push(f, a > signed(pop(f)) ? 1n : 0n)
  })
  table[0x14] = op(3n, 2, 1, (f) => {
    push(f, pop(f) === pop(f) ? 1n : 0n)
  })
  table[0x15] = op(3n, 1, 1, (f) => push(f, pop(f) === 0n ? 1n : 0n))
  table[0x16] = op(3n, 2, 1, (f) => push(f, pop(f) & pop(f)))
  table[0x17] = op(3n, 2, 1, (f) => push(f, pop(f) | pop(f)))
  table[0x18] = op(3n, 2, 1, (f) => push(f, pop(f) ^ pop(f)))
  table[0x19] = op(3n, 1, 1, (f) => push(f, MASK256 ^ pop(f)))
  table[0x1a] = op(3n, 2, 1, (f) => {
    const index = pop(f)
    const value = pop(f)
    push(f, index >= 32n ? 0n : (value >> ((31n - index) * 8n)) & 0xffn)
  })
  table[0x1b] = op(3n, 2, 1, (f) => {
    const shift = pop(f)
    const value = pop(f)
    push(f, shift >= 256n ? 0n : wrap(value << shift))
  })
  table[0x1c] = op(3n, 2, 1, (f) => {
    const shift = pop(f)
    const value = pop(f)
    push(f, shift >= 256n ? 0n : value >> shift)
  })
  table[0x1d] = op(3n, 2, 1, (f) => {
    const shift = pop(f)
    const value = signed(pop(f))
    push(f, wrap(value >> (shift >= 256n ? 256n : shift)))
  })
  if (Hardfork.atLeast(hardfork, 'osaka'))
    table[0x1e] = op(5n, 1, 1, (f) => {
      push(f, BigInt(256 - bitLength(pop(f))))
    })

  // Keccak

  table[0x20] = op(30n, 2, 1, (f, m) => {
    const offset = pop(f)
    const length = pop(f)
    const cost = 6n * wordCount(length)
    if (cost > f.gas) {
      halt(m, f, 'out-of-gas')
      return
    }
    f.gas -= cost
    if (!expandMemory(m, f, offset, length)) return
    const start = Number(offset)
    const digest = hash.keccak256(
      f.memory.subarray(start, start + Number(length)),
    )
    push(f, loadWordPadded(digest, 0n))
  })

  // Frame environment

  table[0x30] = op(2n, 0, 1, (f) => push(f, f.addressWord))
  table[0x32] = op(2n, 0, 1, (f, m) => push(f, m.origin))
  table[0x33] = op(2n, 0, 1, (f) => push(f, f.caller))
  table[0x34] = op(2n, 0, 1, (f) => push(f, f.value))
  table[0x35] = op(3n, 1, 1, (f) => push(f, loadWordPadded(f.input, pop(f))))
  table[0x36] = op(2n, 0, 1, (f) => push(f, BigInt(f.input.length)))
  table[0x38] = op(2n, 0, 1, (f) => push(f, BigInt(f.code.length)))
  table[0x37] = op(3n, 3, 0, (f, m) => copy(f, m, f.input))
  table[0x39] = op(3n, 3, 0, (f, m) => copy(f, m, f.code))
  table[0x3a] = op(2n, 0, 1, (f, m) => push(f, m.gasPrice))

  // Returndata (EIP-211)

  table[0x3d] = op(2n, 0, 1, (f) => push(f, BigInt(f.returndata.length)))
  table[0x3e] = op(3n, 3, 0, (f, m) => {
    const dest = pop(f)
    const offset = pop(f)
    const length = pop(f)
    if (!chargeDynamic(f, m, 3n * wordCount(length))) return
    if (!expandMemory(m, f, dest, length)) return
    // Unlike the other copies, a read past the end of the returndata buffer
    // is a halt rather than a zero-fill — a zero-length read included.
    if (offset + length > BigInt(f.returndata.length)) {
      halt(m, f, 'returndata-out-of-bounds')
      return
    }
    if (length !== 0n) {
      const start = Number(offset)
      f.memory.set(
        f.returndata.subarray(start, start + Number(length)),
        Number(dest),
      )
    }
  })

  // Account state

  table[0x31] = op(0n, 1, 1, (f, m) => {
    const address = wordToAddress(pop(f))
    const account = journal.getAccount(m.journal, address)
    if (account === undefined) {
      need(m, { address, kind: 'account' })
      return
    }
    if (!chargeAccount(f, m, address)) return
    push(f, account ? account.balance : 0n)
  })

  table[0x3b] = op(0n, 1, 1, (f, m) => {
    const address = wordToAddress(pop(f))
    const account = journal.getAccount(m.journal, address)
    if (account === undefined) {
      need(m, { address, kind: 'account' })
      return
    }
    const code = journal.getCode(m.journal, address)
    if (code === undefined) {
      need(m, { address, kind: 'code' })
      return
    }
    if (!chargeAccount(f, m, address)) return
    push(f, BigInt(code.length))
  })

  table[0x3c] = op(0n, 4, 0, (f, m) => {
    const address = wordToAddress(pop(f))
    const dest = pop(f)
    const offset = pop(f)
    const length = pop(f)
    const account = journal.getAccount(m.journal, address)
    if (account === undefined) {
      need(m, { address, kind: 'account' })
      return
    }
    const code = journal.getCode(m.journal, address)
    if (code === undefined) {
      need(m, { address, kind: 'code' })
      return
    }
    if (!chargeAccount(f, m, address)) return
    if (!chargeDynamic(f, m, 3n * wordCount(length))) return
    if (!expandMemory(m, f, dest, length)) return
    if (length !== 0n) copyPadded(f, Number(dest), code, offset, Number(length))
  })

  table[0x3f] = op(0n, 1, 1, (f, m) => {
    const address = wordToAddress(pop(f))
    const account = journal.getAccount(m.journal, address)
    if (account === undefined) {
      need(m, { address, kind: 'account' })
      return
    }
    // Emptiness (EIP-161) needs the code dimension resolved when balance and
    // nonce are both zero; hashing needs the code itself.
    if (account !== null && account.hasCode === undefined) {
      need(m, { address, kind: 'code' })
      return
    }
    if (!chargeAccount(f, m, address)) return
    if (account === null || journal.isEmpty(account)) push(f, 0n)
    else if (!account.hasCode) push(f, KECCAK_EMPTY)
    else push(f, journal.getCodeHash(m.journal, address))
  })

  table[0x47] = op(5n, 0, 1, (f, m) => {
    const account = journal.getAccount(m.journal, f.address)
    if (account === undefined) {
      need(m, { address: f.address, kind: 'account' })
      return
    }
    push(f, account ? account.balance : 0n)
  })

  // Block environment

  table[0x40] = op(20n, 1, 1, (f, m) => {
    const number = pop(f)
    // Only the previous 256 blocks are addressable; everything else is 0.
    if (number >= m.block.number || number + 256n < m.block.number) {
      push(f, 0n)
      return
    }
    const hash_ = journal.getBlockHash(m.journal, number)
    if (hash_ === undefined) {
      need(m, { kind: 'blockHash', number })
      return
    }
    push(f, hash_)
  })
  table[0x41] = op(2n, 0, 1, (f, m) => push(f, m.block.coinbase))
  table[0x42] = op(2n, 0, 1, (f, m) => push(f, m.block.timestamp))
  table[0x43] = op(2n, 0, 1, (f, m) => push(f, m.block.number))
  table[0x44] = op(2n, 0, 1, (f, m) => push(f, m.block.prevRandao))
  table[0x45] = op(2n, 0, 1, (f, m) => push(f, m.block.gasLimit))
  table[0x46] = op(2n, 0, 1, (f, m) => push(f, m.block.chainId))
  table[0x48] = op(2n, 0, 1, (f, m) => push(f, m.block.baseFee))
  table[0x49] = op(3n, 1, 1, (f, m) => {
    const index = pop(f)
    push(
      f,
      index < BigInt(m.blobHashes.length)
        ? (m.blobHashes[Number(index)] as bigint)
        : 0n,
    )
  })
  table[0x4a] = op(2n, 0, 1, (f, m) => push(f, m.block.blobBaseFee))

  // Storage

  table[0x54] = op(0n, 1, 1, (f, m) => {
    const slot = pop(f)
    const value = journal.getStorage(m.journal, f.address, slot)
    if (value === undefined) {
      need(m, { address: f.address, kind: 'storage', slot })
      return
    }
    const warm = journal.isWarmSlot(m.journal, f.address, slot)
    if (!chargeDynamic(f, m, warm ? 100n : 2100n)) return
    if (!warm) journal.warmSlot(m.journal, f.address, slot)
    push(f, value)
  })

  table[0x55] = op(0n, 2, 0, (f, m) => {
    if (f.static) {
      halt(m, f, 'static-violation')
      return
    }
    // EIP-2200 sentry: leave headroom for the call stipend.
    if (f.gas <= 2300n) {
      halt(m, f, 'out-of-gas')
      return
    }
    const slot = pop(f)
    const value = pop(f)
    const current = journal.getStorage(m.journal, f.address, slot)
    if (current === undefined) {
      need(m, { address: f.address, kind: 'storage', slot })
      return
    }
    const original = journal.getOriginal(m.journal, f.address, slot) as bigint
    const warm = journal.isWarmSlot(m.journal, f.address, slot)

    let cost = warm ? 0n : 2100n
    if (value === current) cost += 100n
    else if (current === original) cost += original === 0n ? 20_000n : 2900n
    else cost += 100n
    if (!chargeDynamic(f, m, cost)) return
    if (!warm) journal.warmSlot(m.journal, f.address, slot)

    if (value !== current) {
      if (current === original) {
        if (original !== 0n && value === 0n) journal.addRefund(m.journal, 4800n)
      } else {
        if (original !== 0n) {
          if (current === 0n) journal.addRefund(m.journal, -4800n)
          else if (value === 0n) journal.addRefund(m.journal, 4800n)
        }
        if (value === original)
          journal.addRefund(m.journal, original === 0n ? 19_900n : 2800n)
      }
      journal.setStorage(m.journal, f.address, slot, value)
    }
  })

  table[0x5c] = op(100n, 1, 1, (f, m) => {
    push(f, journal.getTransient(m.journal, f.address, pop(f)))
  })

  table[0x5d] = op(100n, 2, 0, (f, m) => {
    if (f.static) {
      halt(m, f, 'static-violation')
      return
    }
    const slot = pop(f)
    const value = pop(f)
    journal.setTransient(m.journal, f.address, slot, value)
  })

  // Logs

  for (let topics = 0; topics <= 4; topics++)
    table[0xa0 + topics] = op(375n, 2 + topics, 0, (f, m) => {
      if (f.static) {
        halt(m, f, 'static-violation')
        return
      }
      const offset = pop(f)
      const length = pop(f)
      const list: bigint[] = []
      for (let i = 0; i < topics; i++) list.push(pop(f))
      if (!chargeDynamic(f, m, 375n * BigInt(topics) + 8n * length)) return
      if (!expandMemory(m, f, offset, length)) return
      const start = Number(offset)
      journal.addLog(m.journal, {
        address: f.address,
        data: f.memory.slice(start, start + Number(length)),
        topics: list,
      })
    })

  // Selfdestruct (EIP-6780: destruction only when created in this transaction)

  table[0xff] = op(5000n, 1, 0, (f, m) => {
    if (f.static) {
      halt(m, f, 'static-violation')
      return
    }
    const beneficiary = wordToAddress(pop(f))
    const own = journal.getAccount(m.journal, f.address)
    if (own === undefined) {
      need(m, { address: f.address, kind: 'account' })
      return
    }
    const target = journal.getAccount(m.journal, beneficiary)
    if (target === undefined) {
      need(m, { address: beneficiary, kind: 'account' })
      return
    }
    const balance = own ? own.balance : 0n
    const warm = journal.isWarmAddress(m.journal, beneficiary)
    let cost = warm ? 0n : 2600n
    if (balance !== 0n && target === null) cost += 25_000n
    if (!chargeDynamic(f, m, cost)) return
    if (!warm) journal.warmAddress(m.journal, beneficiary)

    if (beneficiary !== f.address && balance !== 0n) {
      journal.setBalance(m.journal, f.address, 0n)
      const after = journal.getAccount(m.journal, beneficiary)
      journal.setBalance(
        m.journal,
        beneficiary,
        (after ? after.balance : 0n) + balance,
      )
    }
    if (journal.isCreated(m.journal, f.address)) {
      journal.setBalance(m.journal, f.address, 0n)
      journal.markSelfdestructed(m.journal, f.address)
    }
    m.done = true
  })

  // Calls

  table[0xf0] = createOp(0xf0)
  table[0xf1] = callOp(0xf1, delegationEnabled)
  table[0xf2] = callOp(0xf2, delegationEnabled)
  table[0xf4] = callOp(0xf4, delegationEnabled)
  table[0xf5] = createOp(0xf5)
  table[0xfa] = callOp(0xfa, delegationEnabled)

  // Stack, memory & flow

  table[0x50] = op(2n, 1, 0, (f) => {
    f.sp--
  })
  table[0x51] = op(3n, 1, 1, (f, m) => {
    const offset = pop(f)
    if (!expandMemory(m, f, offset, 32n)) return
    push(f, readWord(f, Number(offset)))
  })
  table[0x52] = op(3n, 2, 0, (f, m) => {
    const offset = pop(f)
    const value = pop(f)
    if (!expandMemory(m, f, offset, 32n)) return
    writeWord(f, Number(offset), value)
  })
  table[0x53] = op(3n, 2, 0, (f, m) => {
    const offset = pop(f)
    const value = pop(f)
    if (!expandMemory(m, f, offset, 1n)) return
    f.memory[Number(offset)] = Number(value & 0xffn)
  })
  table[0x56] = op(8n, 1, 0, (f, m) => jump(f, m, pop(f)))
  table[0x57] = op(10n, 2, 0, (f, m) => {
    const destination = pop(f)
    if (pop(f) !== 0n) jump(f, m, destination)
  })
  table[0x58] = op(2n, 0, 1, (f) => push(f, BigInt(f.pc - 1)))
  table[0x59] = op(2n, 0, 1, (f) => push(f, BigInt(f.memoryWords * 32)))
  table[0x5a] = op(2n, 0, 1, (f) => push(f, f.gas))
  table[0x5b] = op(1n, 0, 0, () => {})
  table[0x5e] = op(3n, 3, 0, (f, m) => {
    const dest = pop(f)
    const source = pop(f)
    const length = pop(f)
    const cost = 3n * wordCount(length)
    if (cost > f.gas) {
      halt(m, f, 'out-of-gas')
      return
    }
    f.gas -= cost
    if (!expandMemory(m, f, dest < source ? source : dest, length)) return
    f.memory.copyWithin(
      Number(dest),
      Number(source),
      Number(source) + Number(length),
    )
  })

  // PUSH, DUP, SWAP

  table[0x5f] = op(2n, 0, 1, (f) => push(f, 0n))
  for (let n = 1; n <= 32; n++)
    table[0x5f + n] = op(3n, 0, 1, (f) => {
      const start = f.pc
      const end = start + n
      let value = 0n
      const available = Math.min(end, f.code.length)
      for (let i = start; i < available; i++)
        value = (value << 8n) | BigInt(f.code[i] as number)
      // A truncated immediate is right-zero-padded, matching analysis.
      value <<= BigInt(8 * (end - available))
      push(f, value)
      f.pc = end
    })
  for (let n = 1; n <= 16; n++)
    table[0x7f + n] = op(3n, n, n + 1, (f) => {
      push(f, f.stack[f.sp - n] as bigint)
    })
  for (let n = 1; n <= 16; n++)
    table[0x8f + n] = op(3n, n + 1, n + 1, (f) => {
      const top = f.stack[f.sp - 1] as bigint
      f.stack[f.sp - 1] = f.stack[f.sp - 1 - n] as bigint
      f.stack[f.sp - 1 - n] = top
    })

  return table
}

const callDepthLimit = 1024
const maxInitcodeSize = 49_152n
const maxNonce = (1n << 64n) - 1n

function createOp(opcode: number): Instruction {
  const create2 = opcode === 0xf5
  return op(32_000n, create2 ? 4 : 3, 1, (f, m) => {
    const value = pop(f)
    const offset = pop(f)
    const length = pop(f)
    const salt = create2 ? pop(f) : 0n

    if (f.static) {
      halt(m, f, 'static-violation')
      return
    }
    if (length > maxInitcodeSize) {
      halt(m, f, 'initcode-size-exceeded')
      return
    }

    const own = journal.getAccount(m.journal, f.address)
    if (own === undefined) {
      need(m, { address: f.address, kind: 'account' })
      return
    }
    const initcode = readMemoryPadded(f, offset, Number(length))
    const ownBalance = own ? own.balance : 0n
    const ownNonce = own ? own.nonce : 0n
    const canCreate =
      ownBalance >= value &&
      ownNonce < maxNonce &&
      m.frames.length <= callDepthLimit

    const address = canCreate
      ? (create2
          ? ContractAddress.fromCreate2({
              bytecodeHash: hash.keccak256(initcode),
              from: f.address as Address.Address,
              salt: Hex.fromNumber(salt, { size: 32 }),
            })
          : ContractAddress.fromCreate({
              from: f.address as Address.Address,
              nonce: ownNonce,
            })
        ).toLowerCase()
      : undefined

    if (address !== undefined) {
      const target = journal.getAccount(m.journal, address)
      if (target === undefined) {
        need(m, { address, kind: 'account' })
        return
      }
      if (target !== null && target.hasCode === undefined) {
        need(m, { address, kind: 'code' })
        return
      }
    }

    const words = wordCount(length)
    if (!chargeDynamic(f, m, 2n * words + (create2 ? 6n * words : 0n))) return
    if (!expandMemory(m, f, offset, length)) return
    const childGas = f.gas - f.gas / 64n
    f.gas -= childGas
    f.returndata = emptyBytes

    if (address === undefined) {
      f.gas += childGas
      push(f, 0n)
      return
    }

    journal.setNonce(m.journal, f.address, ownNonce + 1n)
    journal.warmAddress(m.journal, address)
    const checkpoint = journal.checkpoint(m.journal)
    const target = journal.getAccount(
      m.journal,
      address,
    ) as journal.Account | null
    if (
      target !== null &&
      (target.nonce !== 0n || target.hasCode || target.hasStorage)
    ) {
      push(f, 0n)
      return
    }

    journal.setBalance(m.journal, f.address, ownBalance - value)
    journal.setBalance(
      m.journal,
      address,
      (target ? target.balance : 0n) + value,
    )
    journal.setNonce(m.journal, address, 1n)
    journal.markCreated(m.journal, address)
    m.frames.push(
      createFrame({
        address,
        analysis: analyzed(initcode).analysis,
        caller: f.addressWord,
        checkpoint,
        code: initcode,
        createdAddress: address,
        gas: childGas,
        input: emptyBytes,
        static: false,
        value,
      }),
    )
  })
}

// One handler for CALL (0xf1), CALLCODE (0xf2), DELEGATECALL (0xf4), and
// STATICCALL (0xfa). Only CALL and CALLCODE take a value operand, and only
// CALL moves it — CALLCODE runs foreign code in the caller's own account, so
// its value never leaves and is there for the stipend and CALLVALUE.
function callOp(opcode: number, delegationEnabled: boolean): Instruction {
  const hasValue = opcode === 0xf1 || opcode === 0xf2
  return op(0n, hasValue ? 7 : 6, 1, (f, m) => {
    const gasArg = pop(f)
    const to = wordToAddress(pop(f))
    const value = hasValue ? pop(f) : 0n
    const inOffset = pop(f)
    const inLength = pop(f)
    const outOffset = pop(f)
    const outLength = pop(f)

    // A static frame may not move value — but only CALL moves any.
    if (opcode === 0xf1 && f.static && value !== 0n) {
      halt(m, f, 'static-violation')
      return
    }

    // Resolve every state dimension before any mutation (restart discipline):
    // the callee's account and code, and the caller's account when value is
    // at stake. Fetching the code also settles `hasCode`, which the EIP-161
    // emptiness check below reads.
    const callee = journal.getAccount(m.journal, to)
    if (callee === undefined) {
      need(m, { address: to, kind: 'account' })
      return
    }
    let code = journal.getCode(m.journal, to)
    if (code === undefined) {
      need(m, { address: to, kind: 'code' })
      return
    }
    const delegatedTo = delegationEnabled
      ? delegation.getAddress(code)
      : undefined
    if (delegatedTo) {
      // EIP-7702 follows exactly one designator, so delegated code is never
      // parsed again even when it is itself a designator.
      const delegate = journal.getAccount(m.journal, delegatedTo)
      if (delegate === undefined) {
        need(m, { address: delegatedTo, kind: 'account' })
        return
      }
      code = journal.getCode(m.journal, delegatedTo)
      if (code === undefined) {
        need(m, { address: delegatedTo, kind: 'code' })
        return
      }
    }
    const own = value !== 0n ? journal.getAccount(m.journal, f.address) : null
    if (own === undefined) {
      need(m, { address: f.address, kind: 'account' })
      return
    }

    // Gas assembly, in consensus order: memory expansion over the input and
    // output windows, target access (EIP-2929), the value-transfer and
    // new-account surcharges, then the 63/64 cap (EIP-150) on what remains.
    if (!expandMemory(m, f, inOffset, inLength)) return
    if (!expandMemory(m, f, outOffset, outLength)) return
    if (!chargeAccount(f, m, to)) return
    if (delegatedTo && !chargeAccount(f, m, delegatedTo)) return
    if (value !== 0n) {
      let cost = 9000n
      // A value-bearing CALL to a dead account (EIP-161 empty) pays to
      // bring it into existence.
      if (opcode === 0xf1 && (callee === null || journal.isEmpty(callee)))
        cost += 25_000n
      if (!chargeDynamic(f, m, cost)) return
    }
    const allowed = f.gas - f.gas / 64n
    let childGas = gasArg < allowed ? gasArg : allowed
    f.gas -= childGas
    // The stipend rides on top of the cap and is not deducted from the
    // caller.
    if (value !== 0n) childGas += 2300n

    // Every call replaces the returndata buffer, including one that never
    // starts (EIP-211).
    f.returndata = emptyBytes

    // An unfunded or too-deep call fails without a child frame, refunding
    // the full allowance — stipend included. The top frame sits at semantic
    // depth 0 and `frames.length` is the child's would-be depth, which may
    // reach the limit itself: only calls made from that deepest frame fail.
    const ownBalance = own ? own.balance : 0n
    if (ownBalance < value || m.frames.length > callDepthLimit) {
      f.gas += childGas
      push(f, 0n)
      return
    }

    const checkpoint = journal.checkpoint(m.journal)
    if (opcode === 0xf1 && value !== 0n) {
      journal.setBalance(m.journal, f.address, ownBalance - value)
      // Re-read after the debit so a self-call nets to zero.
      const target = journal.getAccount(m.journal, to)
      journal.setBalance(m.journal, to, (target ? target.balance : 0n) + value)
    }

    // DELEGATECALL and CALLCODE run the callee's code against the caller's
    // own address and storage; DELEGATECALL also inherits caller and value.
    m.frames.push(
      createFrame({
        address: opcode === 0xf1 || opcode === 0xfa ? to : f.address,
        analysis: analyzed(code).analysis,
        caller: opcode === 0xf4 ? f.caller : f.addressWord,
        checkpoint,
        code,
        gas: childGas,
        input:
          inLength === 0n
            ? emptyBytes
            : f.memory.subarray(
                Number(inOffset),
                Number(inOffset) + Number(inLength),
              ),
        outLength: outLength === 0n ? 0 : Number(outLength),
        outOffset: outLength === 0n ? 0 : Number(outOffset),
        static: f.static || opcode === 0xfa,
        value: opcode === 0xf4 ? f.value : value,
      }),
    )
  })
}

function copy(f: Frame, m: Machine, source: Uint8Array): void {
  const dest = pop(f)
  const offset = pop(f)
  const length = pop(f)
  const cost = 3n * wordCount(length)
  if (cost > f.gas) {
    halt(m, f, 'out-of-gas')
    return
  }
  f.gas -= cost
  if (!expandMemory(m, f, dest, length)) return
  if (length !== 0n) copyPadded(f, Number(dest), source, offset, Number(length))
}

function readMemoryPadded(
  frame: Frame,
  offset: bigint,
  length: number,
): Uint8Array {
  const output = new Uint8Array(length)
  const logicalLength = frame.memoryWords * 32
  if (length === 0 || offset >= BigInt(logicalLength)) return output
  const start = Number(offset)
  output.set(
    frame.memory.subarray(start, Math.min(start + length, logicalLength)),
  )
  return output
}

function jump(f: Frame, m: Machine, destination: bigint): void {
  if (
    destination >= BigInt(f.code.length) ||
    f.analysis.jumpdests[Number(destination)] !== 1
  ) {
    halt(m, f, 'invalid-jump')
    return
  }
  f.pc = Number(destination)
}
