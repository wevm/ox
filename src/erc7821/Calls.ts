import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

export type Call<bigintType = bigint> = {
  data?: Hex.Hex | undefined
  to: Address.Address
  value?: bigintType | undefined
}

/**
 * Encodes a set of ERC-7821 calls.
 *
 * @example
 * ```ts twoslash
 * import { Calls } from 'ox/erc7821'
 *
 * const calls = Calls.encode([
 *   {
 *     data: '0xdeadbeef',
 *     to: '0xcafebabecafebabecafebabecafebabecafebabe',
 *     value: 1n,
 *   },
 *   {
 *     data: '0xcafebabe',
 *     to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *     value: 2n,
 *   },
 * ])
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000cafebabecafebabecafebabecafebabecafebabe0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000deadbeef000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cafebabe'
 * ```
 *
 * @param calls - Calls to encode.
 * @param options - Options for the encoding.
 * @returns The encoded calls.
 */
export function encode(calls: readonly Call[], options: encode.Options = {}) {
  const { opData } = options
  return AbiParameters.encode(getAbiParameters({ opData: !!opData }), [
    calls.map((call) => ({
      target: call.to,
      value: call.value ?? 0n,
      data: call.data ?? '0x',
    })),
    ...(opData ? [opData] : []),
  ] as any)
}

export declare namespace encode {
  type Options = {
    /** Additional data to include for execution. */
    opData?: Hex.Hex | undefined
  }
}

/**
 * Gets the ABI parameters for the ERC-7821 calls.
 *
 * @example
 * ```ts twoslash
 * import { Calls } from 'ox/erc7821'
 *
 * const abiParameters = Calls.getAbiParameters({ opData: true })
 * ```
 *
 * @param options - Options.
 * @returns The ABI parameters.
 */
export function getAbiParameters(options: getAbiParameters.Options = {}) {
  const { opData } = options
  return AbiParameters.from([
    'struct Call { address target; uint256 value; bytes data; }',
    'Call[] calls',
    ...(opData ? ['bytes opData'] : []),
  ])
}

export declare namespace getAbiParameters {
  type Options = {
    opData?: boolean | undefined
  }
}

/**
 * Decodes a set of ERC-7821 calls from encoded data.
 *
 * @example
 * ```ts twoslash
 * import { Calls } from 'ox/erc7821'
 *
 * const data = Calls.decode('0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000cafebabecafebabecafebabecafebabecafebabe000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004cafebabe00000000000000000000000000000000000000000000000000000000')
 * // @log: {
 * // @log:   calls: [
 * // @log:     {
 * // @log:       data: '0xdeadbeef',
 * // @log:       to: '0xcafebabecafebabecafebabecafebabecafebabe',
 * // @log:       value: 1n,
 * // @log:     },
 * // @log:     {
 * // @log:       data: '0xcafebabe',
 * // @log:       to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 * // @log:       value: 2n,
 * // @log:     },
 * // @log:   ]
 * // @log: }
 * ```
 *
 * @param data - The encoded calls data.
 * @param options - Options for decoding.
 * @returns The decoded calls and optional opData.
 */
export function decode(
  data: Hex.Hex,
  options: decode.Options = {},
): decode.ReturnType {
  const { opData: withOpData = false } = options

  const decoded = AbiParameters.decode(
    getAbiParameters({ opData: withOpData }),
    data,
  ) as readonly unknown[]
  const [encodedCalls, opData] = decoded as readonly [
    { target: Address.Address; value: bigint; data: Hex.Hex }[],
    Hex.Hex?,
  ]

  const calls = encodedCalls.map((call) => ({
    to: call.target,
    value: call.value,
    data: call.data,
  }))

  return withOpData
    ? { calls, opData: opData === '0x' ? undefined : opData }
    : { calls }
}

export declare namespace decode {
  type Options = {
    /** Whether to decode opData if present. */
    opData?: boolean | undefined
  }

  type ReturnType = {
    calls: Call[]
    opData?: Hex.Hex | undefined
  }
}
