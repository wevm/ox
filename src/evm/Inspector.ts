import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type * as codec from './internal/codec.js'

/**
 * A recorded execution.
 *
 * Events keep the order the engine produced them in, one per hook it called.
 * Nothing is interpreted: {@link ox#Inspector.(tree:function)} builds the call
 * tree from this, so the shape can change without a new engine.
 */
export type Trace = codec.Trace

/** One recorded hook call. */
export type Event = codec.TraceEvent

/** What an inspector records. */
export type Options = {
  /**
   * Largest trace to keep, in bytes.
   *
   * Recording stops at the limit and the trace reports `truncated`, keeping what
   * ran first: a trace is always a prefix of the execution, never a stream with
   * gaps. Execution is unaffected either way.
   *
   * @default 1_048_576
   */
  limit?: number | undefined
  /** Records memory size on each instruction. Requires `steps`. */
  memory?: boolean | undefined
  /** Records the stack on each instruction. Requires `steps`. */
  stack?: boolean | undefined
  /**
   * Records every instruction.
   *
   * Off by default, and worth leaving off: a mainnet transaction runs millions of
   * instructions, where calls, creates, and logs number in the tens. Turn this on
   * to debug a specific execution, not to observe one in production.
   *
   * @default false
   */
  steps?: boolean | undefined
}

/**
 * A call or create in the tree, with whatever it did inside it.
 *
 * The shape {@link ox#Inspector.(tree:function)} produces.
 */
export type Frame = {
  /** Account that made the call. */
  caller: Address.Address
  /** Calls and creates this frame made, in order. */
  calls: readonly Frame[]
  /** Account whose code ran. */
  codeAddress: Address.Address
  /** Address a create deployed, when it succeeded. */
  createdAddress?: Address.Address | undefined
  /** How deep this frame sits. */
  depth: number
  /** Account the call was addressed to. */
  destination: Address.Address
  /** Gas the frame was given. */
  gasLimit: bigint
  /** Gas the frame consumed. Absent when the trace ended before it returned. */
  gasSpent?: bigint | undefined
  /** Calldata, or initcode for a create. */
  input: Hex.Hex
  /**
   * Which instruction produced this frame.
   *
   * `'unknown'` for a kind a later evm2 revision added, which this artifact
   * reports rather than folding into `'call'`.
   */
  kind: (typeof codec.messageKinds)[number] | typeof codec.unknownMessageKind
  /** Logs this frame emitted directly. */
  logs: readonly {
    address: Address.Address
    data: Hex.Hex
    topics: readonly Hex.Hex[]
  }[]
  /** Returned data, or revert data. Absent when the frame never returned. */
  output?: Hex.Hex | undefined
  /** Accounts this frame self-destructed, with where their balance went. */
  selfdestructs: readonly {
    contract: Address.Address
    target: Address.Address
    value: bigint
  }[]
  /** Why the frame stopped, as evm2's discriminant. Absent when unfinished. */
  stop?: number | undefined
  /** Value transferred. */
  value: bigint
}

/**
 * Builds the call tree a trace describes.
 *
 * The engine records a flat sequence; nesting is recovered here from the order of
 * the call and return events. A truncated trace yields the frames it captured,
 * with the unfinished ones missing their output and gas.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, Inspector } from 'ox/evm'
 *
 * Evm.setInspector(evm, {})
 * const result = Evm.callTx(evm, transaction)
 *
 * const [root] = Inspector.tree(result.trace)
 * root.calls.length
 * ```
 *
 * @param trace - Recorded execution.
 * @returns The frames the trace describes, outermost first.
 */
export function tree(trace: Trace | undefined): readonly Frame[] {
  if (!trace) return []

  const roots: Frame[] = []
  // Frames still open, innermost last. A return event closes the last one.
  const open: Frame[] = []

  const current = () => open[open.length - 1]

  for (const event of trace.events) {
    if (event.kind === 'call' || event.kind === 'create') {
      const frame: Frame = {
        caller: event.caller,
        calls: [],
        codeAddress: event.codeAddress,
        depth: event.depth,
        destination: event.destination,
        gasLimit: event.gasLimit,
        input: event.input,
        kind: event.messageKind,
        logs: [],
        selfdestructs: [],
        value: event.value,
      }
      const parent = current()
      if (parent) (parent.calls as Frame[]).push(frame)
      else roots.push(frame)
      open.push(frame)
      continue
    }

    if (event.kind === 'callEnd' || event.kind === 'createEnd') {
      const frame = open.pop()
      if (!frame) continue
      Object.assign(frame, {
        gasSpent: event.gasSpent,
        output: event.output,
        stop: event.stop,
        ...(event.createdAddress
          ? { createdAddress: event.createdAddress }
          : {}),
      })
      continue
    }

    // Logs and self-destructs belong to whichever frame is running.
    const frame = current()
    if (!frame) continue
    if (event.kind === 'log')
      (frame.logs as Frame['logs'][number][]).push({
        address: event.address,
        data: event.data,
        topics: event.topics,
      })
    else if (event.kind === 'selfdestruct')
      (frame.selfdestructs as Frame['selfdestructs'][number][]).push({
        contract: event.contract,
        target: event.target,
        value: event.value,
      })
  }

  return roots
}

/**
 * Returns the instructions a trace recorded, in order.
 *
 * Empty unless the inspector recorded steps.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Inspector } from 'ox/evm'
 *
 * const steps = Inspector.steps(result.trace)
 * steps[0]?.opcode
 * ```
 *
 * @param trace - Recorded execution.
 * @returns Each instruction, with its program counter, gas, and stack.
 */
export function steps(
  trace: Trace | undefined,
): readonly Extract<Event, { kind: 'step' }>[] {
  if (!trace) return []
  return trace.events.filter(
    (event): event is Extract<Event, { kind: 'step' }> => event.kind === 'step',
  )
}
