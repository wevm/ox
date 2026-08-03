import type { HaltReason } from '../Evm.js'
import type { Analysis } from './analysis.js'
import type { Journal, StateRequest } from './journal.js'

export const MASK256 = (1n << 256n) - 1n
export const STACK_LIMIT = 1024

/** Memory offsets stay below 2^32 — beyond that the quadratic gas formula
 * needs tens of trillions of gas anyway, so the cap is a containment bound,
 * not a semantic one. */
const MEMORY_CAP = 1n << 32n

/** A single instruction in the dispatch table. */
export type Instruction = {
  /** Static gas, charged by the dispatch loop before `handler` runs. */
  gas: bigint
  /** Stack items popped. The loop rejects underflow before `handler` runs. */
  inputs: number
  /** Stack items pushed. The loop rejects overflow before `handler` runs. */
  outputs: number
  handler: (frame: Frame, machine: Machine) => void
}

/** 256-entry dispatch table. `undefined` is an undefined opcode. */
export type Table = readonly (Instruction | undefined)[]

/** Block-level environment the block opcodes read. Internal representation:
 * addresses as lowercase hex, hashes as words. */
export type BlockEnv = {
  baseFee: bigint
  blobBaseFee: bigint
  chainId: bigint
  coinbase: bigint
  gasLimit: bigint
  number: bigint
  prevRandao: bigint
  timestamp: bigint
}

/** One execution frame. */
export type Frame = {
  /** Account whose storage and balance this frame operates on (lowercase hex). */
  address: string
  /** `address` as a stack word. */
  addressWord: bigint
  analysis: Analysis
  caller: bigint
  /** Journal checkpoint taken when this frame was entered; the dispatch loop
   * reverts to it when the frame reverts or halts. */
  checkpoint: number
  code: Uint8Array
  gas: bigint
  input: Uint8Array
  memory: Uint8Array
  /** Logical memory size in 32-byte words (`MSIZE` = this × 32). */
  memoryWords: number
  /** Parent-memory window this frame's output is copied back into. */
  outLength: number
  outOffset: number
  output: Uint8Array | undefined
  pc: number
  /** Output of the frame's most recent completed sub-call (EIP-211). */
  returndata: Uint8Array
  sp: number
  stack: bigint[]
  static: boolean
  value: bigint
  view: DataView
}

/** The whole machine: frame stack plus terminal state. */
export type Machine = {
  blobHashes: readonly bigint[]
  block: BlockEnv
  done: boolean
  frames: Frame[]
  gasPrice: bigint
  halt: HaltReason | undefined
  journal: Journal
  origin: bigint
  /** Set by an instruction that hit unfetched state; the dispatch loop
   * restores its snapshot and surfaces this to the driver. */
  request: StateRequest | undefined
  reverted: boolean
  table: Table
}

/** Signals a state miss. The instruction must return without mutating. */
export function need(machine: Machine, request: StateRequest): void {
  machine.request = request
}

/** Renders a stack word as a lowercase 20-byte address string. */
export function wordToAddress(value: bigint): string {
  return `0x${(value & ((1n << 160n) - 1n)).toString(16).padStart(40, '0')}`
}

/** Parses a lowercase address string into a stack word. */
export function addressToWord(address: string): bigint {
  return BigInt(address)
}

export const emptyBytes = new Uint8Array(0)

export function createFrame(options: {
  address: string
  analysis: Analysis
  caller: bigint
  checkpoint?: number | undefined
  code: Uint8Array
  gas: bigint
  input: Uint8Array
  outLength?: number | undefined
  outOffset?: number | undefined
  static: boolean
  value: bigint
}): Frame {
  const memory = new Uint8Array(0)
  return {
    address: options.address,
    addressWord: addressToWord(options.address),
    analysis: options.analysis,
    caller: options.caller,
    checkpoint: options.checkpoint ?? 0,
    code: options.code,
    gas: options.gas,
    input: options.input,
    memory,
    memoryWords: 0,
    outLength: options.outLength ?? 0,
    outOffset: options.outOffset ?? 0,
    output: undefined,
    pc: 0,
    returndata: emptyBytes,
    sp: 0,
    // Packed with zeroes up front: the elements kind stays PACKED, and reads
    // beneath `sp` are always assigned slots.
    stack: Array.from({ length: STACK_LIMIT }, () => 0n),
    static: options.static,
    value: options.value,
    view: new DataView(memory.buffer),
  }
}

export function pop(frame: Frame): bigint {
  return frame.stack[--frame.sp] as bigint
}

export function push(frame: Frame, value: bigint): void {
  frame.stack[frame.sp++] = value
}

