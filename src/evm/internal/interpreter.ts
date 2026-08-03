import type { StateRequest } from './journal.js'
import { halt, STACK_LIMIT, type Frame, type Machine } from './machine.js'

/**
 * Runs the machine's current frame until it halts or hits unfetched state.
 *
 * The loop owns every check the opcode handlers rely on: static gas, stack
 * underflow, and stack overflow are validated here from the instruction's
 * metadata, so handlers pop and push unchecked. Dynamic gas (memory expansion,
 * per-word costs, warm/cold access) is charged inside handlers.
 *
 * Restartability is structural: the loop snapshots `pc`, `sp`, and `gas`
 * before dispatching, and when an instruction reports a state miss it restores
 * the snapshot and surfaces the {@link StateRequest}. The driver seeds the
 * journal and calls back in; the same instruction re-executes against a warm
 * cache. Instructions must not mutate the journal, memory, or logs before
 * their last possible miss.
 */
export function execute(machine: Machine): StateRequest | undefined {
  const frame = machine.frames[machine.frames.length - 1] as Frame
  const code = frame.code
  const table = machine.table
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
  }
  return undefined
}
