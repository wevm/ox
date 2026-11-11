import * as AbiFunction from '../core/AbiFunction.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import { AbiParameters } from '../index.js'
import * as Calls from './Calls.js'

export type Batch = {
  calls: readonly Call[]
  opData?: Hex.Hex | undefined
}

export type Call = Calls.Call

export const abiFunction = {
  type: 'function',
  name: 'execute',
  inputs: [
    {
      name: 'mode',
      type: 'bytes32',
      internalType: 'bytes32',
    },
    {
      name: 'executionData',
      type: 'bytes',
      internalType: 'bytes',
    },
  ],
  outputs: [],
  stateMutability: 'payable',
} satisfies AbiFunction.AbiFunction

export const mode = {
  default: '0x0100000000000000000000000000000000000000000000000000000000000000',
  opData: '0x0100000000007821000100000000000000000000000000000000000000000000',
  batchOfBatches:
    '0x0100000000007821000200000000000000000000000000000000000000000000',
} as const

/**
 * Decodes calls from ERC-7821 `execute` function data.
 *
 * Decodes the single batch modes only (`mode.default` and `mode.opData`). Throws
 * `Execute.UnsupportedModeError` for the "batch of batches" mode (use
 * `Execute.decodeBatchOfBatchesData` instead) and for unknown modes.
 *
 * @example
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const { calls } = Execute.decodeData('0x...')
 * ```
 *
 * @param data - The encoded data.
 * @returns The decoded calls and optional opData.
 */
export function decodeData(data: Hex.Hex): decodeData.ReturnType {
  const [m, executionData] = AbiFunction.decodeData(abiFunction, data) as [
    Hex.Hex,
    Hex.Hex,
  ]
  const name = getModeName(m)
  if (name !== 'default' && name !== 'opData')
    throw new UnsupportedModeError({
      mode: m,
      supported: ['default', 'opData'],
    })
  return Calls.decode(executionData, { opData: name === 'opData' })
}

export declare namespace decodeData {
  type ReturnType = {
    calls: Call[]
    opData?: Hex.Hex | undefined
  }

  type ErrorType = UnsupportedModeError | Errors.GlobalErrorType
}

/**
 * Decodes batches from ERC-7821 `execute` function data in "batch of batches" mode.
 *
 * Throws `Execute.UnsupportedModeError` for any other mode.
 *
 * @example
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const batches = Execute.decodeBatchOfBatchesData('0x...')
 * ```
 *
 * @param data - The encoded data.
 * @returns The decoded batches.
 */
export function decodeBatchOfBatchesData(
  data: Hex.Hex,
): decodeBatchOfBatchesData.ReturnType {
  const [m, executionData] = AbiFunction.decodeData(abiFunction, data) as [
    Hex.Hex,
    Hex.Hex,
  ]
  if (getModeName(m) !== 'batchOfBatches')
    throw new UnsupportedModeError({ mode: m, supported: ['batchOfBatches'] })

  const [encodedBatches] = AbiParameters.decode(
    AbiParameters.from('bytes[]'),
    executionData,
  ) as readonly [Hex.Hex[]]

  return encodedBatches.map((encodedBatch) => {
    // Try decoding with opData first
    try {
      const decoded = Calls.decode(encodedBatch, { opData: true })
      if (decoded.opData) {
        return {
          calls: decoded.calls,
          opData: decoded.opData,
        }
      }
      // If opData is undefined, return without it
      return { calls: decoded.calls }
    } catch {
      // If decoding with opData fails, decode without it
      const decoded = Calls.decode(encodedBatch, { opData: false })
      return { calls: decoded.calls }
    }
  })
}

export declare namespace decodeBatchOfBatchesData {
  type ReturnType = Batch[]

  type ErrorType = UnsupportedModeError | Errors.GlobalErrorType
}

/**
 * Encodes calls for the ERC-7821 `execute` function with "batch of batches" mode.
 *
 * @example
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const data = Execute.encodeBatchOfBatchesData([
 *   {
 *     calls: [
 *       {
 *         data: '0xcafebabe',
 *         to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *         value: 1n,
 *       }
 *     ]
 *   },
 *   {
 *     calls: [
 *       {
 *         data: '0xdeadbeef',
 *         to: '0xcafebabecafebabecafebabecafebabecafebabe',
 *         value: 2n,
 *       }
 *     ],
 *     opData: '0xcafebabe',
 *   }
 * ])
 * ```
 *
 * @param calls - The calls to encode.
 * @param options - The options.
 * @returns The encoded data.
 */
export function encodeBatchOfBatchesData(batches: readonly Batch[]) {
  const b = AbiParameters.encode(AbiParameters.from('bytes[]'), [
    batches.map((b) => {
      const batch = b as Batch
      return Calls.encode(batch.calls, {
        opData: batch.opData,
      })
    }),
  ])
  return AbiFunction.encodeData(abiFunction, [mode.batchOfBatches, b])
}

/**
 * Encodes calls for the ERC-7821 `execute` function.
 *
 * @example
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const data = Execute.encodeData([
 *   {
 *     data: '0xcafebabe',
 *     to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *     value: 1n,
 *   }
 * ])
 * ```
 *
 * @param calls - The calls to encode.
 * @param options - The options.
 * @returns The encoded data.
 */
export function encodeData(
  calls: readonly Call[],
  options: encodeData.Options = {},
) {
  const { opData } = options
  const c = Calls.encode(calls, { opData })
  const m = opData ? mode.opData : mode.default
  return AbiFunction.encodeData(abiFunction, [m, c])
}

export declare namespace encodeData {
  type Options = {
    opData?: Hex.Hex | undefined
  }
}

/**
 * Thrown when the mode of ERC-7821 `execute` function data is not supported by the decoder.
 *
 * @example
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const data = Execute.encodeBatchOfBatchesData([
 *   {
 *     calls: [
 *       {
 *         data: '0xcafebabe',
 *         to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *         value: 1n
 *       }
 *     ]
 *   }
 * ])
 *
 * Execute.decodeData(data)
 * // @error: Execute.UnsupportedModeError: Execution mode `0x0100000000007821000200000000000000000000000000000000000000000000` is not supported.
 * ```
 */
export class UnsupportedModeError extends Errors.BaseError {
  override readonly name = 'Execute.UnsupportedModeError'

  constructor({ mode, supported }: UnsupportedModeError.Options) {
    super(`Execution mode \`${mode}\` is not supported.`, {
      metaMessages: [
        `Supported modes: ${supported.map((name) => `\`${name}\``).join(', ')}.`,
      ],
    })
  }
}

export declare namespace UnsupportedModeError {
  /** Options for `Execute.UnsupportedModeError`. */
  type Options = {
    /** Mode of the `execute` function data. */
    mode: Hex.Hex
    /** Names of the modes (keys of `Execute.mode`) the decoder supports. */
    supported: readonly (keyof typeof mode)[]
  }
}

/**
 * Identifies an ERC-7821 execution mode the way the reference implementation
 * (`_executionModeId`) does. Bytes `[0..1]` (call type and execution type) and
 * bytes `[6..9]` (mode selector) identify the mode. Bytes `[2..5]` (reserved by
 * ERC-7579) and bytes `[10..31]` (unused) are ignored.
 *
 * @internal
 */
function getModeName(m: Hex.Hex): keyof typeof mode | undefined {
  if (Hex.slice(m, 0, 2) !== '0x0100') return undefined
  const selector = Hex.slice(m, 6, 10)
  if (selector === '0x00000000') return 'default'
  if (selector === '0x78210001') return 'opData'
  if (selector === '0x78210002') return 'batchOfBatches'
  return undefined
}
