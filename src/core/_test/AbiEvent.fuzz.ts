import { fc, test } from '@fast-check/vitest'
import { AbiEvent, Errors } from 'ox'
import { describe, expect } from 'vp/test'

import {
  arbitraryEventCase,
  arbitraryNoiseLog,
  type EventCase,
  encodeLog,
  eventNames,
  expectedArgs,
  isHashed,
  type Log,
  lowercase,
} from '../../../test/fuzz/arbitraries/abiEvent.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

function logOf(value: EventCase) {
  return encodeLog(value, AbiEvent.getSelector(value.abiEvent))
}

function indexedCount(abiEvent: AbiEvent.AbiEvent) {
  return abiEvent.inputs.filter((input) => input.indexed).length
}

/** A random ABI, and logs that its events emit, mixed with noise. */
const arbitraryAbiCase = fc
  .array(arbitraryEventCase(), { maxLength: 4, minLength: 1 })
  .chain((cases) =>
    fc
      .array(
        fc.oneof(
          fc.constantFrom(...cases).map((value) => logOf(value)),
          arbitraryNoiseLog(),
        ),
        { maxLength: 6 },
      )
      .map((logs) => ({ abi: cases.map((x) => x.abiEvent), logs })),
  )

/**
 * A model of the events `extractLogs` matches in strict mode, as its
 * documentation states. A selector match wins. Otherwise anonymous events are
 * only matched when requested, and only when exactly one fits the topic
 * count. The first candidate that decodes is used, then `eventName` filters.
 */
function extractModel(
  abi: readonly AbiEvent.AbiEvent[],
  logs: readonly Log[],
  eventName: readonly string[] | undefined,
) {
  const anonymous = (() => {
    if (eventName)
      return abi.filter((x) => x.anonymous && eventName.includes(x.name))
    if (abi.every((x) => x.anonymous)) return abi
    return []
  })()
  return logs.flatMap((log, index) => {
    const bySelector = abi.filter(
      (x) => !x.anonymous && log.topics[0] === AbiEvent.getSelector(x),
    )
    const candidates = (() => {
      if (bySelector.length > 0) return bySelector
      const fit = anonymous.filter((x) => indexedCount(x) === log.topics.length)
      if (fit.length === 1) return fit
      return []
    })()
    for (const abiEvent of candidates) {
      try {
        AbiEvent.decode(abiEvent, log)
      } catch {
        continue
      }
      if (eventName && !eventName.includes(abiEvent.name)) return []
      return [[index, abiEvent.name] as const]
    }
    return []
  })
}

describe('decode', () => {
  test.prop({ value: arbitraryEventCase() }, { numRuns })(
    'decodes the arguments a log was encoded from',
    ({ value }) => {
      const log = logOf(value)

      const args = AbiEvent.decode(value.abiEvent, log)

      const array = value.inputs.every((input) => !input.name)
      expect(lowercase(args)).toEqual(lowercase(expectedArgs(value, array)))
    },
  )

  test.prop(
    {
      abi: fc.array(arbitraryEventCase(), { maxLength: 4 }),
      log: arbitraryNoiseLog(),
      strict: fc.boolean(),
    },
    { numRuns },
  )('returns or throws an ox error for any log', ({ abi, log, strict }) => {
    for (const { abiEvent } of abi) {
      try {
        AbiEvent.decode(abiEvent, log, { strict } as never)
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.BaseError)
      }
    }
  })
})

describe('encode', () => {
  test.prop({ value: arbitraryEventCase() }, { numRuns })(
    'encodes the topics a contract emits',
    ({ value }) => {
      // Filters cannot hold tuple or array values.
      fc.pre(
        value.inputs.every(
          (input) =>
            !input.indexed ||
            !isHashed(input.parameter) ||
            input.parameter.type === 'string' ||
            input.parameter.type === 'bytes',
        ),
      )
      const args = value.inputs.flatMap((input, i) =>
        input.indexed ? [[input.name || String(i), input.value] as const] : [],
      )
      const named = value.inputs.every((input) => input.name)

      const { topics } = AbiEvent.encode(
        value.abiEvent,
        (named
          ? Object.fromEntries(args)
          : value.inputs.filter((x) => x.indexed).map((x) => x.value)) as never,
      )

      expect(lowercase(topics)).toEqual(lowercase(logOf(value).topics))
    },
  )
})

