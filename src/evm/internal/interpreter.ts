import * as journal from './journal.js'
import type { StateRequest } from './journal.js'
import {
  emptyBytes,
  halt,
  push,
  STACK_LIMIT,
  type Frame,
  type Machine,
} from './machine.js'

/**
 * Runs the machine's frame stack until the bottom frame halts or execution
 * hits unfetched state.
 *
 * The loop owns every check the opcode handlers rely on: static gas, stack
 * underflow, and stack overflow are validated here from the instruction's
 * metadata, so handlers pop and push unchecked. Dynamic gas (memory expansion,
 * per-word costs, warm/cold access) is charged inside handlers.
 *
 * A call or creation instruction pushes a child frame and returns; the loop
 * notices the deeper stack and dispatches the child next. When a frame other
 * than the bottom one completes, {@link resolve} folds its outcome into the
 * parent.
 *
 * Restartability is structural: the loop snapshots `pc`, `sp`, and `gas`
 * before dispatching, and when an instruction reports a state miss it restores
 * the snapshot and surfaces the {@link StateRequest}. The driver seeds the
 * journal and calls back in; the same instruction re-executes against a warm
 * cache. Instructions must not mutate the journal, memory, or logs before
 * their last possible miss.
 */
export function execute(machine: Machine): StateRequest | undefined {
  const frames = machine.frames
  const table = machine.table
  while (true) {
    const depth = frames.length
    const frame = frames[depth - 1] as Frame
    const code = frame.code
    while (!machine.done) {
      const pc = frame.pc
      if (pc >= code.length) {
        // Running off the end of the code is an implicit STOP.
        machine.done = true
        break
      }
      const opcode = code[pc] as number
      const instruction = table[opcode]
      if (instruction === undefined) {
        halt(machine, frame, 'invalid-opcode')
        break
      }
      if (instruction.gas > frame.gas) {
        halt(machine, frame, 'out-of-gas')
        break
      }
      const gas = frame.gas
      frame.gas = gas - instruction.gas
      const sp = frame.sp
      if (sp < instruction.inputs) {
        halt(machine, frame, 'stack-underflow')
        break
      }
      if (sp - instruction.inputs + instruction.outputs > STACK_LIMIT) {
        halt(machine, frame, 'stack-overflow')
        break
      }
      frame.pc = pc + 1
      instruction.handler(frame, machine)
      if (machine.request) {
        // State miss: undo this instruction entirely and hand the request to
        // the driver. Re-entry restarts at the same pc with a seeded cache.
        frame.pc = pc
        frame.sp = sp
        frame.gas = gas
        const request = machine.request
        machine.request = undefined
        return request
      }
      if (frames.length !== depth) break
    }
    if (!machine.done) continue // a call pushed a child frame — run it
    if (depth === 1) return undefined
    resolve(machine)
  }
}

/**
 * Folds a completed child frame's outcome into its parent. The parent's
 * memory was expanded over the output window before the child ran, and the
 * dispatch loop validated the success word's stack slot when it dispatched
 * the call instruction, so both writes here are unchecked.
 */
function resolve(machine: Machine): void {
  const child = machine.frames.pop() as Frame
  const parent = machine.frames[machine.frames.length - 1] as Frame
  let success = machine.halt === undefined && !machine.reverted
  // A revert or halt unwinds the child's journal writes, its value transfer
  // included. REVERT carries output back (EIP-140); an exceptional halt
  // carries none and has already consumed the child's gas.
  const output =
    machine.halt === undefined ? (child.output ?? emptyBytes) : emptyBytes

  if (child.createdAddress !== undefined && success) {
    const depositCost = 200n * BigInt(output.length)
    if (
      output.length > 24_576 ||
      output[0] === 0xef ||
      depositCost > child.gas
    ) {
      child.gas = 0n
      success = false
    } else {
      child.gas -= depositCost
      journal.setCode(machine.journal, child.createdAddress, output)
    }
  }

  if (!success) journal.revert(machine.journal, child.checkpoint)
  parent.gas += child.gas
  if (child.createdAddress !== undefined) {
    // CREATE exposes only REVERT data through the returndata buffer. Runtime
    // code is deposited in state and the created address goes on the stack.
    parent.returndata = machine.reverted ? output : emptyBytes
    push(parent, success ? BigInt(child.createdAddress) : 0n)
  } else {
    parent.returndata = output
    const length = Math.min(child.outLength, output.length)
    if (length > 0)
      parent.memory.set(output.subarray(0, length), child.outOffset)
    push(parent, success ? 1n : 0n)
  }
  machine.done = false
  machine.halt = undefined
  machine.reverted = false
}
