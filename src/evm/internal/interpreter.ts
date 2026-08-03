import { halt, STACK_LIMIT, type Frame, type Machine } from './machine.js'

/**
 * Runs the machine's current frame to completion.
 *
 * The loop owns every check the opcode handlers rely on: static gas, stack
 * underflow, and stack overflow are validated here from the instruction's
 * metadata, so handlers pop and push unchecked. Dynamic gas (memory expansion,
 * per-word costs) is charged inside handlers.
 *
 * M2 grows this into the resumable trampoline: the loop will snapshot
 * `pc`/`sp`/`gas` per instruction and surface state-miss requests to a driver.
 */
export function execute(machine: Machine): void {
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
    frame.gas -= instruction.gas
    if (frame.sp < instruction.inputs) {
      halt(machine, frame, 'stack-underflow')
      break
    }
    if (frame.sp - instruction.inputs + instruction.outputs > STACK_LIMIT) {
      halt(machine, frame, 'stack-overflow')
      break
    }
    frame.pc = pc + 1
    instruction.handler(frame, machine)
  }
}
