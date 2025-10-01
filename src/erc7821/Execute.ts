import * as AbiFunction from '../core/AbiFunction.js'
import type * as Hex from '../core/Hex.js'
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
  return Calls.decode(executionData, { opData: m !== mode.default })
}

export declare namespace decodeData {
  type ReturnType = {
    calls: Call[]
    opData?: Hex.Hex | undefined
  }
}

/**
 * Decodes batches from ERC-7821 `execute` function data in "batch of batches" mode.
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
  const [, executionData] = AbiFunction.decodeData(abiFunction, data) as [
    Hex.Hex,
    Hex.Hex,
  ]

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
