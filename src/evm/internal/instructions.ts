import * as hash from '../../core/internal/hash.js'
import * as Hardfork from '../Hardfork.js'
import {
  bitLength,
  copyPadded,
  expandMemory,
  halt,
  loadWordPadded,
  MASK256,
  pop,
  push,
  readWord,
  writeWord,
  type Frame,
  type Instruction,
  type Machine,
  type Table,
} from './machine.js'

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

  table[0x35] = op(3n, 1, 1, (f) => push(f, loadWordPadded(f.input, pop(f))))
  table[0x36] = op(2n, 0, 1, (f) => push(f, BigInt(f.input.length)))
  table[0x38] = op(2n, 0, 1, (f) => push(f, BigInt(f.code.length)))
  table[0x37] = op(3n, 3, 0, (f, m) => copy(f, m, f.input))
  table[0x39] = op(3n, 3, 0, (f, m) => copy(f, m, f.code))

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