describe('decodeLog', () => {
  test.prop(
    {
      others: fc.array(arbitraryEventCase(), { maxLength: 3 }),
      value: arbitraryEventCase({ anonymous: false }),
    },
    { numRuns },
  )('decodes a selector match the same way in any ABI', ({ others, value }) => {
    const selector = AbiEvent.getSelector(value.abiEvent)
    // An overload with the same selector would be ambiguous.
    fc.pre(
      others.every(
        (x) =>
          x.abiEvent.anonymous || AbiEvent.getSelector(x.abiEvent) !== selector,
      ),
    )
    const log = logOf(value)

    const decoded = AbiEvent.decodeLog(
      [...others.map((x) => x.abiEvent), value.abiEvent],
      log,
    )

    expect(decoded.event.name).toBe(value.abiEvent.name)
    expect(lowercase(decoded.args)).toEqual(
      lowercase(AbiEvent.decode(value.abiEvent, log)),
    )
  })

  test.prop(
    {
      others: fc.array(arbitraryEventCase({ anonymous: true }), {
        maxLength: 3,
      }),
      value: arbitraryEventCase({ anonymous: true }),
    },
    { numRuns },
  )(
    'decodes an anonymous log when every event is anonymous',
    ({ others, value }) => {
      const count = indexedCount(value.abiEvent)
      fc.pre(others.every((x) => indexedCount(x.abiEvent) !== count))
      const log = logOf(value)

      const decoded = AbiEvent.decodeLog(
        [...others.map((x) => x.abiEvent), value.abiEvent],
        log,
      )

      expect(decoded.event).toBe(value.abiEvent)
    },
  )

  test.prop(
    {
      named: arbitraryEventCase({ anonymous: false }),
      value: arbitraryEventCase({ anonymous: true }),
    },
    { numRuns },
  )('does not match anonymous events in a mixed ABI', ({ named, value }) => {
    const log = logOf(value)
    fc.pre(log.topics[0] !== AbiEvent.getSelector(named.abiEvent))

    expect(() =>
      AbiEvent.decodeLog([named.abiEvent, value.abiEvent], log),
    ).toThrow()
  })
})

describe('extractLogs', () => {
  test.prop({ value: arbitraryAbiCase }, { numRuns })(
    'matches the model for any ABI and logs',
    ({ value }) => {
      const extracted = AbiEvent.extractLogs(value.abi, value.logs)

      expect(extracted.map((x) => x.eventName)).toEqual(
        extractModel(value.abi, value.logs, undefined).map(([, name]) => name),
      )
    },
  )

  test.prop(
    {
      eventName: fc.subarray([...eventNames], { minLength: 1 }),
      value: arbitraryAbiCase,
    },
    { numRuns },
  )('matches the model for any eventName', ({ eventName, value }) => {
    const extracted = AbiEvent.extractLogs(value.abi, value.logs, {
      eventName: eventName as never,
    })

    expect(extracted.map((x) => x.eventName)).toEqual(
      extractModel(value.abi, value.logs, eventName).map(([, name]) => name),
    )
  })

  test.prop({ value: arbitraryEventCase() }, { numRuns })(
    'decodes a log that a lone event emits',
    ({ value }) => {
      const log = logOf(value)

      const extracted = AbiEvent.extractLogs([value.abiEvent], [log])

      const array = value.inputs.some((input) => !input.name)
      expect(extracted.map((x) => [x.eventName, lowercase(x.args)])).toEqual([
        [value.abiEvent.name, lowercase(expectedArgs(value, array))],
      ])
    },
  )

  test.prop({ value: arbitraryAbiCase }, { numRuns })(
    'does not throw for any ABI and logs in non-strict mode',
    ({ value }) => {
      AbiEvent.extractLogs(value.abi, value.logs, { strict: false })
    },
  )
})
