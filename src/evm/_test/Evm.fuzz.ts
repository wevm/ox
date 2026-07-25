import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import * as Evm from 'ox/evm/Evm'
import { beforeAll, describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

const maxUint256 = 2n ** 256n - 1n
const wrap = (value: bigint) => ((value % 2n ** 256n) + 2n ** 256n) % 2n ** 256n

/** Reinterprets an unsigned word as two's-complement signed. */
const signed = (value: bigint) =>
  value > maxUint256 / 2n ? value - 2n ** 256n : value

const arbitraryWord = () =>
  fc.oneof(
    // Small values and boundaries find off-by-ones that uniform 256-bit
    // sampling almost never hits.
    fc.bigInt({ min: 0n, max: 4n }),
    fc.constantFrom(
      maxUint256,
      maxUint256 - 1n,
      2n ** 255n,
      2n ** 255n - 1n,
      2n ** 128n,
      2n ** 128n - 1n,
      2n ** 64n,
      2n ** 64n - 1n,
      0n,
    ),
    fc.bigInt({ min: 0n, max: maxUint256 }),
  )

const push = (value: bigint) => `7f${value.toString(16).padStart(64, '0')}`

/** Runs `body` and returns the top of the stack as an unsigned word. */
async function evaluate(body: string): Promise<bigint> {
  const result = await Evm.run({
    bytecode: `0x${body}5f5260205ff3`,
    gas: 10_000_000n,
  })
  expect(result.status).toBe('success')
  return Hex.toBigInt(result.data)
}

/** Binary op: operands are pushed so that `a` ends up on top of the stack. */
const binary = (op: string, a: bigint, b: bigint) =>
  evaluate(`${push(b)}${push(a)}${op}`)

beforeAll(async () => {
  await Evm.ready()
})

describe('u256 arithmetic matches bigint', () => {
  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'ADD',
    async ({ a, b }) => {
      expect(await binary('01', a, b)).toBe(wrap(a + b))
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'SUB',
    async ({ a, b }) => {
      expect(await binary('03', a, b)).toBe(wrap(a - b))
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'MUL',
    async ({ a, b }) => {
      expect(await binary('02', a, b)).toBe(wrap(a * b))
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'DIV',
    async ({ a, b }) => {
      expect(await binary('04', a, b)).toBe(b === 0n ? 0n : a / b)
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'MOD',
    async ({ a, b }) => {
      expect(await binary('06', a, b)).toBe(b === 0n ? 0n : a % b)
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'SDIV',
    async ({ a, b }) => {
      const [sa, sb] = [signed(a), signed(b)]
      // BigInt division already truncates toward zero, as SDIV requires.
      expect(await binary('05', a, b)).toBe(sb === 0n ? 0n : wrap(sa / sb))
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'SMOD',
    async ({ a, b }) => {
      const [sa, sb] = [signed(a), signed(b)]
      // BigInt `%` takes the sign of the dividend, as SMOD requires.
      expect(await binary('07', a, b)).toBe(sb === 0n ? 0n : wrap(sa % sb))
    },
  )

  test.prop(
    { a: arbitraryWord(), b: arbitraryWord(), m: arbitraryWord() },
    { numRuns },
  )('ADDMOD', async ({ a, b, m }) => {
    // The intermediate sum is 257-bit, so this must not wrap before reducing.
    expect(await evaluate(`${push(m)}${push(b)}${push(a)}08`)).toBe(
      m === 0n ? 0n : (a + b) % m,
    )
  })

  test.prop(
    { a: arbitraryWord(), b: arbitraryWord(), m: arbitraryWord() },
    { numRuns },
  )('MULMOD', async ({ a, b, m }) => {
    // The intermediate product is 512-bit.
    expect(await evaluate(`${push(m)}${push(b)}${push(a)}09`)).toBe(
      m === 0n ? 0n : (a * b) % m,
    )
  })

  test.prop({ base: arbitraryWord(), exponent: arbitraryWord() }, { numRuns })(
    'EXP',
    async ({ base, exponent }) => {
      // `base ** exponent` is unusable as a reference at these magnitudes, so
      // the oracle is square-and-multiply modulo 2^256.
      let expected = 1n
      let b = base
      let e = exponent
      while (e > 0n) {
        if (e & 1n) expected = wrap(expected * b)
        b = wrap(b * b)
        e >>= 1n
      }
      expect(await binary('0a', base, exponent)).toBe(expected)
    },
  )

  test.prop({ a: arbitraryWord(), shift: arbitraryWord() }, { numRuns })(
    'SHL / SHR',
    async ({ a, shift }) => {
      const n = shift >= 256n ? 256n : shift
      expect(await binary('1b', shift, a)).toBe(n >= 256n ? 0n : wrap(a << n))
      expect(await binary('1c', shift, a)).toBe(n >= 256n ? 0n : a >> n)
    },
  )

  test.prop({ a: arbitraryWord(), shift: arbitraryWord() }, { numRuns })(
    'SAR',
    async ({ a, shift }) => {
      const n = shift >= 256n ? 256n : shift
      expect(await binary('1d', shift, a)).toBe(wrap(signed(a) >> n))
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'comparisons',
    async ({ a, b }) => {
      expect(await binary('10', a, b)).toBe(a < b ? 1n : 0n)
      expect(await binary('11', a, b)).toBe(a > b ? 1n : 0n)
      expect(await binary('14', a, b)).toBe(a === b ? 1n : 0n)
      expect(await binary('12', a, b)).toBe(signed(a) < signed(b) ? 1n : 0n)
      expect(await binary('13', a, b)).toBe(signed(a) > signed(b) ? 1n : 0n)
    },
  )

  test.prop({ a: arbitraryWord(), b: arbitraryWord() }, { numRuns })(
    'bitwise',
    async ({ a, b }) => {
      expect(await binary('16', a, b)).toBe(a & b)
      expect(await binary('17', a, b)).toBe(a | b)
      expect(await binary('18', a, b)).toBe(a ^ b)
      expect(await evaluate(`${push(a)}19`)).toBe(maxUint256 ^ a)
    },
  )

  test.prop(
    { value: arbitraryWord(), index: fc.bigInt({ min: 0n, max: 40n }) },
    { numRuns },
  )('BYTE', async ({ value, index }) => {
    const expected = index >= 32n ? 0n : (value >> ((31n - index) * 8n)) & 0xffn
    expect(await binary('1a', index, value)).toBe(expected)
  })

  test.prop(
    { value: arbitraryWord(), size: fc.bigInt({ min: 0n, max: 40n }) },
    { numRuns },
  )('SIGNEXTEND', async ({ value, size }) => {
    const expected = (() => {
      if (size >= 31n) return value
      const bit = size * 8n + 7n
      const mask = (1n << bit) - 1n
      return (value >> bit) & 1n ? value | (maxUint256 ^ mask) : value & mask
    })()
    expect(await binary('0b', size, value)).toBe(expected)
  })
})
