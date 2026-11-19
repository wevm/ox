import { fc } from '@fast-check/vitest'
import { type AbiEvent, AbiParameters, Hash, Hex } from 'ox'
import { arbitraryHexOfByteLength } from './bytes.js'
import { arbitraryAbiParameter, arbitraryAbiValueFor } from './abi.js'

/** Event names. The set is small, so ABIs hold overloads. */
export const eventNames = ['Approval', 'Bar', 'Foo', 'Transfer'] as const

/** An event input, and the value a log carries for it. */
export type EventInput = {
  indexed: boolean
  name: string
  parameter: AbiParameters.Parameter
  value: unknown
}

/** An event, and the input values of one log it emits. */
export type EventCase = {
  abiEvent: AbiEvent.AbiEvent
  inputs: readonly EventInput[]
}

/** A log: its topics and data. */
export type Log = { data: Hex.Hex; topics: readonly Hex.Hex[] }

/**
 * Generates an event with up to five inputs of any ABI type, and a value for
 * each input. Events can be anonymous, and their inputs can be named, unnamed,
 * or a mix of both.
 */
export function arbitraryEventCase(
  options: { anonymous?: boolean | undefined } = {},
): fc.Arbitrary<EventCase> {
  return fc
    .record({
      anonymous:
        options.anonymous === undefined
          ? fc.boolean()
          : fc.constant(options.anonymous),
      inputs: fc.array(
        fc.record({
          indexed: fc.boolean(),
          named: fc.boolean(),
          parameter: arbitraryAbiParameter({
            maxArrayLength: 3,
            maxBytesLength: 64,
            maxDepth: 2,
            maxTupleArity: 3,
          }),
        }),
        { maxLength: 5 },
      ),
      name: fc.constantFrom(...eventNames),
      naming: fc.constantFrom('all', 'none', 'some'),
    })
    .chain((value) => {
      // A log has at most four topics, and a non-anonymous event spends one
      // on its selector.
      const maxIndexed = value.anonymous ? 4 : 3
      let count = 0
      const inputs = value.inputs.map((input, i) => {
        const indexed = input.indexed && count < maxIndexed
        if (indexed) count++
        const named =
          value.naming === 'all' || (value.naming === 'some' && input.named)
        return {
          indexed,
          name: named ? `a${i}` : '',
          parameter: input.parameter,
        }
      })
      const abiEvent = {
        ...(value.anonymous ? { anonymous: true } : {}),
        inputs: inputs.map((input) => ({
          ...input.parameter,
          indexed: input.indexed,
          name: input.name,
        })),
        name: value.name,
        type: 'event',
      } as AbiEvent.AbiEvent
      return fc
        .tuple(...inputs.map((input) => arbitraryAbiValueFor(input.parameter)))
        .map(
          (values): EventCase => ({
            abiEvent,
            inputs: inputs.map((input, i) => ({ ...input, value: values[i] })),
          }),
        )
    })
}

/** Generates a log that no event emitted: up to four topics and random data. */
export function arbitraryNoiseLog(): fc.Arbitrary<Log> {
  return fc.record({
    data: fc
      .integer({ max: 5, min: 0 })
      .chain((words) => arbitraryHexOfByteLength(words * 32)),
    topics: fc.array(arbitraryHexOfByteLength(32), { maxLength: 4 }),
  })
}

/** Whether a topic holds the keccak256 of the value instead of the value. */
export function isHashed(parameter: AbiParameters.Parameter) {
  const { type } = parameter
  return (
    type === 'string' ||
    type === 'bytes' ||
    type === 'tuple' ||
    type.endsWith(']')
  )
}

/** The topic of an indexed input, as a contract emits it. */
export function topicOf(input: EventInput): Hex.Hex {
  const { parameter, value } = input
  if (parameter.type === 'string')
    return Hash.keccak256(Hex.fromString(value as string))
  if (parameter.type === 'bytes') return Hash.keccak256(value as Hex.Hex)
  const encoded = AbiParameters.encode([parameter], [value] as never)
  if (isHashed(parameter)) return Hash.keccak256(encoded)
  return encoded
}

/** Encodes the log of an event case, as a contract emits it. */
export function encodeLog(value: EventCase, selector: Hex.Hex): Log {
  const { abiEvent, inputs } = value
  const indexed = inputs.filter((input) => input.indexed)
  const nonIndexed = inputs.filter((input) => !input.indexed)
  const topics = indexed.map((input) => topicOf(input))
  return {
    data:
      nonIndexed.length > 0
        ? AbiParameters.encode(
            nonIndexed.map((input) => input.parameter),
            nonIndexed.map((input) => input.value) as never,
          )
        : '0x',
    topics: abiEvent.anonymous ? topics : [selector, ...topics],
  }
}

/**
 * The arguments a decoder returns for a log of `value`. Indexed `string`,
 * `bytes`, tuple, and array inputs decode to their topic.
 *
 * @param array - Whether the decoder returns an array, in input order.
 */
export function expectedArgs(value: EventCase, array: boolean) {
  const { inputs } = value
  if (inputs.length === 0) return undefined
  const args = inputs.map((input) =>
    input.indexed && isHashed(input.parameter) ? topicOf(input) : input.value,
  )
  if (array) return args
  return Object.fromEntries(
    inputs.map((input, i) => [input.name || String(i), args[i]]),
  )
}

/** Lowercases every hex string in a value, at any depth. */
export function lowercase(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('0x'))
    return value.toLowerCase()
  if (Array.isArray(value)) return value.map((x) => lowercase(x))
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, x]) => [key, lowercase(x)]),
    )
  return value
}