/**
 * Halts the current frame exceptionally, consuming all of its remaining gas.
 */
export function halt(machine: Machine, frame: Frame, reason: HaltReason): void {
  frame.gas = 0n
  machine.halt = reason
  machine.done = true
}

/**
 * Charges memory expansion gas and grows the frame's memory to cover
 * `[offset, offset + length)`. Returns `false` after halting the machine when
 * gas runs out or the offset is beyond the containment cap.
 *
 * A zero-length access never expands, whatever its offset.
 */
export function expandMemory(
  machine: Machine,
  frame: Frame,
  offset: bigint,
  length: bigint,
): boolean {
  if (length === 0n) return true
  const end = offset + length
  const words = (end + 31n) >> 5n
  const current = BigInt(frame.memoryWords)
  if (words > current) {
    // The quadratic term floors per size, not per delta: the charge is
    // C(w2) - C(w1) with C(w) = 3w + ⌊w²/512⌋, so growing a word at a time
    // telescopes to exactly ⌊w²/512⌋ overall. ⌊(w2²-w1²)/512⌋ does not.
    const cost =
      3n * (words - current) +
      (words * words) / 512n -
      (current * current) / 512n
    if (cost > frame.gas) {
      halt(machine, frame, 'out-of-gas')
      return false
    }
    if (end > MEMORY_CAP) {
      halt(machine, frame, 'memory-limit')
      return false
    }
    frame.gas -= cost
    frame.memoryWords = Number(words)
    ensureCapacity(frame, frame.memoryWords * 32)
  }
  return true
}

function ensureCapacity(frame: Frame, bytes: number): void {
  if (frame.memory.length >= bytes) return
  let capacity = frame.memory.length || 1024
  while (capacity < bytes) capacity *= 2
  const memory = new Uint8Array(capacity)
  memory.set(frame.memory)
  frame.memory = memory
  frame.view = new DataView(memory.buffer)
}

/** Reads a 32-byte word from memory. Caller must have expanded first. */
export function readWord(frame: Frame, offset: number): bigint {
  const view = frame.view
  return (
    (view.getBigUint64(offset) << 192n) |
    (view.getBigUint64(offset + 8) << 128n) |
    (view.getBigUint64(offset + 16) << 64n) |
    view.getBigUint64(offset + 24)
  )
}

/** Writes a 32-byte word to memory. Caller must have expanded first. */
export function writeWord(frame: Frame, offset: number, value: bigint): void {
  const view = frame.view
  view.setBigUint64(offset, value >> 192n)
  view.setBigUint64(offset + 8, (value >> 128n) & 0xffffffffffffffffn)
  view.setBigUint64(offset + 16, (value >> 64n) & 0xffffffffffffffffn)
  view.setBigUint64(offset + 24, value & 0xffffffffffffffffn)
}

/**
 * Reads a 32-byte word from an arbitrary byte source, zero-padded past its
 * end. The offset is an unclamped 256-bit operand.
 */
export function loadWordPadded(source: Uint8Array, offset: bigint): bigint {
  if (offset >= BigInt(source.length)) return 0n
  const start = Number(offset)
  let value = 0n
  const end = Math.min(start + 32, source.length)
  for (let i = start; i < end; i++)
    value = (value << 8n) | BigInt(source[i] as number)
  value <<= BigInt(8 * (32 - (end - start)))
  return value
}

/**
 * Copies `length` bytes from `source[offset..]` into frame memory at `dest`,
 * zero-filling everything past the source's end. The source offset is an
 * unclamped 256-bit operand: values at or past the source length — including
 * ones near 2^256 — read only zeroes and must never wrap.
 */
export function copyPadded(
  frame: Frame,
  dest: number,
  source: Uint8Array,
  offset: bigint,
  length: number,
): void {
  const sourceLength = BigInt(source.length)
  if (offset >= sourceLength) {
    frame.memory.fill(0, dest, dest + length)
    return
  }
  const start = Number(offset)
  const available = Math.min(length, source.length - start)
  frame.memory.set(source.subarray(start, start + available), dest)
  if (available < length) frame.memory.fill(0, dest + available, dest + length)
}

/** Position of the most significant set bit (0 for zero). `EXP`'s per-byte
 * gas needs the byte length derived from this; `CLZ` needs it directly. */
export function bitLength(value: bigint): number {
  let bits = 0
  let v = value
  while (v >= 0x100000000n) {
    v >>= 32n
    bits += 32
  }
  while (v > 0n) {
    v >>= 1n
    bits += 1
  }
  return bits
}
