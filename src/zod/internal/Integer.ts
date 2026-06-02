/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../../core/Hex.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'

export type SmallBits = 8 | 16 | 24 | 32 | 40 | 48

export function decodeInteger(
  value: z.output<typeof z_Hex.Hex>,
  bits: number,
  signed: boolean,
): bigint {
  return signed
    ? core_Hex.toBigInt(core_Hex.padLeft(value, bits / 8), { signed: true })
    : core_Hex.toBigInt(value)
}

export function quantityHex(bits?: number) {
  return z_Hex.Hex.check(
    z.refine(
      (value) => isIntegerHex(value, bits),
      bits === undefined
        ? 'expected integer hex'
        : `expected ${bits}-bit integer hex`,
    ),
  )
}

export function uintNumber(bits?: number) {
  if (bits === 32) return z.uint32('expected uint32')
  const max =
    bits === undefined ? globalThis.Number.MAX_SAFE_INTEGER : 2 ** bits - 1
  const message =
    bits === undefined ? 'expected uint number' : `expected uint${bits}`
  return z.int(message).check(z.gte(0, message), z.lte(max, message))
}

export function intNumber(bits: number) {
  if (bits === 32) return z.int32('expected int32')
  const min = -(2 ** (bits - 1))
  const max = 2 ** (bits - 1) - 1
  const message = `expected int${bits}`
  return z.int(message).check(z.gte(min, message), z.lte(max, message))
}

export function uintBigint(bits?: number) {
  if (bits === 64) return z.uint64('expected uint64')
  if (bits === undefined)
    return z.bigint().check(z.gte(0n, 'expected uint bigint'))
  const max = (1n << globalThis.BigInt(bits)) - 1n
  const message = `expected uint${bits}`
  return z.bigint().check(z.gte(0n, message), z.lte(max, message))
}

export function intBigint(bits: number) {
  if (bits === 64) return z.int64('expected int64')
  const min = -(1n << globalThis.BigInt(bits - 1))
  const max = (1n << globalThis.BigInt(bits - 1)) - 1n
  const message = `expected int${bits}`
  return z.bigint().check(z.gte(min, message), z.lte(max, message))
}

function isIntegerHex(value: z.output<typeof z_Hex.Hex>, bits?: number) {
  try {
    if (bits !== undefined && core_Hex.size(value) > bits / 8) return false
    if (bits !== undefined)
      return core_Hex.toBigInt(value) < 1n << globalThis.BigInt(bits)
    core_Hex.toBigInt(value)
    return true
  } catch {
    return false
  }
}
