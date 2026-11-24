/**
 * The structured properties the fuzz category runs: round trips for every encode/decode pair,
 * differentials against viem, ethers, noble, scure, and micro-eth-signer, and consistency between
 * ox functions that must agree. Each property lists the public functions it exercises (`covers`),
 * and its failure names the function at fault (`blame`) when the check can tell, such as ox when
 * every reference agrees against it.
 *
 * Inputs are well-formed for the function's types (fast-check arbitraries), so any error a call
 * throws is a failure too, except where a check expects one of ox's documented errors.
 *
 * `seeds` lists hand-written argument sets, which the worker mutates at the boundaries as it does
 * recorded arguments. `library` loads the reference implementations, and `mutations` and
 * `budgets` set how many boundary mutations each function gets, for this branch's dependencies
 * and costs.
 *
 * @module
 */

import { createRequire } from 'node:module'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

import type fcModule from 'fast-check'

import { deliberate } from './fuzz-lib.ts'

type Fc = typeof fcModule
type Arbitrary<value = unknown> = fcModule.Arbitrary<value>
type Module = Record<string, unknown>
type Any = any

export type Lib = {
  /** ox's entry points by specifier, such as `ox` or `ox/tempo`. */
  ox: Record<string, Module>
  viem: Any
  /** viem's account abstraction entry, for user operation hashes. */
  viemAa: Any
  ethers: Any
  /** noble's curves and hashes. */
  noble: Record<string, Any>
  /** scure's BIP-32 and BIP-39. */
  scure: Record<string, Any>
  micro: Any
  fc: Fc
  /** A function's recorded argument sets from the corpus (only for functions in this job). */
  recorded: (name: string) => unknown[][]
  /** A boundary mutation of a recorded argument set; `undefined` when it breaks the type. */
  mutate: (
    seed: unknown[],
    pool: unknown[][],
    random: number,
    count: number,
  ) => unknown[] | undefined
  BaseError: new (...args: never[]) => Error
  root: string
}

/** What fuzz-worker.ts passes `library`: ox's entries, fast-check, and the recorded arguments. */
export type Base = Pick<
  Lib,
  'BaseError' | 'fc' | 'mutate' | 'ox' | 'recorded' | 'root'
>

/** Adds the reference implementations the properties compare ox with to what the worker passes. */
export async function library(base: Base): Promise<Lib> {
  const require = createRequire(path.join(base.root, 'package.json'))
  const load = async (specifier: string) =>
    import(pathToFileURL(require.resolve(specifier)).href)
  return {
    ...base,
    viem: await load('viem'),
    viemAa: await load('viem/account-abstraction'),
    ethers: await load('ethers'),
    noble: {
      secp256k1: await load('@noble/curves/secp256k1.js'),
      nist: await load('@noble/curves/nist.js'),
      ed25519: await load('@noble/curves/ed25519.js'),
      sha3: await load('@noble/hashes/sha3.js'),
      sha2: await load('@noble/hashes/sha2.js'),
      legacy: await load('@noble/hashes/legacy.js'),
      blake3: await load('@noble/hashes/blake3.js'),
      hmac: await load('@noble/hashes/hmac.js'),
    },
    scure: {
      bip32: await load('@scure/bip32'),
      bip39: await load('@scure/bip39'),
      english: await load('@scure/bip39/wordlists/english.js'),
    },
    micro: await load('micro-eth-signer'),
  }
}

/** Mutated calls per function with recorded or hand-written arguments, unless `budgets` says otherwise. */
export const mutations = 500

/** Fewer calls for functions whose every call costs milliseconds; the first match applies. */
export const budgets: [RegExp, number][] = [
  [/Mnemonic\.to(Seed|HdKey|PrivateKey)|HdKey\.fromSeed|Keystore\./, 8],
  // Mining a salt is unbounded work by design, so only the recorded calls run.
  [/VirtualMaster\.mineSalt/, 0],
  [/Kzg\.create$/, 4],
  [/Blobs\.|BlobCells\.|Kzg\.|Setups\./, 12],
  [/Bls\.|BlsPoint\.|MlDsa44\./, 30],
  [
    /\.(recover\w*|verify\w*|sign\w*|getPublicKey|createKeyPair\w*|getSharedSecret|derive\w*)$/,
    60,
  ],
  [/WebCryptoP256|WebAuthnP256/, 30],
]

export type Property = {
  id: string
  oracle: 'round trip' | 'differential' | 'consistency' | 'crash'
  covers: string[]
  runs: number
  async?: boolean | undefined
  arb: Arbitrary
  check: (input: Any) => void | Promise<void>
}

/** A property's failure, with the functions at fault when the check can tell. */
export class Failure extends Error {
  blame?: string[] | undefined
  kind: string
  site?: string | undefined
  constructor(
    message: string,
    options: {
      blame?: string[] | undefined
      kind?: string
      site?: string | undefined
    } = {},
  ) {
    super(message)
    this.blame = options.blame
    this.kind = options.kind ?? 'mismatch'
    this.site = options.site
  }
}

const secp256k1N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const p256N =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n

export function properties(lib: Lib): Property[] {
  const { fc, ethers, viem, noble, scure, micro } = lib
  const out: Property[] = []
  const add = (property: Property) => out.push(property)

  const fn = (name: string): Any => {
    const [entry, path] = name.split(':') as [string, string]
    let value: Any = lib.ox[entry]
    for (const part of path.split('.')) value = value?.[part]
    if (typeof value !== 'function')
      throw new Error(`${name} is not a function`)
    return value
  }
  // Validation the code chose to do (`throw new RangeError('"publicKey" expected …')`) is
  // documented too.
  const documented = (error: unknown) =>
    error instanceof Error &&
    (![TypeError, RangeError, SyntaxError, ReferenceError].includes(
      Object.getPrototypeOf(error)?.constructor,
    ) ||
      deliberate(error))

  /** Calls an ox function; any error is that function's failure. */
  const call = (name: string, ...args: unknown[]): Any => {
    try {
      return fn(name)(...args)
    } catch (error) {
      throw crash(name, error)
    }
  }
  const callAsync = async (name: string, ...args: unknown[]): Promise<Any> => {
    try {
      return await fn(name)(...args)
    } catch (error) {
      throw crash(name, error)
    }
  }
  const crash = (name: string, error: unknown) =>
    new Failure(
      `${short(name)} threw ${(error as Error)?.name ?? typeof error}: ${(error as Error)?.message?.split('\n')[0] ?? String(error)}`,
      {
        blame: [name],
        kind: documented(error)
          ? 'threw on valid input'
          : `${(error as Error)?.name ?? 'non-Error'}`,
        site: siteOf(error),
      },
    )
  /** Expects an ox function to reject an invalid input with a documented error. */
  const rejects = (name: string, why: string, ...args: unknown[]) => {
    let result: unknown
    try {
      result = fn(name)(...args)
    } catch (error) {
      if (documented(error)) return
      throw crash(name, error)
    }
    throw new Failure(
      `${short(name)} accepted ${why} and returned ${show(result)}`,
      { blame: [name], kind: 'accepted invalid input' },
    )
  }
  /** Runs a reference implementation; `undefined` when it rejects the input. */
  const attempt = <value>(thunk: () => value): value | undefined => {
    try {
      return thunk()
    } catch {
      return undefined
    }
  }
  const same = (
    name: string | string[],
    actual: unknown,
    expected: unknown,
    what: string,
  ) => {
    if (!equal(actual, expected))
      throw new Failure(
        `${what}: got ${show(actual)}, expected ${show(expected)}`,
        { blame: Array.isArray(name) ? name : [name] },
      )
  }
  /**
   * Compares ox with the references that accepted the input (`attempt` gave a value). ox is at
   * fault when it disagrees with every reference; references that disagree with each other and
   * leave ox on one side are not ox's problem.
   */
  const vote = (
    name: string,
    values: { ox: unknown } & Record<string, unknown>,
    what: string,
  ) => {
    const refs = Object.keys(values).filter(
      (key) => key !== 'ox' && values[key] !== undefined,
    )
    if (!refs.length) return
    const agree = refs.filter((key) => equal(values.ox, values[key]))
    if (agree.length) return
    throw new Failure(
      `${what}: ox ${show(values.ox)}, ${refs.map((key) => `${key} ${show(values[key])}`).join(', ')}`,
      { blame: [name] },
    )
  }

  // -------------------------------------------------------------------------------------------
  // Arbitraries.

  const hexOf = (min: number, max: number) =>
    fc.uint8Array({ minLength: min, maxLength: max }).map(toHex)
  const bytesOf = (min: number, max: number) =>
    fc.uint8Array({ minLength: min, maxLength: max })
  const address = hexOf(20, 20)
  const hash = hexOf(32, 32)
  const uint = (bits: number) =>
    fc.bigInt({ min: 0n, max: 2n ** BigInt(bits) - 1n })
  const int = (bits: number) =>
    fc.bigInt({
      min: -(2n ** BigInt(bits - 1)),
      max: 2n ** BigInt(bits - 1) - 1n,
    })
  const text = fc.string({ unit: 'grapheme', maxLength: 40 })
  const privateKey = fc
    .bigInt({ min: 1n, max: secp256k1N - 1n })
    .map((value) => toHex32(value))
  const p256Key = fc
    .bigInt({ min: 1n, max: p256N - 1n })
    .map((value) => toHex32(value))
  const scalar = fc.bigInt({ min: 1n, max: secp256k1N - 1n })
  const signature = fc.record({
    r: scalar.map(toHex32),
    s: scalar.map(toHex32),
    yParity: fc.integer({ min: 0, max: 1 }),
  })
  const accessList = fc.array(
    fc.record({
      address,
      storageKeys: fc.array(hash, { maxLength: 3 }),
    }),
    { maxLength: 3 },
  )
  const quantity = fc.oneof(
    fc.constantFrom(0n, 1n, 127n, 128n, 255n, 256n, 2n ** 64n - 1n),
    uint(64),
    uint(256),
  )
  const chainId = fc.oneof(
    fc.constantFrom(1, 10, 137, 8453, 42161),
    fc.integer({ min: 1, max: 2 ** 32 }),
  )

  /** A random ABI parameter type, with its value arbitrary. */
  type Param = { type: string; name?: string; components?: Param[] }
  const elementary = fc.oneof(
    fc.integer({ min: 1, max: 32 }).map((n) => `uint${n * 8}`),
    fc.integer({ min: 1, max: 32 }).map((n) => `int${n * 8}`),
    fc.constantFrom('address', 'bool', 'bytes', 'string', 'uint256', 'bytes32'),
    fc.integer({ min: 1, max: 32 }).map((n) => `bytes${n}`),
  )
  const paramArb: Arbitrary<Param> = fc.letrec<{
    param: Param
    tuple: Param
    array: Param
  }>((tie) => ({
    param: fc.oneof(
      { depthSize: 'small', withCrossShrink: true },
      elementary.map((type) => ({ type })),
      tie('tuple'),
      tie('array'),
    ),
    tuple: fc
      .array(tie('param'), { minLength: 1, maxLength: 3 })
      .map((components) => ({
        type: 'tuple',
        components: components.map((component, i) => ({
          ...component,
          name: `f${i}`,
        })),
      })),
    array: fc
      .tuple(tie('param'), fc.option(fc.integer({ min: 1, max: 3 })))
      .map(([inner, length]) => ({
        ...inner,
        type: `${inner.type}[${length ?? ''}]`,
      })),
  })).param
  const arbitraryOf = (param: Param): Arbitrary => {
    const array = param.type.match(/^(.*)\[(\d*)\]$/)
    if (array) {
      const inner = arbitraryOf({ ...param, type: array[1]! })
      return array[2]
        ? fc.array(inner, {
            minLength: Number(array[2]),
            maxLength: Number(array[2]),
          })
        : fc.array(inner, { maxLength: 3 })
    }
    if (param.type === 'tuple')
      return fc
        .tuple(...param.components!.map(arbitraryOf))
        .map((values) =>
          Object.fromEntries(
            param.components!.map((component, i) => [
              component.name!,
              values[i],
            ]),
          ),
        )
    const sized = param.type.match(/^(u?int|bytes)(\d+)$/)
    if (sized?.[1] === 'uint') return uint(Number(sized[2]))
    if (sized?.[1] === 'int') return int(Number(sized[2]))
    if (sized?.[1] === 'bytes') return hexOf(Number(sized[2]), Number(sized[2]))
    if (param.type === 'address') return address
    if (param.type === 'bool') return fc.boolean()
    if (param.type === 'bytes') return hexOf(0, 70)
    if (param.type === 'string') return text
    throw new Error(`no arbitrary for ${param.type}`)
  }
  const paramsWithValues = fc
    .array(paramArb, { minLength: 0, maxLength: 4 })
    .chain((params) =>
      fc.tuple(fc.constant(params), fc.tuple(...params.map(arbitraryOf))),
    )
  /** A value in the shape decoders return: tuples as objects, addresses lowercase. */
  const canonical = (value: unknown): unknown => {
    if (typeof value === 'string' && /^0x/.test(value))
      return value.toLowerCase()
    if (typeof value === 'number' && Number.isSafeInteger(value))
      return BigInt(value)
    if (Array.isArray(value)) return value.map(canonical)
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, canonical(item)]),
      )
    return value
  }
  /** Converts tuple objects to positional arrays, for ethers. */
  const toEthers = (param: Param, value: Any): unknown => {
    const array = param.type.match(/^(.*)\[(\d*)\]$/)
    if (array)
      return value.map((item: Any) =>
        toEthers({ ...param, type: array[1]! }, item),
      )
    if (param.type === 'tuple')
      return param.components!.map((component) =>
        toEthers(component, value[component.name!]),
      )
    return value
  }
  /** An ethers `Result` as plain values, keyed like `canonical` for tuples. */
  const fromEthers = (param: Param, value: Any): unknown => {
    const array = param.type.match(/^(.*)\[(\d*)\]$/)
    if (array)
      return [...value].map((item) =>
        fromEthers({ ...param, type: array[1]! }, item),
      )
    if (param.type === 'tuple')
      return Object.fromEntries(
        param.components!.map((component, i) => [
          component.name!,
          fromEthers(component, value[i]),
        ]),
      )
    return canonical(value)
  }
  const typeString = (param: Param): string => {
    const array = param.type.match(/^(.*)(\[\d*\])$/)
    if (array) return `${typeString({ ...param, type: array[1]! })}${array[2]}`
    if (param.type === 'tuple')
      return `(${param.components!.map(typeString).join(',')})`
    return param.type
  }

  // -------------------------------------------------------------------------------------------
  // Hex and Bytes.

  add({
    id: 'round trip: Hex.fromBytes and Hex.toBytes',
    oracle: 'round trip',
    covers: [
      'ox:Hex.fromBytes',
      'ox:Hex.toBytes',
      'ox:Bytes.fromHex',
      'ox:Bytes.toHex',
      'ox:Hex.from',
      'ox:Bytes.from',
      'ox:Hex.size',
      'ox:Bytes.size',
      'ox:Hex.validate',
      'ox:Bytes.validate',
      'ox:Hex.assert',
      'ox:Bytes.assert',
      'ox:Hex.isEqual',
      'ox:Bytes.isEqual',
    ],
    runs: 300,
    arb: bytesOf(0, 80),
    check(bytes) {
      const hex = call('ox:Hex.fromBytes', bytes)
      same('ox:Hex.fromBytes', hex, toHex(bytes), 'Hex.fromBytes')
      same('ox:Bytes.toHex', call('ox:Bytes.toHex', bytes), hex, 'Bytes.toHex')
      same('ox:Hex.toBytes', call('ox:Hex.toBytes', hex), bytes, 'Hex.toBytes')
      same(
        'ox:Bytes.fromHex',
        call('ox:Bytes.fromHex', hex.toUpperCase().replace('0X', '0x')),
        bytes,
        'Bytes.fromHex of upper-case hex',
      )
      same('ox:Hex.from', call('ox:Hex.from', bytes), hex, 'Hex.from')
      same('ox:Bytes.from', call('ox:Bytes.from', hex), bytes, 'Bytes.from')
      same('ox:Hex.size', call('ox:Hex.size', hex), bytes.length, 'Hex.size')
      same(
        'ox:Bytes.size',
        call('ox:Bytes.size', bytes),
        bytes.length,
        'Bytes.size',
      )
      same('ox:Hex.validate', call('ox:Hex.validate', hex), true, 'validate')
      same(
        'ox:Bytes.validate',
        call('ox:Bytes.validate', bytes),
        true,
        'validate',
      )
      call('ox:Hex.assert', hex)
      call('ox:Bytes.assert', bytes)
      same(
        'ox:Hex.isEqual',
        call('ox:Hex.isEqual', hex, hex.toUpperCase().replace('0X', '0x')),
        true,
        'Hex.isEqual ignores case',
      )
      same(
        'ox:Bytes.isEqual',
        call('ox:Bytes.isEqual', bytes, Uint8Array.from(bytes)),
        true,
        'Bytes.isEqual',
      )
    },
  })

  add({
    id: 'differential: Bytes.fromHex rejects what is not hex',
    oracle: 'differential',
    covers: ['ox:Bytes.fromHex', 'ox:Hex.toBytes', 'ox:Hex.validate'],
    runs: 300,
    arb: fc
      .string({
        unit: fc.constantFrom(...'0123456789abcdefABCDEFgxz -'),
        maxLength: 12,
      })
      .map((body) => `0x${body}`),
    check(hex) {
      if (/^0x[0-9a-fA-F]*$/.test(hex)) return
      // `Hex.validate` checks only the `0x` prefix unless `strict` is set.
      same(
        'ox:Hex.validate',
        call('ox:Hex.validate', hex, { strict: true }),
        false,
        `Hex.validate(${JSON.stringify(hex)}, { strict: true })`,
      )
      rejects('ox:Bytes.fromHex', `${JSON.stringify(hex)}, not hex`, hex)
      rejects('ox:Hex.toBytes', `${JSON.stringify(hex)}, not hex`, hex)
    },
  })

  add({
    id: 'round trip: numbers through Hex and Bytes, against viem',
    oracle: 'round trip',
    covers: [
      'ox:Hex.fromNumber',
      'ox:Hex.toNumber',
      'ox:Hex.toBigInt',
      'ox:Bytes.fromNumber',
      'ox:Bytes.toNumber',
      'ox:Bytes.toBigInt',
    ],
    runs: 400,
    arb: fc.oneof(
      fc
        .integer({ min: 1, max: 32 })
        .chain((size) =>
          fc.tuple(uint(size * 8), fc.constant(size), fc.constant(false)),
        ),
      fc
        .integer({ min: 1, max: 32 })
        .chain((size) =>
          fc.tuple(int(size * 8), fc.constant(size), fc.constant(true)),
        ),
    ),
    check([value, size, signed]: [bigint, number, boolean]) {
      const options = { size, signed }
      const hex = call('ox:Hex.fromNumber', value, options)
      vote(
        'ox:Hex.fromNumber',
        {
          ox: hex,
          viem: attempt(() => viem.numberToHex(value, options)),
        },
        `Hex.fromNumber(${value}, ${show(options)})`,
      )
      same(
        'ox:Hex.toBigInt',
        call('ox:Hex.toBigInt', hex, options),
        value,
        `Hex.toBigInt(${hex})`,
      )
      const bytes = call('ox:Bytes.fromNumber', value, options)
      same('ox:Bytes.fromNumber', toHex(bytes), hex, 'Bytes.fromNumber')
      same(
        'ox:Bytes.toBigInt',
        call('ox:Bytes.toBigInt', bytes, options),
        value,
        'Bytes.toBigInt',
      )
      if (
        value <= BigInt(Number.MAX_SAFE_INTEGER) &&
        value >= BigInt(Number.MIN_SAFE_INTEGER)
      ) {
        same(
          'ox:Hex.toNumber',
          call('ox:Hex.toNumber', hex, options),
          Number(value),
          'Hex.toNumber',
        )
        same(
          'ox:Bytes.toNumber',
          call('ox:Bytes.toNumber', bytes, options),
          Number(value),
          'Bytes.toNumber',
        )
        same(
          'ox:Hex.fromNumber',
          call('ox:Hex.fromNumber', Number(value), options),
          hex,
          'Hex.fromNumber of a number',
        )
      }
    },
  })

  add({
    id: 'consistency: Hex.toBigInt and Bytes.toBigInt agree on every input',
    oracle: 'consistency',
    covers: ['ox:Hex.toBigInt', 'ox:Bytes.toBigInt', 'ox:Hex.toNumber'],
    runs: 200,
    arb: bytesOf(0, 40),
    check(bytes) {
      const hex = toHex(bytes)
      const fromBytes = call('ox:Bytes.toBigInt', bytes)
      const fromHex = attempt(() => fn('ox:Hex.toBigInt')(hex))
      if (fromHex === undefined)
        throw crash(
          'ox:Hex.toBigInt',
          capture(() => fn('ox:Hex.toBigInt')(hex)),
        )
      same(
        ['ox:Hex.toBigInt'],
        fromHex,
        fromBytes,
        `Hex.toBigInt(${hex}) against Bytes.toBigInt`,
      )
      if (fromBytes <= BigInt(Number.MAX_SAFE_INTEGER)) {
        const number = attempt(() => fn('ox:Hex.toNumber')(hex))
        if (number === undefined)
          throw crash(
            'ox:Hex.toNumber',
            capture(() => fn('ox:Hex.toNumber')(hex)),
          )
        same('ox:Hex.toNumber', number, Number(fromBytes), 'Hex.toNumber')
      }
    },
  })

  add({
    id: 'round trip: strings through Hex and Bytes',
    oracle: 'round trip',
    covers: [
      'ox:Hex.fromString',
      'ox:Hex.toString',
      'ox:Bytes.fromString',
      'ox:Bytes.toString',
    ],
    runs: 300,
    arb: fc.tuple(text, fc.boolean()),
    check([value, padded]: [string, boolean]) {
      const length = new TextEncoder().encode(value).length
      const size = padded && length <= 32 ? 32 : undefined
      const options = size ? { size } : {}
      const hex = call('ox:Hex.fromString', value, options)
      vote(
        'ox:Hex.fromString',
        { ox: hex, viem: attempt(() => viem.stringToHex(value, options)) },
        'Hex.fromString',
      )
      // A string that ends in NUL is indistinguishable from padding once padded.
      if (size && value.endsWith('\0')) return
      same(
        'ox:Hex.toString',
        call('ox:Hex.toString', hex, options),
        value,
        `Hex.toString(${hex})`,
      )
      const bytes = call('ox:Bytes.fromString', value, options)
      same('ox:Bytes.fromString', toHex(bytes), hex, 'Bytes.fromString')
      same(
        'ox:Bytes.toString',
        call('ox:Bytes.toString', bytes, options),
        value,
        'Bytes.toString',
      )
    },
  })

  add({
    id: 'round trip: booleans through Hex and Bytes',
    oracle: 'round trip',
    covers: [
      'ox:Hex.fromBoolean',
      'ox:Hex.toBoolean',
      'ox:Bytes.fromBoolean',
      'ox:Bytes.toBoolean',
    ],
    runs: 50,
    arb: fc.tuple(fc.boolean(), fc.option(fc.integer({ min: 1, max: 32 }))),
    check([value, size]: [boolean, number | null]) {
      const options = size ? { size } : {}
      const hex = call('ox:Hex.fromBoolean', value, options)
      same(
        'ox:Hex.toBoolean',
        call('ox:Hex.toBoolean', hex, options),
        value,
        'Hex.toBoolean',
      )
      const bytes = call('ox:Bytes.fromBoolean', value, options)
      same(
        'ox:Bytes.toBoolean',
        call('ox:Bytes.toBoolean', bytes, options),
        value,
        'Bytes.toBoolean',
      )
    },
  })

  add({
    id: 'consistency: pad, trim, slice, and concat agree between Hex and Bytes',
    oracle: 'consistency',
    covers: [
      'ox:Hex.padLeft',
      'ox:Hex.padRight',
      'ox:Hex.trimLeft',
      'ox:Hex.trimRight',
      'ox:Hex.slice',
      'ox:Hex.concat',
      'ox:Bytes.padLeft',
      'ox:Bytes.padRight',
      'ox:Bytes.trimLeft',
      'ox:Bytes.trimRight',
      'ox:Bytes.slice',
      'ox:Bytes.concat',
      'ox:Bytes.fromArray',
    ],
    runs: 300,
    arb: fc.record({
      bytes: bytesOf(0, 40),
      other: bytesOf(0, 10),
      size: fc.integer({ min: 0, max: 48 }),
      start: fc.integer({ min: 0, max: 45 }),
      end: fc.integer({ min: 0, max: 45 }),
    }),
    check({ bytes, other, size, start, end }) {
      const hex = toHex(bytes)
      for (const side of ['Left', 'Right'] as const) {
        if (size >= bytes.length) {
          const h = call(`ox:Hex.pad${side}`, hex, size)
          const b = call(`ox:Bytes.pad${side}`, bytes, size)
          same(`ox:Hex.pad${side}`, h, toHex(b), `pad${side}`)
          same(`ox:Hex.pad${side}`, h.length, 2 + size * 2, `pad${side} size`)
        }
        const h = call(`ox:Hex.trim${side}`, hex)
        const b = call(`ox:Bytes.trim${side}`, bytes)
        // Hex trims nibbles where Bytes trims bytes, so compare by value.
        same(
          [`ox:Hex.trim${side}`, `ox:Bytes.trim${side}`],
          bigOf(h, side),
          bigOf(toHex(b), side),
          `trim${side} of ${hex}`,
        )
      }
      // A start at the end is out of bounds unless the value is empty, for both Hex and Bytes.
      if (
        (start < bytes.length || start === 0) &&
        end <= bytes.length &&
        start <= end
      ) {
        same(
          'ox:Hex.slice',
          call('ox:Hex.slice', hex, start, end),
          toHex(bytes.slice(start, end)),
          `Hex.slice(${hex}, ${start}, ${end})`,
        )
        same(
          'ox:Bytes.slice',
          call('ox:Bytes.slice', bytes, start, end),
          bytes.slice(start, end),
          `Bytes.slice(${start}, ${end})`,
        )
      }
      same(
        'ox:Hex.concat',
        call('ox:Hex.concat', hex, toHex(other)),
        toHex(Uint8Array.from([...bytes, ...other])),
        'Hex.concat',
      )
      same(
        'ox:Bytes.concat',
        call('ox:Bytes.concat', bytes, other),
        Uint8Array.from([...bytes, ...other]),
        'Bytes.concat',
      )
      same(
        'ox:Bytes.fromArray',
        call('ox:Bytes.fromArray', [...bytes]),
        bytes,
        'Bytes.fromArray',
      )
    },
  })

  // -------------------------------------------------------------------------------------------
  // RLP.

  type RlpValue = string | RlpValue[]
  const rlpArb: Arbitrary<RlpValue> = fc.letrec<{ value: RlpValue }>((tie) => ({
    value: fc.oneof(
      { depthSize: 'small' },
      fc.oneof(
        hexOf(0, 3),
        hexOf(54, 58),
        fc.constantFrom('0x', '0x00', '0x7f', '0x80', '0xff'),
      ),
      fc.array(tie('value'), { maxLength: 4 }),
    ),
  })).value
  add({
    id: 'differential: RLP encoding against ethers and viem',
    oracle: 'differential',
    covers: [
      'ox:Rlp.from',
      'ox:Rlp.fromHex',
      'ox:Rlp.fromBytes',
      'ox:Rlp.toHex',
      'ox:Rlp.toBytes',
      'ox:Rlp.to',
    ],
    runs: 400,
    arb: rlpArb,
    check(value) {
      const encoded = call('ox:Rlp.fromHex', value)
      vote(
        'ox:Rlp.fromHex',
        {
          ox: encoded,
          ethers: attempt(() => ethers.encodeRlp(value)),
          viem: attempt(() => viem.toRlp(value)),
        },
        'RLP encoding',
      )
      same(
        'ox:Rlp.from',
        call('ox:Rlp.from', value, { as: 'Hex' }),
        encoded,
        'Rlp.from',
      )
      same(
        'ox:Rlp.fromBytes',
        toHex(call('ox:Rlp.fromBytes', mapHex(value, hexBytes))),
        encoded,
        'Rlp.fromBytes',
      )
      same('ox:Rlp.toHex', call('ox:Rlp.toHex', encoded), value, 'Rlp.toHex')
      same(
        'ox:Rlp.toBytes',
        mapBytes(call('ox:Rlp.toBytes', hexBytes(encoded)), toHex),
        value,
        'Rlp.toBytes',
      )
      same('ox:Rlp.to', call('ox:Rlp.to', encoded, 'Hex'), value, 'Rlp.to')
    },
  })
  add({
    id: 'differential: RLP decoding of malformed input against ethers',
    oracle: 'differential',
    covers: ['ox:Rlp.toHex', 'ox:Rlp.toBytes'],
    runs: 400,
    arb: fc
      .tuple(
        rlpArb,
        fc.nat(),
        fc.integer({ min: 0, max: 5 }),
        fc.uint8Array({ minLength: 1, maxLength: 3 }),
      )
      .map(([value, at, how, junk]) => {
        const bytes = hexBytes(ethers.encodeRlp(value))
        const index = bytes.length ? at % bytes.length : 0
        const out = [...bytes]
        if (how === 0) out.splice(index, 1)
        else if (how === 1) out.push(...junk)
        else if (how === 2) out[index] = junk[0]!
        else if (how === 3) out.splice(index, 0, junk[0]!)
        else if (how === 4) out.length = index
        else out.unshift(0x81, junk[0]! & 0x7f)
        return toHex(Uint8Array.from(out))
      }),
    check(hex) {
      if (hex === '0x') return
      const expected = attempt(() => ethers.decodeRlp(hex))
      let actual: unknown
      try {
        actual = fn('ox:Rlp.toHex')(hex)
      } catch (error) {
        if (!documented(error)) throw crash('ox:Rlp.toHex', error)
        // ethers accepts non-canonical encodings, such as a single byte below 0x80 behind a
        // length prefix (`0x8100`); rejecting them is stricter, not wrong.
        if (
          expected !== undefined &&
          ethers.encodeRlp(expected as never) === hex
        )
          throw new Failure(
            `Rlp.toHex rejected ${hex}, which ethers decodes to ${show(expected)}`,
            { blame: ['ox:Rlp.toHex'] },
          )
        return
      }
      if (expected === undefined)
        throw new Failure(
          `Rlp.toHex accepted ${hex}, which ethers rejects, and returned ${show(actual)}`,
          { blame: ['ox:Rlp.toHex'], kind: 'accepted invalid input' },
        )
      same('ox:Rlp.toHex', actual, expected, `Rlp.toHex(${hex})`)
    },
  })
  add({
    id: 'differential: RLP encoding of malformed hex leaves against ethers',
    oracle: 'differential',
    covers: ['ox:Rlp.from', 'ox:Rlp.fromHex'],
    runs: 400,
    // One malformed leaf beside a valid value: an even-length leaf with a non-hex digit, without
    // its `0x` prefix, with an uppercase `0X`, or an empty string. ethers rejects each.
    arb: fc
      .tuple(
        rlpArb,
        hexOf(1, 33),
        fc.nat(),
        fc.constantFrom('g', 'z', 'x', ' ', '-'),
        fc.integer({ min: 0, max: 3 }),
        fc.boolean(),
      )
      .map(([value, leaf, at, digit, how, first]) => {
        const body = leaf.slice(2)
        const index = at % body.length
        const bad =
          how === 0
            ? `0x${body.slice(0, index)}${digit}${body.slice(index + 1)}`
            : how === 1
              ? body
              : how === 2
                ? `0X${body}`
                : ''
        return first ? [bad, value] : [value, bad]
      }),
    check(value) {
      if (attempt(() => ethers.encodeRlp(value as never)) !== undefined) return
      for (const [name, as] of [
        ['ox:Rlp.fromHex', 'Hex'],
        ['ox:Rlp.from', 'Bytes'],
      ] as const) {
        let actual: unknown
        try {
          actual = fn('ox:Rlp.from')(value, { as })
        } catch (error) {
          if (!documented(error)) throw crash(name, error)
          continue
        }
        throw new Failure(
          `Rlp.from(${show(value)}, { as: '${as}' }) returned ${show(actual)} for a malformed leaf, which ethers rejects`,
          { blame: [name], kind: 'accepted invalid input' },
        )
      }
    },
  })

  // -------------------------------------------------------------------------------------------
  // ABI.

  add({
    id: 'differential: AbiParameters.encode against viem and ethers, and decode back',
    oracle: 'differential',
    covers: [
      'ox:AbiParameters.encode',
      'ox:AbiParameters.decode',
      'ox:AbiParameters.format',
      'ox:AbiParameters.from',
      'ox:AbiParameter.format',
      'ox:AbiParameter.from',
    ],
    runs: 400,
    arb: paramsWithValues,
    check([params, values]: [Param[], unknown[]]) {
      const encoded = call('ox:AbiParameters.encode', params, values)
      vote(
        'ox:AbiParameters.encode',
        {
          ox: encoded,
          viem: attempt(() => viem.encodeAbiParameters(params, values)),
          ethers: attempt(() =>
            ethers.AbiCoder.defaultAbiCoder().encode(
              params.map(typeString),
              params.map((param, i) => toEthers(param, values[i])),
            ),
          ),
        },
        'ABI encoding',
      )
      same(
        'ox:AbiParameters.decode',
        canonical(call('ox:AbiParameters.decode', params, encoded)),
        canonical(values),
        'AbiParameters.decode',
      )
      // An empty list formats as '', which is no signature to parse.
      if (!params.length) return
      const formatted = call('ox:AbiParameters.format', params)
      const parsed = call('ox:AbiParameters.from', formatted)
      same(
        ['ox:AbiParameters.from', 'ox:AbiParameters.format'],
        call('ox:AbiParameters.encode', parsed, values),
        encoded,
        `AbiParameters.from(AbiParameters.format(...)) = ${formatted}`,
      )
      for (const param of params) {
        const one = call('ox:AbiParameter.format', param)
        call('ox:AbiParameter.from', one)
      }
    },
  })
  add({
    id: 'differential: ABI decoding of malformed data against ethers',
    oracle: 'differential',
    covers: ['ox:AbiParameters.decode'],
    runs: 300,
    arb: paramsWithValues
      .filter(([params]) => params.length > 0)
      .chain(([params, values]) =>
        fc.tuple(
          fc.constant(params),
          fc.constant(values),
          fc.nat(),
          fc.integer({ min: 0, max: 3 }),
          fc.uint8Array({ minLength: 1, maxLength: 32 }),
        ),
      )
      .map(([params, values, at, how, junk]) => {
        const bytes = [
          ...hexBytes(
            ethers.AbiCoder.defaultAbiCoder().encode(
              params.map(typeString),
              params.map((param: Param, i: number) =>
                toEthers(param, values[i]),
              ),
            ),
          ),
        ]
        const index = bytes.length ? at % bytes.length : 0
        if (how === 0) bytes.splice(index, 32)
        else if (how === 1) bytes.splice(index, junk.length, ...junk)
        else if (how === 2) bytes.length = index
        else bytes.splice(index, 0, ...junk)
        return [params, toHex(Uint8Array.from(bytes))] as const
      }),
    check([params, data]: readonly [Param[], string]) {
      const expected = attempt(() =>
        ethers.AbiCoder.defaultAbiCoder().decode(params.map(typeString), data),
      )
      let actual: unknown
      try {
        actual = fn('ox:AbiParameters.decode')(params, data)
      } catch (error) {
        if (!documented(error)) throw crash('ox:AbiParameters.decode', error)
        return
      }
      // ethers masks out-of-range integers and reads past dirty padding, so only a value both
      // decode is compared.
      if (expected === undefined) return
      // ethers defers some decoding errors until a value is read.
      const reference = attempt(() =>
        params.map((param, i) => fromEthers(param, expected[i])),
      )
      if (reference === undefined) return
      if (!equal(canonical(actual), reference)) {
        // ethers accepts non-canonical bools and integers; ox rejecting is not a disagreement
        // worth a failure, but returning a different value is.
        throw new Failure(
          `AbiParameters.decode returned ${show(actual)}, ethers ${show(reference)}`,
          { blame: ['ox:AbiParameters.decode'] },
        )
      }
    },
  })
  add({
    id: 'differential: AbiParameters.encodePacked against viem and ethers',
    oracle: 'differential',
    covers: ['ox:AbiParameters.encodePacked'],
    runs: 300,
    arb: fc
      .array(elementary, { minLength: 1, maxLength: 4 })
      .chain((types) =>
        fc.tuple(
          fc.constant(types),
          fc.tuple(...types.map((type) => arbitraryOf({ type }))),
        ),
      ),
    check([types, values]: [string[], unknown[]]) {
      const packed = call('ox:AbiParameters.encodePacked', types, values)
      vote(
        'ox:AbiParameters.encodePacked',
        {
          ox: packed,
          viem: attempt(() => viem.encodePacked(types, values)),
          ethers: attempt(() => ethers.solidityPacked(types, values)),
        },
        `encodePacked(${types.join(', ')})`,
      )
    },
  })

  /** A random function ABI item with arguments and a result for it. */
  const fnAbi = fc
    .record({
      name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,12}$/),
      inputs: paramsWithValues,
      outputs: paramsWithValues,
    })
    .map(({ name, inputs, outputs }) => ({
      item: {
        type: 'function',
        name,
        stateMutability: 'nonpayable',
        inputs: inputs[0],
        outputs: outputs[0],
      } as Any,
      args: inputs[1],
      result: outputs[1],
    }))
  add({
    id: 'differential: AbiFunction calldata and results against viem',
    oracle: 'differential',
    covers: [
      'ox:AbiFunction.encodeData',
      'ox:AbiFunction.decodeData',
      'ox:AbiFunction.encodeResult',
      'ox:AbiFunction.decodeResult',
      'ox:AbiFunction.getSelector',
      'ox:AbiFunction.format',
      'ox:AbiFunction.from',
      'ox:AbiFunction.fromAbi',
      'ox:AbiItem.getSelector',
      'ox:AbiItem.getSignature',
      'ox:AbiItem.getSignatureHash',
      'ox:AbiItem.format',
      'ox:AbiItem.from',
      'ox:AbiItem.fromAbi',
      'ox:Abi.from',
      'ox:Abi.format',
    ],
    runs: 300,
    arb: fnAbi,
    check({ item, args, result }) {
      const abi = [item]
      const data = call('ox:AbiFunction.encodeData', item, args)
      vote(
        'ox:AbiFunction.encodeData',
        {
          ox: data,
          viem: attempt(() =>
            viem.encodeFunctionData({ abi, functionName: item.name, args }),
          ),
        },
        'calldata',
      )
      same(
        'ox:AbiFunction.decodeData',
        canonical(call('ox:AbiFunction.decodeData', item, data) ?? []),
        canonical(args),
        'AbiFunction.decodeData',
      )
      const value = item.outputs.length === 1 ? result[0] : result
      const encoded = call('ox:AbiFunction.encodeResult', item, value)
      // A function without outputs decodes to `undefined`.
      same(
        'ox:AbiFunction.decodeResult',
        canonical(call('ox:AbiFunction.decodeResult', item, encoded)),
        item.outputs.length ? canonical(value) : undefined,
        'AbiFunction.decodeResult',
      )
      const selector = call('ox:AbiFunction.getSelector', item)
      vote(
        'ox:AbiFunction.getSelector',
        {
          ox: selector,
          viem: attempt(() => viem.toFunctionSelector(item)),
          ethers: attempt(() => ethers.FunctionFragment.from(item).selector),
        },
        'selector',
      )
      same(
        'ox:AbiItem.getSelector',
        call('ox:AbiItem.getSelector', item),
        selector,
        'AbiItem.getSelector',
      )
      same(
        'ox:AbiItem.getSignatureHash',
        call('ox:AbiItem.getSignatureHash', item).slice(0, 10),
        selector,
        'AbiItem.getSignatureHash',
      )
      const signature = call('ox:AbiItem.getSignature', item)
      same(
        'ox:AbiItem.getSignature',
        call('ox:AbiFunction.getSelector', signature),
        selector,
        `getSelector(${signature})`,
      )
      const formatted = call('ox:AbiFunction.format', item)
      const parsed = call('ox:AbiFunction.from', formatted)
      same(
        ['ox:AbiFunction.from', 'ox:AbiFunction.format'],
        call('ox:AbiFunction.getSelector', parsed),
        selector,
        `AbiFunction.from(${formatted})`,
      )
      same(
        'ox:AbiItem.format',
        call('ox:AbiItem.format', item),
        formatted,
        'AbiItem.format',
      )
      call('ox:AbiItem.from', formatted)
      const fromAbi = call('ox:AbiFunction.fromAbi', abi, item.name)
      same('ox:AbiFunction.fromAbi', fromAbi.name, item.name, 'fromAbi')
      call('ox:AbiItem.fromAbi', abi, item.name)
      const formattedAbi = call('ox:Abi.format', abi)
      call('ox:Abi.from', formattedAbi)
    },
  })

  /** A random event ABI item with arguments for it. */
  const eventAbi = fc
    .record({
      name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,12}$/),
      params: fc.array(fc.tuple(elementary, fc.boolean()), { maxLength: 4 }),
    })
    .chain(({ name, params }) => {
      const inputs = params.map(([type, indexed], i) => ({
        type,
        name: `a${i}`,
        indexed: indexed && i < 3,
      }))
      return fc.tuple(
        fc.constant({ type: 'event', name, inputs } as Any),
        fc.tuple(...inputs.map((input) => arbitraryOf(input))),
      )
    })
  add({
    id: 'differential: AbiEvent topics and logs against viem',
    oracle: 'differential',
    covers: [
      'ox:AbiEvent.encode',
      'ox:AbiEvent.decode',
      'ox:AbiEvent.getSelector',
      'ox:AbiEvent.format',
      'ox:AbiEvent.from',
      'ox:AbiEvent.assertArgs',
    ],
    runs: 300,
    arb: eventAbi,
    check([event, values]: [Any, unknown[]]) {
      const args = Object.fromEntries(
        event.inputs.map((input: Any, i: number) => [input.name, values[i]]),
      )
      const indexedArgs = Object.fromEntries(
        event.inputs
          .filter((input: Any) => input.indexed)
          .map((input: Any) => [input.name, args[input.name]]),
      )
      const { topics } = call('ox:AbiEvent.encode', event, indexedArgs)
      vote(
        'ox:AbiEvent.encode',
        {
          ox: topics,
          viem: attempt(() =>
            viem.encodeEventTopics({
              abi: [event],
              eventName: event.name,
              args: indexedArgs,
            }),
          ),
        },
        'event topics',
      )
      const plain = event.inputs.filter((input: Any) => !input.indexed)
      const data = call(
        'ox:AbiParameters.encode',
        plain,
        plain.map((input: Any) => args[input.name]),
      )
      const decoded = call('ox:AbiEvent.decode', event, { data, topics })
      // Dynamic indexed values decode to their hash.
      const expected = Object.fromEntries(
        event.inputs.map((input: Any) => [
          input.name,
          input.indexed && /^(bytes|string)$/.test(input.type)
            ? fn('ox:Hash.keccak256')(
                input.type === 'string'
                  ? fn('ox:Hex.fromString')(args[input.name])
                  : args[input.name],
              )
            : args[input.name],
        ]),
      )
      if (event.inputs.length)
        same(
          'ox:AbiEvent.decode',
          canonical(decoded),
          canonical(expected),
          'AbiEvent.decode',
        )
      const formatted = call('ox:AbiEvent.format', event)
      same(
        ['ox:AbiEvent.from', 'ox:AbiEvent.format'],
        call('ox:AbiEvent.getSelector', call('ox:AbiEvent.from', formatted)),
        topics[0],
        `AbiEvent.from(${formatted})`,
      )
      // `assertArgs` matches given values against decoded ones, which hold a dynamic indexed
      // value's hash.
      if (event.inputs.length)
        call('ox:AbiEvent.assertArgs', event, decoded, indexedArgs)
    },
  })

  add({
    id: 'round trip: AbiError and AbiConstructor encode and decode',
    oracle: 'round trip',
    covers: [
      'ox:AbiError.encode',
      'ox:AbiError.decode',
      'ox:AbiError.getSelector',
      'ox:AbiError.format',
      'ox:AbiError.from',
      'ox:AbiConstructor.encode',
      'ox:AbiConstructor.decode',
      'ox:AbiConstructor.format',
      'ox:AbiConstructor.from',
    ],
    runs: 200,
    arb: fc.tuple(
      fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,12}$/),
      paramsWithValues,
      hexOf(0, 40),
    ),
    check([name, [params, values], bytecode]: [
      string,
      [Param[], unknown[]],
      string,
    ]) {
      const error = { type: 'error', name, inputs: params } as Any
      const data = call('ox:AbiError.encode', error, values)
      vote(
        'ox:AbiError.encode',
        {
          ox: data,
          viem: attempt(() =>
            viem.encodeErrorResult({
              abi: [error],
              errorName: name,
              args: values,
            }),
          ),
        },
        'error data',
      )
      const decoded = call('ox:AbiError.decode', error, data)
      same(
        'ox:AbiError.decode',
        canonical(params.length === 1 ? [decoded] : (decoded ?? [])),
        canonical(values),
        'AbiError.decode',
      )
      same(
        ['ox:AbiError.from', 'ox:AbiError.format'],
        call(
          'ox:AbiError.getSelector',
          call('ox:AbiError.from', call('ox:AbiError.format', error)),
        ),
        data.slice(0, 10),
        'AbiError.from(format(...))',
      )
      const ctor = {
        type: 'constructor',
        stateMutability: 'nonpayable',
        inputs: params,
      } as Any
      const deploy = call('ox:AbiConstructor.encode', ctor, {
        bytecode,
        args: values,
      })
      same(
        'ox:AbiConstructor.decode',
        canonical(
          call('ox:AbiConstructor.decode', ctor, { bytecode, data: deploy }) ??
            [],
        ),
        canonical(values),
        'AbiConstructor.decode',
      )
      call('ox:AbiConstructor.from', call('ox:AbiConstructor.format', ctor))
    },
  })

  // -------------------------------------------------------------------------------------------
  // Addresses, hashes, and encodings.

  add({
    id: 'differential: Address.checksum against viem and ethers',
    oracle: 'differential',
    covers: [
      'ox:Address.checksum',
      'ox:Address.from',
      'ox:Address.validate',
      'ox:Address.assert',
      'ox:Address.isEqual',
    ],
    runs: 300,
    arb: address,
    check(value) {
      const checksummed = call('ox:Address.checksum', value)
      vote(
        'ox:Address.checksum',
        {
          ox: checksummed,
          viem: attempt(() => viem.getAddress(value)),
          ethers: attempt(() => ethers.getAddress(value)),
        },
        'checksum',
      )
      same(
        'ox:Address.from',
        call('ox:Address.from', value, { checksum: true }),
        checksummed,
        'Address.from',
      )
      same(
        'ox:Address.validate',
        call('ox:Address.validate', checksummed),
        true,
        'validate(checksummed)',
      )
      call('ox:Address.assert', value)
      same(
        'ox:Address.isEqual',
        call('ox:Address.isEqual', value, checksummed),
        true,
        'isEqual',
      )
      // A wrong checksum is rejected when the address has letters to check.
      const flipped = checksummed.replace(/[a-fA-F]/, (c: string) =>
        c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(),
      )
      if (
        flipped !== checksummed &&
        flipped.toLowerCase() !== flipped &&
        flipped.toUpperCase().replace('0X', '0x') !== flipped
      )
        same(
          'ox:Address.validate',
          call('ox:Address.validate', flipped),
          false,
          `validate(${flipped}), a wrong checksum`,
        )
    },
  })

  add({
    id: 'differential: hashes against noble and ethers',
    oracle: 'differential',
    covers: [
      'ox:Hash.keccak256',
      'ox:Hash.sha256',
      'ox:Hash.ripemd160',
      'ox:Hash.blake3',
      'ox:Hash.hmac256',
      'ox:Hash.createKeccak256',
      'ox:Hash.createSha256',
      'ox:Hash.createRipemd160',
      'ox:Hash.createBlake3',
      'ox:Hash.createHmac256',
      'ox:Hash.validate',
    ],
    runs: 200,
    arb: fc.tuple(bytesOf(0, 300), bytesOf(0, 80), fc.nat()),
    check([bytes, key, split]: [Uint8Array, Uint8Array, number]) {
      const hex = toHex(bytes)
      const at = bytes.length ? split % bytes.length : 0
      const streamed = (name: string, ...args: unknown[]) => {
        const hasher = call(name, ...args)
        hasher.update(bytes.subarray(0, at))
        hasher.update(bytes.subarray(at))
        // ox's hashers digest to hex by default.
        const digest = hasher.digest()
        return typeof digest === 'string' ? digest : toHex(digest)
      }
      const cases: [string, string, () => unknown, string][] = [
        [
          'keccak256',
          toHex(noble.sha3.keccak_256(bytes)),
          () => call('ox:Hash.keccak256', hex),
          'ox:Hash.createKeccak256',
        ],
        [
          'sha256',
          toHex(noble.sha2.sha256(bytes)),
          () => call('ox:Hash.sha256', hex),
          'ox:Hash.createSha256',
        ],
        [
          'ripemd160',
          toHex(noble.legacy.ripemd160(bytes)),
          () => call('ox:Hash.ripemd160', hex),
          'ox:Hash.createRipemd160',
        ],
        [
          'blake3',
          toHex(noble.blake3.blake3(bytes)),
          () => call('ox:Hash.blake3', hex),
          'ox:Hash.createBlake3',
        ],
      ]
      for (const [name, expected, actual, create] of cases) {
        same(`ox:Hash.${name}`, actual(), expected, `Hash.${name}`)
        same(create, streamed(create), expected, `${create} in two updates`)
      }
      same(
        'ox:Hash.keccak256',
        toHex(call('ox:Hash.keccak256', bytes)),
        toHex(noble.sha3.keccak_256(bytes)),
        'Hash.keccak256 of bytes',
      )
      const mac = toHex(noble.hmac.hmac(noble.sha2.sha256, key, bytes))
      same(
        'ox:Hash.hmac256',
        call('ox:Hash.hmac256', toHex(key), hex),
        mac,
        'Hash.hmac256',
      )
      same(
        'ox:Hash.createHmac256',
        streamed('ox:Hash.createHmac256', key),
        mac,
        'createHmac256 in two updates',
      )
      same(
        'ox:Hash.validate',
        call('ox:Hash.validate', call('ox:Hash.keccak256', hex)),
        true,
        'Hash.validate',
      )
    },
  })

  add({
    id: 'differential: Base58, Base64, and Base32 against ethers and Node',
    oracle: 'differential',
    covers: [
      'ox:Base58.fromBytes',
      'ox:Base58.fromHex',
      'ox:Base58.fromString',
      'ox:Base58.toBytes',
      'ox:Base58.toHex',
      'ox:Base58.toString',
      'ox:Base64.fromBytes',
      'ox:Base64.fromHex',
      'ox:Base64.fromString',
      'ox:Base64.toBytes',
      'ox:Base64.toHex',
      'ox:Base64.toString',
      'ox:Base32.fromBytes',
      'ox:Base32.fromHex',
      'ox:Base32.toBytes',
      'ox:Base32.toHex',
    ],
    runs: 300,
    arb: fc.tuple(bytesOf(0, 60), fc.boolean(), fc.boolean(), text),
    check([bytes, url, pad, string]: [Uint8Array, boolean, boolean, string]) {
      const hex = toHex(bytes)
      const b58 = call('ox:Base58.fromBytes', bytes)
      vote(
        'ox:Base58.fromBytes',
        { ox: b58, ethers: attempt(() => ethers.encodeBase58(bytes)) },
        'Base58',
      )
      same('ox:Base58.fromHex', call('ox:Base58.fromHex', hex), b58, 'fromHex')
      same(
        'ox:Base58.toBytes',
        call('ox:Base58.toBytes', b58),
        bytes,
        'toBytes',
      )
      same('ox:Base58.toHex', call('ox:Base58.toHex', b58), hex, 'toHex')
      same(
        'ox:Base58.toString',
        call('ox:Base58.toString', call('ox:Base58.fromString', string)),
        string,
        'Base58 string round trip',
      )
      const b64 = call('ox:Base64.fromBytes', bytes, { url, pad })
      let expected = Buffer.from(bytes).toString(url ? 'base64url' : 'base64')
      if (!url && !pad) expected = expected.replace(/=+$/, '')
      if (url && pad) expected += '='.repeat((4 - (expected.length % 4)) % 4)
      same('ox:Base64.fromBytes', b64, expected, `Base64 ${show({ url, pad })}`)
      same(
        'ox:Base64.fromHex',
        call('ox:Base64.fromHex', hex, { url, pad }),
        b64,
        'Base64.fromHex',
      )
      same(
        'ox:Base64.toBytes',
        call('ox:Base64.toBytes', b64),
        bytes,
        'toBytes',
      )
      same('ox:Base64.toHex', call('ox:Base64.toHex', b64), hex, 'toHex')
      same(
        'ox:Base64.toString',
        call('ox:Base64.toString', call('ox:Base64.fromString', string)),
        string,
        'Base64 string round trip',
      )
      const b32 = call('ox:Base32.fromBytes', bytes)
      same('ox:Base32.fromHex', call('ox:Base32.fromHex', hex), b32, 'fromHex')
      same(
        'ox:Base32.toBytes',
        call('ox:Base32.toBytes', b32),
        bytes,
        'toBytes',
      )
      same('ox:Base32.toHex', call('ox:Base32.toHex', b32), hex, 'toHex')
    },
  })

  add({
    id: 'round trip: Bech32m and CompactSize',
    oracle: 'round trip',
    covers: [
      'ox:Bech32m.encode',
      'ox:Bech32m.decode',
      'ox:CompactSize.toBytes',
      'ox:CompactSize.toHex',
      'ox:CompactSize.fromBytes',
      'ox:CompactSize.fromHex',
    ],
    runs: 300,
    arb: fc.tuple(
      fc.stringMatching(/^[a-z]{1,10}$/),
      bytesOf(0, 40),
      fc.oneof(
        fc.constantFrom(0, 252, 253, 0xffff, 0x10000, 0xffffffff, 0x100000000),
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
      ),
    ),
    check([hrp, data, size]: [string, Uint8Array, number]) {
      const encoded = call('ox:Bech32m.encode', hrp, data)
      same(
        'ox:Bech32m.decode',
        call('ox:Bech32m.decode', encoded),
        { hrp, data },
        'Bech32m.decode',
      )
      const hex = call('ox:CompactSize.toHex', size)
      same(
        'ox:CompactSize.toBytes',
        toHex(call('ox:CompactSize.toBytes', size)),
        hex,
        'CompactSize.toBytes',
      )
      const decoded = call('ox:CompactSize.fromHex', hex)
      same(
        'ox:CompactSize.fromHex',
        [BigInt(decoded.value), decoded.size],
        [BigInt(size), hex.length / 2 - 1],
        'CompactSize.fromHex',
      )
      const fromBytes = call('ox:CompactSize.fromBytes', hexBytes(hex))
      same(
        'ox:CompactSize.fromBytes',
        BigInt(fromBytes.value),
        BigInt(size),
        'CompactSize.fromBytes',
      )
    },
  })

  type Cbor =
    | null
    | boolean
    | number
    | string
    | Uint8Array
    | Cbor[]
    | { [key: string]: Cbor }
  const cborArb: Arbitrary<Cbor> = fc.letrec<{ value: Cbor }>((tie) => ({
    value: fc.oneof(
      { depthSize: 'small' },
      fc.constantFrom(null, true, false),
      fc.integer({ min: -(2 ** 31), max: 2 ** 31 }),
      // ox encodes integers up to 32 bits and says so with `NumberTooLargeError`.
      fc.integer({ min: 0, max: 2 ** 32 - 1 }),
      fc
        .double({ noNaN: true, noDefaultInfinity: true })
        .filter(
          (value) => !Number.isInteger(value) || Math.abs(value) < 2 ** 32,
        ),
      text,
      bytesOf(0, 20),
      fc.array(tie('value'), { maxLength: 4 }),
      fc.dictionary(fc.string({ maxLength: 6 }), tie('value'), {
        maxKeys: 4,
      }),
    ),
  })).value
  add({
    id: 'round trip: Cbor.encode and Cbor.decode',
    oracle: 'round trip',
    covers: ['ox:Cbor.encode', 'ox:Cbor.decode'],
    runs: 300,
    arb: cborArb,
    check(value) {
      const encoded = call('ox:Cbor.encode', value)
      same('ox:Cbor.decode', call('ox:Cbor.decode', encoded), value, 'Cbor')
    },
  })

  add({
    id: 'round trip: Json.stringify and Json.parse with bigints',
    oracle: 'round trip',
    covers: ['ox:Json.stringify', 'ox:Json.parse', 'ox:Json.canonicalize'],
    runs: 200,
    arb: fc
      .jsonValue()
      .chain((json) =>
        fc.tuple(fc.constant(json), fc.bigInt(), fc.string({ maxLength: 8 })),
      ),
    check([json, big, key]: [unknown, bigint, string]) {
      const value = { json, big, [`k${key}`]: [big, json] }
      same(
        'ox:Json.parse',
        call('ox:Json.parse', call('ox:Json.stringify', value)),
        value,
        'Json round trip',
      )
      const canonical = call('ox:Json.canonicalize', json)
      same(
        'ox:Json.canonicalize',
        JSON.parse(canonical),
        JSON.parse(JSON.stringify(json)),
        'Json.canonicalize keeps the value',
      )
    },
  })

  add({
    id: 'differential: Value.format and Value.from against viem and ethers',
    oracle: 'differential',
    covers: [
      'ox:Value.format',
      'ox:Value.from',
      'ox:Value.formatEther',
      'ox:Value.fromEther',
      'ox:Value.formatGwei',
      'ox:Value.fromGwei',
    ],
    runs: 400,
    arb: fc.tuple(
      fc.bigInt({ min: -(2n ** 200n), max: 2n ** 200n }),
      fc.integer({ min: 0, max: 36 }),
    ),
    check([value, decimals]: [bigint, number]) {
      const formatted = call('ox:Value.format', value, decimals)
      vote(
        'ox:Value.format',
        {
          ox: formatted,
          viem: attempt(() => viem.formatUnits(value, decimals)),
        },
        `Value.format(${value}, ${decimals})`,
      )
      same(
        'ox:Value.from',
        call('ox:Value.from', formatted, decimals),
        value,
        `Value.from(${formatted}, ${decimals})`,
      )
      same(
        'ox:Value.formatEther',
        call('ox:Value.formatEther', value),
        call('ox:Value.format', value, 18),
        'formatEther',
      )
      same(
        'ox:Value.fromEther',
        call('ox:Value.fromEther', call('ox:Value.formatEther', value)),
        value,
        'fromEther',
      )
      same(
        'ox:Value.fromGwei',
        call('ox:Value.fromGwei', call('ox:Value.formatGwei', value)),
        value,
        'fromGwei',
      )
    },
  })
  add({
    id: 'differential: Value.from rounding against viem',
    oracle: 'differential',
    covers: ['ox:Value.from'],
    runs: 300,
    arb: fc.tuple(
      fc.stringMatching(/^-?[0-9]{1,20}(\.[0-9]{0,30})?$/),
      fc.integer({ min: 0, max: 24 }),
    ),
    check([value, decimals]: [string, number]) {
      vote(
        'ox:Value.from',
        {
          ox: call('ox:Value.from', value, decimals),
          viem: attempt(() => viem.parseUnits(value, decimals)),
        },
        `Value.from(${JSON.stringify(value)}, ${decimals})`,
      )
    },
  })

  add({
    id: 'differential: Ens.namehash and Ens.labelhash against viem and ethers',
    oracle: 'differential',
    covers: ['ox:Ens.namehash', 'ox:Ens.labelhash', 'ox:Ens.normalize'],
    runs: 200,
    arb: fc
      .array(fc.stringMatching(/^[a-z0-9-]{1,12}$/), {
        minLength: 1,
        maxLength: 4,
      })
      .map((labels) => labels.join('.')),
    check(name) {
      vote(
        'ox:Ens.namehash',
        {
          ox: call('ox:Ens.namehash', name),
          viem: attempt(() => viem.namehash(name)),
          ethers: attempt(() => ethers.namehash(name)),
        },
        `namehash(${name})`,
      )
      const label = name.split('.')[0]!
      vote(
        'ox:Ens.labelhash',
        {
          ox: call('ox:Ens.labelhash', label),
          viem: attempt(() => viem.labelhash(label)),
        },
        `labelhash(${label})`,
      )
      const normalized = attempt(() => ethers.ensNormalize(name))
      if (normalized !== undefined)
        same(
          'ox:Ens.normalize',
          call('ox:Ens.normalize', name),
          normalized,
          `normalize(${name})`,
        )
    },
  })

  add({
    id: 'differential: ContractAddress against viem and ethers',
    oracle: 'differential',
    covers: [
      'ox:ContractAddress.fromCreate',
      'ox:ContractAddress.fromCreate2',
      'ox:ContractAddress.from',
    ],
    runs: 200,
    arb: fc.tuple(address, quantity, hash, hexOf(0, 60)),
    check([from, nonce, salt, bytecode]: [string, bigint, string, string]) {
      const created = call('ox:ContractAddress.fromCreate', { from, nonce })
      vote(
        'ox:ContractAddress.fromCreate',
        {
          ox: created,
          // ox returns lower-case addresses unless asked to checksum.
          viem: attempt(() =>
            viem.getContractAddress({ from, nonce }).toLowerCase(),
          ),
          ethers: attempt(() =>
            ethers.getCreateAddress({ from, nonce }).toLowerCase(),
          ),
        },
        `fromCreate(${from}, ${nonce})`,
      )
      same(
        'ox:ContractAddress.from',
        call('ox:ContractAddress.from', { from, nonce }),
        created,
        'ContractAddress.from',
      )
      const create2 = call('ox:ContractAddress.fromCreate2', {
        from,
        salt,
        bytecode,
      })
      vote(
        'ox:ContractAddress.fromCreate2',
        {
          ox: create2,
          ethers: attempt(() =>
            ethers
              .getCreate2Address(from, salt, ethers.keccak256(bytecode))
              .toLowerCase(),
          ),
        },
        'fromCreate2',
      )
    },
  })

  // -------------------------------------------------------------------------------------------
  // Signatures and keys.

  add({
    id: 'round trip: Signature encodings',
    oracle: 'round trip',
    covers: [
      'ox:Signature.toHex',
      'ox:Signature.fromHex',
      'ox:Signature.toBytes',
      'ox:Signature.fromBytes',
      'ox:Signature.toCompactBytes',
      'ox:Signature.fromCompactBytes',
      'ox:Signature.toRecoveredBytes',
      'ox:Signature.fromRecoveredBytes',
      'ox:Signature.toDerHex',
      'ox:Signature.fromDerHex',
      'ox:Signature.toDerBytes',
      'ox:Signature.fromDerBytes',
      'ox:Signature.toTuple',
      'ox:Signature.fromTuple',
      'ox:Signature.toRpc',
      'ox:Signature.fromRpc',
      'ox:Signature.toLegacy',
      'ox:Signature.fromLegacy',
      'ox:Signature.vToYParity',
      'ox:Signature.yParityToV',
      'ox:Signature.from',
      'ox:Signature.validate',
      'ox:Signature.assert',
      'ox:Signature.extract',
    ],
    runs: 300,
    arb: signature,
    check(sig) {
      const pairs: [string, string, unknown][] = [
        ['ox:Signature.toHex', 'ox:Signature.fromHex', undefined],
        ['ox:Signature.toBytes', 'ox:Signature.fromBytes', undefined],
        [
          'ox:Signature.toRecoveredBytes',
          'ox:Signature.fromRecoveredBytes',
          undefined,
        ],
        ['ox:Signature.toTuple', 'ox:Signature.fromTuple', undefined],
        ['ox:Signature.toRpc', 'ox:Signature.fromRpc', undefined],
        ['ox:Signature.toLegacy', 'ox:Signature.fromLegacy', undefined],
      ]
      for (const [to, from] of pairs)
        same(from, call(from, call(to, sig)), sig, `${from}(${to}(...))`)
      const { r, s } = sig
      for (const [to, from] of [
        ['ox:Signature.toCompactBytes', 'ox:Signature.fromCompactBytes'],
        ['ox:Signature.toDerHex', 'ox:Signature.fromDerHex'],
        ['ox:Signature.toDerBytes', 'ox:Signature.fromDerBytes'],
      ] as const)
        same(from, call(from, call(to, sig)), { r, s }, `${from}(${to}(...))`)
      vote(
        'ox:Signature.toHex',
        {
          ox: call('ox:Signature.toHex', sig),
          viem: attempt(() =>
            viem.serializeSignature({ r, s, yParity: sig.yParity }),
          ),
        },
        'Signature.toHex',
      )
      same(
        'ox:Signature.vToYParity',
        call(
          'ox:Signature.vToYParity',
          call('ox:Signature.yParityToV', sig.yParity),
        ),
        sig.yParity,
        'v and yParity',
      )
      same(
        'ox:Signature.vToYParity',
        call(
          'ox:Signature.vToYParity',
          call('ox:Signature.yParityToV', sig.yParity, 1),
        ),
        sig.yParity,
        'v and yParity with a chain ID',
      )
      same('ox:Signature.from', call('ox:Signature.from', sig), sig, 'from')
      same(
        'ox:Signature.validate',
        call('ox:Signature.validate', sig),
        true,
        'validate',
      )
      call('ox:Signature.assert', sig)
      same(
        'ox:Signature.extract',
        call('ox:Signature.extract', { ...sig, chainId: 1 }),
        sig,
        'extract',
      )
    },
  })

  add({
    id: 'differential: Secp256k1 signing and recovery against ethers and noble',
    oracle: 'differential',
    covers: [
      'ox:Secp256k1.sign',
      'ox:Secp256k1.verify',
      'ox:Secp256k1.recoverAddress',
      'ox:Secp256k1.recoverPublicKey',
      'ox:Secp256k1.getPublicKey',
      'ox:Secp256k1.getSharedSecret',
      'ox:Address.fromPublicKey',
      'ox:PublicKey.toHex',
      'ox:PublicKey.fromHex',
      'ox:PublicKey.toBytes',
      'ox:PublicKey.fromBytes',
      'ox:PublicKey.compress',
      'ox:PublicKey.from',
      'ox:PublicKey.validate',
      'ox:PublicKey.assert',
    ],
    runs: 60,
    arb: fc.tuple(privateKey, privateKey, hash),
    check([key, other, payload]: [string, string, string]) {
      const signed = call('ox:Secp256k1.sign', { payload, privateKey: key })
      const reference = new ethers.SigningKey(key).sign(payload)
      same(
        'ox:Secp256k1.sign',
        { r: signed.r, s: signed.s, yParity: signed.yParity },
        { r: reference.r, s: reference.s, yParity: reference.yParity },
        'RFC 6979 signature',
      )
      const publicKey = call('ox:Secp256k1.getPublicKey', { privateKey: key })
      const address = call('ox:Address.fromPublicKey', publicKey)
      same(
        'ox:Address.fromPublicKey',
        address,
        ethers.computeAddress(key).toLowerCase(),
        'address',
      )
      same(
        'ox:Secp256k1.recoverAddress',
        call('ox:Secp256k1.recoverAddress', { payload, signature: signed }),
        address,
        'recoverAddress',
      )
      same(
        'ox:Secp256k1.recoverPublicKey',
        call('ox:Secp256k1.recoverPublicKey', { payload, signature: signed }),
        publicKey,
        'recoverPublicKey',
      )
      same(
        'ox:Secp256k1.verify',
        call('ox:Secp256k1.verify', { payload, signature: signed, address }),
        true,
        'verify',
      )
      same(
        'ox:Secp256k1.verify',
        call('ox:Secp256k1.verify', { payload, signature: signed, publicKey }),
        true,
        'verify with a public key',
      )
      const wrong = call('ox:Secp256k1.getPublicKey', { privateKey: other })
      if (key !== other)
        same(
          'ox:Secp256k1.verify',
          call('ox:Secp256k1.verify', {
            payload,
            signature: signed,
            publicKey: wrong,
          }),
          false,
          'verify with the wrong key',
        )
      const hex = call('ox:PublicKey.toHex', publicKey)
      same(
        'ox:PublicKey.fromHex',
        call('ox:PublicKey.fromHex', hex),
        publicKey,
        'PublicKey hex',
      )
      same(
        'ox:PublicKey.fromBytes',
        call('ox:PublicKey.fromBytes', call('ox:PublicKey.toBytes', publicKey)),
        publicKey,
        'PublicKey bytes',
      )
      const compressed = call('ox:PublicKey.compress', publicKey)
      same(
        'ox:PublicKey.compress',
        call('ox:PublicKey.toHex', compressed),
        toHex(noble.secp256k1.secp256k1.getPublicKey(hexBytes(key), true)),
        'compressed public key',
      )
      same(
        'ox:PublicKey.from',
        call('ox:PublicKey.from', publicKey),
        publicKey,
        'from',
      )
      same(
        'ox:PublicKey.validate',
        call('ox:PublicKey.validate', publicKey),
        true,
        'validate',
      )
      call('ox:PublicKey.assert', publicKey)
      const shared = call('ox:Secp256k1.getSharedSecret', {
        privateKey: key,
        publicKey: wrong,
      })
      same(
        'ox:Secp256k1.getSharedSecret',
        toHex(typeof shared === 'string' ? hexBytes(shared) : shared),
        toHex(
          noble.secp256k1.secp256k1.getSharedSecret(
            hexBytes(key),
            hexBytes(call('ox:PublicKey.toHex', wrong)),
          ),
        ),
        'ECDH shared secret',
      )
    },
  })

  add({
    id: 'consistency: P256 signs what noble verifies, and recovers its key',
    oracle: 'consistency',
    covers: [
      'ox:P256.sign',
      'ox:P256.verify',
      'ox:P256.getPublicKey',
      'ox:P256.recoverPublicKey',
      'ox:P256.getSharedSecret',
    ],
    runs: 40,
    arb: fc.tuple(p256Key, p256Key, hash),
    check([key, other, payload]: [string, string, string]) {
      const signed = call('ox:P256.sign', { payload, privateKey: key })
      const publicKey = call('ox:P256.getPublicKey', { privateKey: key })
      same(
        'ox:P256.getPublicKey',
        call('ox:PublicKey.toHex', publicKey),
        toHex(noble.nist.p256.getPublicKey(hexBytes(key), false)),
        'P256 public key',
      )
      same(
        'ox:P256.verify',
        call('ox:P256.verify', { payload, signature: signed, publicKey }),
        true,
        'P256.verify',
      )
      const compact = Uint8Array.from([
        ...hexBytes(toHex32(BigInt(signed.r))),
        ...hexBytes(toHex32(BigInt(signed.s))),
      ])
      same(
        'ox:P256.sign',
        noble.nist.p256.verify(
          compact,
          hexBytes(payload),
          noble.nist.p256.getPublicKey(hexBytes(key)),
          { prehash: false, lowS: false },
        ),
        true,
        'noble verifies the P256 signature',
      )
      same(
        'ox:P256.recoverPublicKey',
        call('ox:P256.recoverPublicKey', { payload, signature: signed }),
        publicKey,
        'P256.recoverPublicKey',
      )
      const otherPublic = call('ox:P256.getPublicKey', { privateKey: other })
      const shared = call('ox:P256.getSharedSecret', {
        privateKey: key,
        publicKey: otherPublic,
      })
      const back = call('ox:P256.getSharedSecret', {
        privateKey: other,
        publicKey,
      })
      same('ox:P256.getSharedSecret', shared, back, 'ECDH is symmetric')
    },
  })

  add({
    id: 'differential: Ed25519 and X25519 against noble',
    oracle: 'differential',
    covers: [
      'ox:Ed25519.sign',
      'ox:Ed25519.verify',
      'ox:Ed25519.getPublicKey',
      'ox:Ed25519.toX25519PrivateKey',
      'ox:Ed25519.toX25519PublicKey',
      'ox:X25519.getPublicKey',
      'ox:X25519.getSharedSecret',
    ],
    runs: 40,
    arb: fc.tuple(hexOf(32, 32), hexOf(32, 32), hexOf(0, 80)),
    check([key, other, payload]: [string, string, string]) {
      const signed = call('ox:Ed25519.sign', { payload, privateKey: key })
      same(
        'ox:Ed25519.sign',
        toHex(asBytes(signed)),
        toHex(noble.ed25519.ed25519.sign(hexBytes(payload), hexBytes(key))),
        'Ed25519 signature',
      )
      const publicKey = call('ox:Ed25519.getPublicKey', { privateKey: key })
      same(
        'ox:Ed25519.getPublicKey',
        toHex(asBytes(publicKey)),
        toHex(noble.ed25519.ed25519.getPublicKey(hexBytes(key))),
        'Ed25519 public key',
      )
      same(
        'ox:Ed25519.verify',
        call('ox:Ed25519.verify', { payload, signature: signed, publicKey }),
        true,
        'Ed25519.verify',
      )
      const x = call('ox:Ed25519.toX25519PrivateKey', { privateKey: key })
      const xPublic = call('ox:Ed25519.toX25519PublicKey', { publicKey })
      same(
        'ox:Ed25519.toX25519PublicKey',
        toHex(asBytes(call('ox:X25519.getPublicKey', { privateKey: x }))),
        toHex(asBytes(xPublic)),
        'X25519 keys from Ed25519 agree',
      )
      const otherPublic = call('ox:X25519.getPublicKey', { privateKey: other })
      same(
        'ox:X25519.getPublicKey',
        toHex(asBytes(otherPublic)),
        toHex(noble.ed25519.x25519.getPublicKey(hexBytes(other))),
        'X25519 public key',
      )
      same(
        'ox:X25519.getSharedSecret',
        toHex(
          asBytes(
            call('ox:X25519.getSharedSecret', {
              privateKey: other,
              publicKey: xPublic,
            }),
          ),
        ),
        toHex(
          noble.ed25519.x25519.getSharedSecret(
            hexBytes(other),
            asBytes(xPublic),
          ),
        ),
        'X25519 shared secret',
      )
    },
  })

  add({
    id: 'differential: PersonalMessage and Authorization payloads against viem and ethers',
    oracle: 'differential',
    covers: [
      'ox:PersonalMessage.getSignPayload',
      'ox:PersonalMessage.encode',
      'ox:Authorization.getSignPayload',
      'ox:Authorization.hash',
      'ox:Authorization.from',
      'ox:Authorization.toTuple',
      'ox:Authorization.fromTuple',
      'ox:Authorization.toRpc',
      'ox:Authorization.fromRpc',
      'ox:Authorization.toTupleList',
      'ox:Authorization.fromTupleList',
      'ox:Authorization.toRpcList',
      'ox:Authorization.fromRpcList',
    ],
    runs: 200,
    arb: fc.tuple(hexOf(0, 80), address, chainId, quantity, signature),
    check([message, contract, id, nonce, sig]: [
      string,
      string,
      number,
      bigint,
      Any,
    ]) {
      vote(
        'ox:PersonalMessage.getSignPayload',
        {
          ox: call('ox:PersonalMessage.getSignPayload', message),
          viem: attempt(() => viem.hashMessage({ raw: message })),
          ethers: attempt(() => ethers.hashMessage(hexBytes(message))),
        },
        'personal message hash',
      )
      call('ox:PersonalMessage.encode', message)
      const authorization = call('ox:Authorization.from', {
        address: contract,
        chainId: id,
        nonce,
      })
      const payload = call('ox:Authorization.getSignPayload', authorization)
      vote(
        'ox:Authorization.getSignPayload',
        {
          ox: payload,
          ethers: attempt(() =>
            ethers.hashAuthorization({ address: contract, chainId: id, nonce }),
          ),
        },
        'authorization hash',
      )
      same(
        'ox:Authorization.hash',
        call('ox:Authorization.hash', authorization),
        payload,
        'hash',
      )
      const signed = call('ox:Authorization.from', authorization, {
        signature: sig,
      })
      for (const [to, from] of [
        ['ox:Authorization.toTuple', 'ox:Authorization.fromTuple'],
        ['ox:Authorization.toRpc', 'ox:Authorization.fromRpc'],
      ] as const)
        same(from, call(from, call(to, signed)), signed, `${from}(${to}(...))`)
      for (const [to, from] of [
        ['ox:Authorization.toTupleList', 'ox:Authorization.fromTupleList'],
        ['ox:Authorization.toRpcList', 'ox:Authorization.fromRpcList'],
      ] as const)
        same(
          from,
          call(from, call(to, [signed])),
          [signed],
          `${from}(${to}(...))`,
        )
    },
  })

  // -------------------------------------------------------------------------------------------
  // Typed data.

  const typedDataArb = fc
    .array(elementary, { minLength: 1, maxLength: 4 })
    .chain((types) =>
      fc.tuple(
        fc.constant(types),
        fc.tuple(...types.map((type) => arbitraryOf({ type }))),
        fc.record(
          {
            name: fc.string({ maxLength: 10 }),
            version: fc.stringMatching(/^[0-9]{1,3}$/),
            chainId: fc.integer({ min: 1, max: 2 ** 31 }),
            verifyingContract: address,
            salt: hash,
          },
          { requiredKeys: [] },
        ),
      ),
    )
    .map(([types, values, domain]) => ({
      domain,
      types: {
        Mail: types.map((type, i) => ({ name: `f${i}`, type })),
      },
      primaryType: 'Mail',
      message: Object.fromEntries(values.map((value, i) => [`f${i}`, value])),
    }))
  add({
    id: 'differential: TypedData hashes against viem and ethers',
    oracle: 'differential',
    covers: [
      'ox:TypedData.getSignPayload',
      'ox:TypedData.hashStruct',
      'ox:TypedData.hashDomain',
      'ox:TypedData.domainSeparator',
      'ox:TypedData.encode',
      'ox:TypedData.encodeData',
      'ox:TypedData.encodeType',
      'ox:TypedData.hashType',
      'ox:TypedData.serialize',
      'ox:TypedData.validate',
      'ox:TypedData.assert',
      'ox:TypedData.extractEip712DomainTypes',
    ],
    runs: 200,
    arb: typedDataArb,
    check(typed) {
      const payload = call('ox:TypedData.getSignPayload', typed)
      const domainTypes = call(
        'ox:TypedData.extractEip712DomainTypes',
        typed.domain,
      )
      vote(
        'ox:TypedData.getSignPayload',
        {
          ox: payload,
          viem: attempt(() => viem.hashTypedData(typed)),
          ethers: attempt(() =>
            ethers.TypedDataEncoder.hash(
              typed.domain,
              typed.types,
              typed.message,
            ),
          ),
        },
        'typed data hash',
      )
      same(
        'ox:TypedData.encode',
        call('ox:Hash.keccak256', call('ox:TypedData.encode', typed)),
        payload,
        'keccak256(TypedData.encode) is the payload',
      )
      const types = { ...typed.types, EIP712Domain: domainTypes }
      same(
        'ox:TypedData.hashDomain',
        call('ox:TypedData.hashDomain', { domain: typed.domain, types }),
        call('ox:TypedData.domainSeparator', typed.domain),
        'hashDomain and domainSeparator',
      )
      same(
        'ox:TypedData.hashStruct',
        call('ox:TypedData.hashStruct', {
          data: typed.message,
          primaryType: 'Mail',
          types,
        }),
        call(
          'ox:Hash.keccak256',
          call('ox:TypedData.encodeData', {
            data: typed.message,
            primaryType: 'Mail',
            types,
          }),
        ),
        'hashStruct is keccak256(encodeData)',
      )
      same(
        'ox:TypedData.hashType',
        call('ox:TypedData.hashType', { primaryType: 'Mail', types }),
        call(
          'ox:Hash.keccak256',
          call(
            'ox:Hex.fromString',
            call('ox:TypedData.encodeType', { primaryType: 'Mail', types }),
          ),
        ),
        'hashType is keccak256(encodeType)',
      )
      JSON.parse(call('ox:TypedData.serialize', typed))
      same(
        'ox:TypedData.validate',
        call('ox:TypedData.validate', typed),
        true,
        'validate',
      )
      call('ox:TypedData.assert', typed)
    },
  })

  // -------------------------------------------------------------------------------------------
  // Transactions.

  const base = {
    nonce: quantity,
    gas: quantity,
    to: fc.option(address, { nil: undefined }),
    value: quantity,
    data: hexOf(0, 40),
  }
  const envelopes = {
    legacy: fc.record({
      ...base,
      type: fc.constant('legacy' as const),
      gasPrice: quantity,
      chainId: fc.option(chainId, { nil: undefined }),
    }),
    eip2930: fc.record({
      ...base,
      type: fc.constant('eip2930' as const),
      chainId,
      gasPrice: quantity,
      accessList,
    }),
    eip1559: fc.record({
      ...base,
      type: fc.constant('eip1559' as const),
      chainId,
      maxFeePerGas: quantity,
      maxPriorityFeePerGas: quantity,
      accessList,
    }),
    eip7702: fc.record({
      ...base,
      type: fc.constant('eip7702' as const),
      chainId,
      maxFeePerGas: quantity,
      maxPriorityFeePerGas: quantity,
      accessList,
      authorizationList: fc.array(
        fc.record({
          address,
          chainId: fc.integer({ min: 0, max: 2 ** 32 }),
          nonce: quantity,
          r: scalar.map(toHex32),
          s: scalar.map(toHex32),
          yParity: fc.integer({ min: 0, max: 1 }),
        }),
        { minLength: 1, maxLength: 2 },
      ),
    }),
  }
  const moduleOf = {
    legacy: 'TxEnvelopeLegacy',
    eip2930: 'TxEnvelopeEip2930',
    eip1559: 'TxEnvelopeEip1559',
    eip7702: 'TxEnvelopeEip7702',
  } as const
  for (const [type, arb] of Object.entries(envelopes) as [
    keyof typeof envelopes,
    Arbitrary<Any>,
  ][]) {
    const module = `ox:${moduleOf[type]}`
    add({
      id: `differential: ${moduleOf[type]} serialization against viem and ethers`,
      oracle: 'differential',
      covers: [
        `${module}.from`,
        `${module}.serialize`,
        `${module}.deserialize`,
        `${module}.hash`,
        `${module}.getSignPayload`,
        `${module}.toRpc`,
        `${module}.validate`,
        `${module}.assert`,
        'ox:TransactionEnvelope.deserialize',
        'ox:TransactionEnvelope.serialize',
        'ox:TransactionEnvelope.getSerializedType',
        'ox:TransactionEnvelope.getType',
        'ox:TransactionEnvelope.hash',
        'ox:TransactionEnvelope.getSignPayload',
        'ox:TransactionEnvelope.from',
        'ox:TransactionEnvelope.toRpc',
        'ox:TransactionEnvelope.validate',
        'ox:TransactionEnvelope.assert',
        'ox:TransactionEnvelope.toTransactionRequest',
        'ox:Transaction.fromRpc',
        'ox:Transaction.toRpc',
      ],
      runs: 200,
      arb: fc.tuple(arb, fc.option(signature, { nil: undefined })),
      check([fields, sig]: [Any, Any]) {
        const clean = Object.fromEntries(
          Object.entries(fields).filter(([, value]) => value !== undefined),
        )
        if (type === 'legacy' && clean.chainId === undefined)
          delete clean.chainId
        // ox rejects a tip above the fee cap.
        if (clean.maxPriorityFeePerGas > clean.maxFeePerGas) return
        const envelope = call(`${module}.from`, clean)
        const serialized = call(
          `${module}.serialize`,
          envelope,
          sig ? { signature: sig } : {},
        )
        const viemTx = (() => {
          const { type: _, ...rest } = clean
          return { ...rest, type }
        })()
        // viem's legacy serializer reads the signature only from its second argument, and
        // signs with `v`, which ox derives from `yParity`.
        const viemSignature = sig && {
          ...sig,
          v: clean.chainId
            ? BigInt(clean.chainId) * 2n + 35n + BigInt(sig.yParity)
            : 27n + BigInt(sig.yParity),
        }
        vote(
          `${module}.serialize`,
          {
            ox: serialized,
            viem: attempt(() =>
              viem.serializeTransaction(viemTx, viemSignature),
            ),
          },
          `${type} serialization`,
        )
        const back = call(`${module}.deserialize`, serialized)
        const expected = { ...envelope, ...(sig ?? {}) }
        // A deserialized legacy transaction also carries the `v` it was signed with.
        const { v: _, ...unsigned } = back
        same(
          `${module}.deserialize`,
          stripZero(type === 'legacy' ? unsigned : back),
          stripZero(expected),
          `${moduleOf[type]}.deserialize(serialize(...))`,
        )
        same(
          'ox:TransactionEnvelope.deserialize',
          stripEmpty(call('ox:TransactionEnvelope.deserialize', serialized)),
          stripEmpty(back),
          'TransactionEnvelope.deserialize',
        )
        same(
          'ox:TransactionEnvelope.getSerializedType',
          call('ox:TransactionEnvelope.getSerializedType', serialized),
          type,
          'getSerializedType',
        )
        same(
          'ox:TransactionEnvelope.serialize',
          call('ox:TransactionEnvelope.serialize', back),
          sig ? serialized : call(`${module}.serialize`, back),
          'TransactionEnvelope.serialize',
        )
        if (sig) {
          const hash = call(`${module}.hash`, back)
          same(
            `${module}.hash`,
            hash,
            call('ox:Hash.keccak256', serialized),
            'hash is keccak256(serialized)',
          )
          same(
            'ox:TransactionEnvelope.hash',
            call('ox:TransactionEnvelope.hash', back),
            hash,
            'TransactionEnvelope.hash',
          )
          const ethersHash = attempt(
            () => ethers.Transaction.from(serialized).hash,
          )
          if (ethersHash !== undefined && type !== 'legacy')
            same(`${module}.hash`, hash, ethersHash, 'ethers hash')
        }
        const payload = call(`${module}.getSignPayload`, envelope)
        same(
          'ox:TransactionEnvelope.getSignPayload',
          call('ox:TransactionEnvelope.getSignPayload', envelope),
          payload,
          'TransactionEnvelope.getSignPayload',
        )
        const rpc = call(`${module}.toRpc`, back)
        same(
          'ox:TransactionEnvelope.toRpc',
          call('ox:TransactionEnvelope.toRpc', back),
          rpc,
          'TransactionEnvelope.toRpc',
        )
        call(`${module}.assert`, envelope)
        same(
          `${module}.validate`,
          call(`${module}.validate`, envelope),
          true,
          'validate',
        )
        call('ox:TransactionEnvelope.validate', envelope)
        call('ox:TransactionEnvelope.assert', envelope)
        call('ox:TransactionEnvelope.getType', envelope)
        call('ox:TransactionEnvelope.from', envelope)
        call('ox:TransactionEnvelope.toTransactionRequest', envelope)
        if (sig) {
          const transaction = call('ox:Transaction.fromRpc', {
            ...rpc,
            hash: call('ox:Hash.keccak256', serialized),
            blockHash: null,
            blockNumber: null,
            transactionIndex: null,
            from: '0x0000000000000000000000000000000000000000',
          })
          const again = call('ox:Transaction.toRpc', transaction)
          same(
            ['ox:Transaction.fromRpc', 'ox:Transaction.toRpc'],
            stripEmpty(call('ox:Transaction.fromRpc', again)),
            stripEmpty(transaction),
            'Transaction RPC round trip',
          )
        }
      },
    })
  }
  add({
    id: 'differential: TransactionEnvelope.deserialize of malformed input',
    oracle: 'crash',
    covers: [
      'ox:TransactionEnvelope.deserialize',
      'ox:TxEnvelopeEip1559.deserialize',
      'ox:TxEnvelopeLegacy.deserialize',
      'ox:TxEnvelopeEip2930.deserialize',
      'ox:TxEnvelopeEip7702.deserialize',
      'ox:TxEnvelopeEip4844.deserialize',
    ],
    runs: 400,
    arb: fc
      .tuple(
        fc.constantFrom(0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x7f, 0xc0, 0xf8),
        rlpArb,
      )
      .map(([type, body]) => {
        const rlp = hexBytes(ethers.encodeRlp(body))
        return toHex(type >= 0xc0 ? rlp : Uint8Array.from([type, ...rlp]))
      }),
    check(serialized) {
      for (const name of [
        'ox:TransactionEnvelope.deserialize',
        'ox:TxEnvelopeEip1559.deserialize',
        'ox:TxEnvelopeLegacy.deserialize',
        'ox:TxEnvelopeEip2930.deserialize',
        'ox:TxEnvelopeEip7702.deserialize',
        'ox:TxEnvelopeEip4844.deserialize',
      ])
        try {
          fn(name)(serialized)
        } catch (error) {
          if (!documented(error)) throw crash(name, error)
        }
    },
  })

  add({
    id: 'differential: micro-eth-signer parses what ox serializes',
    oracle: 'differential',
    covers: ['ox:TxEnvelopeEip1559.serialize'],
    runs: 100,
    arb: fc.tuple(envelopes.eip1559, signature),
    check([fields, sig]: [Any, Any]) {
      if (fields.to === undefined) return
      // ox rejects a tip above the fee cap before serializing.
      if (fields.maxPriorityFeePerGas > fields.maxFeePerGas) return
      const clean = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined),
      )
      const serialized = call(
        'ox:TxEnvelopeEip1559.serialize',
        fn('ox:TxEnvelopeEip1559.from')(clean),
        { signature: sig },
      )
      const parsed = attempt(() => micro.Transaction.fromHex(serialized))
      if (!parsed) return
      same(
        'ox:TxEnvelopeEip1559.serialize',
        BigInt(parsed.raw.value),
        clean.value,
        'micro-eth-signer reads the value back',
      )
    },
  })

  // -------------------------------------------------------------------------------------------
  // Mnemonics, HD keys, and encryption.

  add({
    id: 'differential: Mnemonic and HdKey against scure',
    oracle: 'differential',
    covers: [
      'ox:Mnemonic.toSeed',
      'ox:Mnemonic.validate',
      'ox:Mnemonic.toHdKey',
      'ox:Mnemonic.toPrivateKey',
      'ox:HdKey.fromSeed',
      'ox:HdKey.path',
      'ox:HdKey.fromExtendedKey',
      'ox:HdKey.fromJson',
    ],
    runs: 8,
    arb: fc.tuple(
      fc.uint8Array({ minLength: 16, maxLength: 16 }),
      fc.string({ maxLength: 8 }),
      fc.integer({ min: 0, max: 20 }),
    ),
    check([entropy, passphrase, index]: [Uint8Array, string, number]) {
      const mnemonic = scure.bip39.entropyToMnemonic(
        entropy,
        scure.english.wordlist,
      )
      same(
        'ox:Mnemonic.validate',
        call('ox:Mnemonic.validate', mnemonic, scure.english.wordlist),
        true,
        'validate',
      )
      const seed = call('ox:Mnemonic.toSeed', mnemonic, { passphrase })
      same(
        'ox:Mnemonic.toSeed',
        toHex(asBytes(seed)),
        toHex(scure.bip39.mnemonicToSeedSync(mnemonic, passphrase)),
        'BIP-39 seed',
      )
      const path = call('ox:HdKey.path', { index })
      const key = call('ox:HdKey.fromSeed', seed).derive(path)
      const reference = scure.bip32.HDKey.fromMasterSeed(asBytes(seed)).derive(
        path,
      )
      same(
        'ox:HdKey.fromSeed',
        toHex(asBytes(key.privateKey)),
        toHex(reference.privateKey),
        `derived key at ${path}`,
      )
      same(
        'ox:Mnemonic.toPrivateKey',
        toHex(
          asBytes(
            call('ox:Mnemonic.toPrivateKey', mnemonic, { path, passphrase }),
          ),
        ),
        toHex(reference.privateKey),
        'Mnemonic.toPrivateKey',
      )
      call('ox:Mnemonic.toHdKey', mnemonic, { passphrase })
      const extended = reference.privateExtendedKey
      same(
        'ox:HdKey.fromExtendedKey',
        toHex(asBytes(call('ox:HdKey.fromExtendedKey', extended).privateKey)),
        toHex(reference.privateKey),
        'HdKey.fromExtendedKey',
      )
      same(
        'ox:HdKey.fromJson',
        toHex(
          asBytes(call('ox:HdKey.fromJson', { xpriv: extended }).privateKey),
        ),
        toHex(reference.privateKey),
        'HdKey.fromJson',
      )
    },
  })

  add({
    id: 'round trip: AesGcm.encrypt and AesGcm.decrypt',
    oracle: 'round trip',
    async: true,
    covers: [
      'ox:AesGcm.encrypt',
      'ox:AesGcm.decrypt',
      'ox:AesGcm.getKey',
      'ox:AesGcm.randomSalt',
    ],
    runs: 20,
    arb: fc.tuple(fc.string({ minLength: 1, maxLength: 12 }), hexOf(0, 100)),
    async check([password, data]: [string, string]) {
      const salt = call('ox:AesGcm.randomSalt')
      const key = await callAsync('ox:AesGcm.getKey', { password, salt })
      const encrypted = await callAsync('ox:AesGcm.encrypt', data, key)
      same(
        'ox:AesGcm.decrypt',
        await callAsync('ox:AesGcm.decrypt', encrypted, key),
        data,
        'AesGcm round trip',
      )
    },
  })

  add({
    id: 'round trip: Keystore.encrypt and Keystore.decrypt',
    oracle: 'round trip',
    covers: [
      'ox:Keystore.encrypt',
      'ox:Keystore.decrypt',
      'ox:Keystore.pbkdf2',
      'ox:Keystore.toKey',
    ],
    runs: 5,
    arb: fc.tuple(hexOf(32, 32), fc.string({ minLength: 1, maxLength: 12 })),
    check([privateKey, password]: [string, string]) {
      // ox requires at least 1,000 PBKDF2 iterations.
      const [key, options] = call('ox:Keystore.pbkdf2', {
        iterations: 1000,
        password,
      })
      const keystore = call('ox:Keystore.encrypt', privateKey, key, options)
      same(
        'ox:Keystore.decrypt',
        call('ox:Keystore.decrypt', keystore, key),
        privateKey,
        'Keystore round trip',
      )
      const derived = call('ox:Keystore.toKey', keystore, { password })
      same(
        'ox:Keystore.toKey',
        call('ox:Keystore.decrypt', keystore, derived),
        privateKey,
        'Keystore.toKey',
      )
    },
  })

  // -------------------------------------------------------------------------------------------
  // Blobs, Bloom, Siwe, and RPC shapes.

  add({
    id: 'differential: Blobs.from and Blobs.to against viem',
    oracle: 'differential',
    covers: [
      'ox:Blobs.from',
      'ox:Blobs.to',
      'ox:Blobs.toHex',
      'ox:Blobs.toBytes',
    ],
    runs: 12,
    // Empty data throws `Blobs.EmptyBlobError`.
    arb: hexOf(1, 400),
    check(data) {
      const blobs = call('ox:Blobs.from', data)
      vote(
        'ox:Blobs.from',
        { ox: blobs, viem: attempt(() => viem.toBlobs({ data })) },
        'blobs',
      )
      same('ox:Blobs.to', call('ox:Blobs.to', blobs), data, 'Blobs round trip')
      same('ox:Blobs.toHex', call('ox:Blobs.toHex', blobs), data, 'Blobs.toHex')
      same(
        'ox:Blobs.toBytes',
        toHex(call('ox:Blobs.toBytes', blobs)),
        data,
        'Blobs.toBytes',
      )
    },
  })

  add({
    id: 'consistency: Bloom contains every topic it was built from',
    oracle: 'consistency',
    covers: [
      'ox:Bloom.contains',
      'ox:Bloom.containsHash',
      'ox:Bloom.containsPrepared',
      'ox:Bloom.prepare',
      'ox:Bloom.validate',
    ],
    runs: 100,
    arb: fc.array(hexOf(1, 40), { minLength: 1, maxLength: 6 }),
    check(values: string[]) {
      const bloom = new Uint8Array(256)
      for (const value of values) {
        const digest = noble.sha3.keccak_256(hexBytes(value))
        for (const i of [0, 2, 4]) {
          const bit = ((digest[i]! << 8) | digest[i + 1]!) & 2047
          bloom[255 - (bit >> 3)]! |= 1 << (bit & 7)
        }
      }
      const hex = toHex(bloom)
      same(
        'ox:Bloom.validate',
        call('ox:Bloom.validate', hex),
        true,
        'validate',
      )
      for (const value of values) {
        same(
          'ox:Bloom.contains',
          call('ox:Bloom.contains', hex, value),
          true,
          `contains(${value})`,
        )
        // `prepare` parses the bloom once; `containsHash` takes the topic's keccak256 as bytes.
        const prepared = call('ox:Bloom.prepare', hex)
        same(
          'ox:Bloom.containsHash',
          call(
            'ox:Bloom.containsHash',
            prepared,
            call('ox:Hash.keccak256', value, { as: 'Bytes' }),
          ),
          true,
          'containsHash',
        )
        same(
          'ox:Bloom.containsPrepared',
          call('ox:Bloom.containsPrepared', prepared, value),
          true,
          'containsPrepared',
        )
      }
    },
  })

  add({
    id: 'round trip: Siwe.createMessage and Siwe.parseMessage',
    oracle: 'round trip',
    covers: [
      'ox:Siwe.createMessage',
      'ox:Siwe.parseMessage',
      'ox:Siwe.validateMessage',
      'ox:Siwe.isUri',
      'ox:Siwe.generateNonce',
    ],
    runs: 200,
    arb: fc.record(
      {
        address: address.map((value) => ethers.getAddress(value)),
        chainId,
        domain: fc.domain(),
        nonce: fc.stringMatching(/^[a-zA-Z0-9]{8,16}$/),
        uri: fc.webUrl(),
        version: fc.constant('1' as const),
        statement: fc.stringMatching(/^[a-zA-Z0-9 .,]{0,40}$/),
        issuedAt: fc.date({
          min: new Date('2000-01-01'),
          max: new Date('2100-01-01'),
          noInvalidDate: true,
        }),
        resources: fc.array(fc.webUrl(), { maxLength: 2 }),
      },
      {
        requiredKeys: [
          'address',
          'chainId',
          'domain',
          'nonce',
          'uri',
          'version',
        ],
      },
    ),
    check(fields) {
      const message = call('ox:Siwe.createMessage', fields)
      const parsed = call('ox:Siwe.parseMessage', message)
      const expected: Any = { ...fields }
      if (!expected.statement) delete expected.statement
      if (!expected.resources?.length) delete expected.resources
      for (const [key, value] of Object.entries(expected))
        same(
          'ox:Siwe.parseMessage',
          parsed[key] instanceof Date ? parsed[key].toISOString() : parsed[key],
          value instanceof Date ? value.toISOString() : value,
          `parseMessage(createMessage(...)).${key}`,
        )
      same(
        'ox:Siwe.validateMessage',
        call('ox:Siwe.validateMessage', {
          address: fields.address,
          domain: fields.domain,
          message: parsed,
          nonce: fields.nonce,
          time: fields.issuedAt ?? new Date(),
        }),
        true,
        'validateMessage',
      )
      same(
        'ox:Siwe.isUri',
        call('ox:Siwe.isUri', fields.uri),
        fields.uri,
        'isUri',
      )
      call('ox:Siwe.generateNonce')
    },
  })

  add({
    id: 'round trip: RPC shapes (Block, Log, Receipt, Withdrawal, AccessList, Filter)',
    oracle: 'round trip',
    covers: [
      'ox:Log.fromRpc',
      'ox:Log.toRpc',
      'ox:Withdrawal.fromRpc',
      'ox:Withdrawal.toRpc',
      'ox:AccessList.toTupleList',
      'ox:AccessList.fromTupleList',
      'ox:Filter.toRpc',
      'ox:Filter.fromRpc',
      'ox:StateOverrides.toRpc',
      'ox:StateOverrides.fromRpc',
      'ox:BlockOverrides.toRpc',
      'ox:BlockOverrides.fromRpc',
    ],
    runs: 200,
    arb: fc.record({
      log: fc.record({
        address,
        blockHash: hash,
        blockNumber: quantity,
        data: hexOf(0, 64),
        logIndex: fc.integer({ min: 0, max: 1000 }),
        removed: fc.boolean(),
        topics: fc.array(hash, { maxLength: 4 }),
        transactionHash: hash,
        transactionIndex: fc.integer({ min: 0, max: 1000 }),
      }),
      withdrawal: fc.record({
        address,
        amount: quantity,
        index: fc.integer({ min: 0, max: 2 ** 31 }),
        validatorIndex: fc.integer({ min: 0, max: 2 ** 31 }),
      }),
      accessList,
      filter: fc.record(
        {
          address: fc.option(address, { nil: undefined }),
          fromBlock: fc.option(quantity, { nil: undefined }),
          toBlock: fc.option(quantity, { nil: undefined }),
          topics: fc.array(fc.option(hash, { nil: null }), { maxLength: 3 }),
        },
        { requiredKeys: [] },
      ),
      override: fc.dictionary(
        address,
        fc.record(
          {
            balance: quantity,
            nonce: fc.integer({ min: 0, max: 2 ** 31 }).map(BigInt),
            code: hexOf(0, 20),
            stateDiff: fc.dictionary(hash, hash, { maxKeys: 2 }),
          },
          { requiredKeys: [] },
        ),
        { maxKeys: 2 },
      ),
      blockOverrides: fc.record(
        {
          number: quantity,
          time: quantity,
          gasLimit: quantity,
          baseFeePerGas: quantity,
          feeRecipient: address,
          prevRandao: quantity,
        },
        { requiredKeys: [] },
      ),
    }),
    check({ log, withdrawal, accessList, filter, override, blockOverrides }) {
      const pairs: [string, string, unknown][] = [
        ['ox:Log.toRpc', 'ox:Log.fromRpc', log],
        ['ox:Withdrawal.toRpc', 'ox:Withdrawal.fromRpc', withdrawal],
        [
          'ox:AccessList.toTupleList',
          'ox:AccessList.fromTupleList',
          accessList,
        ],
        ['ox:StateOverrides.toRpc', 'ox:StateOverrides.fromRpc', override],
        [
          'ox:BlockOverrides.toRpc',
          'ox:BlockOverrides.fromRpc',
          blockOverrides,
        ],
      ]
      for (const [to, from, value] of pairs)
        same(
          [from, to],
          stripEmpty(call(from, call(to, value))),
          stripEmpty(value),
          `${from}(${to}(...))`,
        )
      const clean = stripEmpty(filter)
      same(
        ['ox:Filter.fromRpc', 'ox:Filter.toRpc'],
        stripEmpty(call('ox:Filter.fromRpc', call('ox:Filter.toRpc', clean))),
        clean,
        'Filter round trip',
      )
    },
  })

  // -------------------------------------------------------------------------------------------
  // ERCs.

  add({
    id: 'round trip: ERC-6492 and ERC-8010 wrapping',
    oracle: 'round trip',
    covers: [
      'ox/erc6492:SignatureErc6492.wrap',
      'ox/erc6492:SignatureErc6492.unwrap',
      'ox/erc6492:SignatureErc6492.validate',
      'ox/erc6492:SignatureErc6492.assert',
      'ox/erc6492:SignatureErc6492.from',
    ],
    runs: 200,
    arb: fc.tuple(hexOf(0, 100), address, hexOf(0, 80)),
    check([signature, to, data]: [string, string, string]) {
      const wrapped = call('ox/erc6492:SignatureErc6492.wrap', {
        data,
        signature,
        to,
      })
      same(
        'ox/erc6492:SignatureErc6492.unwrap',
        canonical(call('ox/erc6492:SignatureErc6492.unwrap', wrapped)),
        canonical({ data, signature, to }),
        'unwrap(wrap(...))',
      )
      same(
        'ox/erc6492:SignatureErc6492.validate',
        call('ox/erc6492:SignatureErc6492.validate', wrapped),
        true,
        'validate',
      )
      call('ox/erc6492:SignatureErc6492.assert', wrapped)
      call('ox/erc6492:SignatureErc6492.from', wrapped)
    },
  })

  add({
    id: 'round trip: ERC-7821 calls and execute data',
    oracle: 'round trip',
    covers: [
      'ox/erc7821:Calls.encode',
      'ox/erc7821:Calls.decode',
      'ox/erc7821:Execute.encodeData',
      'ox/erc7821:Execute.decodeData',
    ],
    runs: 200,
    arb: fc.tuple(
      fc.array(
        fc.record(
          { to: address, value: quantity, data: hexOf(0, 40) },
          { requiredKeys: ['to'] },
        ),
        { maxLength: 4 },
      ),
      fc.option(hexOf(0, 40), { nil: undefined }),
    ),
    check([calls, opData]: [Any[], string | undefined]) {
      const options = opData === undefined ? {} : { opData }
      const encoded = call('ox/erc7821:Calls.encode', calls, options)
      const decoded = call('ox/erc7821:Calls.decode', encoded, options)
      const normal = (list: Any[]) =>
        list.map((item) => ({
          to: item.to.toLowerCase(),
          value: item.value ?? 0n,
          data: item.data ?? '0x',
        }))
      same(
        'ox/erc7821:Calls.decode',
        normal(decoded.calls),
        normal(calls),
        'Calls round trip',
      )
      const data = call('ox/erc7821:Execute.encodeData', calls, options)
      same(
        'ox/erc7821:Execute.decodeData',
        normal(call('ox/erc7821:Execute.decodeData', data).calls),
        normal(calls),
        'Execute round trip',
      )
    },
  })

  add({
    id: 'round trip: ERC-8021 attribution suffixes',
    oracle: 'round trip',
    covers: [
      'ox/erc8021:Attribution.toDataSuffix',
      'ox/erc8021:Attribution.fromData',
      'ox/erc8021:Attribution.getSchemaId',
    ],
    runs: 200,
    arb: fc.tuple(
      fc.array(fc.stringMatching(/^[a-z0-9]{1,10}$/), {
        minLength: 1,
        maxLength: 4,
      }),
      hexOf(0, 40),
    ),
    check([codes, data]: [string[], string]) {
      const suffix = call('ox/erc8021:Attribution.toDataSuffix', { codes })
      const parsed = call(
        'ox/erc8021:Attribution.fromData',
        `${data}${suffix.slice(2)}`,
      )
      same(
        'ox/erc8021:Attribution.fromData',
        parsed?.codes,
        codes,
        'fromData(data + toDataSuffix(...)).codes',
      )
      call('ox/erc8021:Attribution.getSchemaId', { codes })
    },
  })

  add({
    id: 'differential: UserOperation hashes against viem, and packing round trips',
    oracle: 'differential',
    covers: [
      'ox/erc4337:UserOperation.hash',
      'ox/erc4337:UserOperation.getSignPayload',
      'ox/erc4337:UserOperation.toPacked',
      'ox/erc4337:UserOperation.fromPacked',
      'ox/erc4337:UserOperation.toRpc',
      'ox/erc4337:UserOperation.fromRpc',
      'ox/erc4337:UserOperation.from',
      'ox/erc4337:UserOperation.toInitCode',
    ],
    runs: 150,
    arb: fc.tuple(
      fc.record({
        callData: hexOf(0, 40),
        callGasLimit: uint(128),
        maxFeePerGas: uint(128),
        maxPriorityFeePerGas: uint(128),
        nonce: uint(256),
        preVerificationGas: uint(128),
        sender: address,
        signature: hexOf(0, 65),
        verificationGasLimit: uint(128),
      }),
      chainId,
      address,
    ),
    check([userOperation, id, entryPointAddress]: [Any, number, string]) {
      const options = {
        chainId: id,
        entryPointAddress,
        entryPointVersion: '0.7' as const,
      }
      const hash = call('ox/erc4337:UserOperation.hash', userOperation, options)
      vote(
        'ox/erc4337:UserOperation.hash',
        {
          ox: hash,
          viem: attempt(() =>
            lib.viemAa.getUserOperationHash({
              chainId: id,
              entryPointAddress,
              entryPointVersion: '0.7',
              userOperation,
            }),
          ),
        },
        'user operation hash',
      )
      same(
        'ox/erc4337:UserOperation.getSignPayload',
        call('ox/erc4337:UserOperation.getSignPayload', userOperation, options),
        hash,
        'getSignPayload',
      )
      const packed = call('ox/erc4337:UserOperation.toPacked', userOperation)
      same(
        'ox/erc4337:UserOperation.fromPacked',
        canonical(
          stripEmpty(call('ox/erc4337:UserOperation.fromPacked', packed)),
        ),
        canonical(stripEmpty(userOperation)),
        'fromPacked(toPacked(...))',
      )
      same(
        'ox/erc4337:UserOperation.fromRpc',
        canonical(
          stripEmpty(
            call(
              'ox/erc4337:UserOperation.fromRpc',
              call('ox/erc4337:UserOperation.toRpc', userOperation),
            ),
          ),
        ),
        canonical(stripEmpty(userOperation)),
        'fromRpc(toRpc(...))',
      )
      call('ox/erc4337:UserOperation.from', userOperation)
      call('ox/erc4337:UserOperation.toInitCode', userOperation)
    },
  })

  // -------------------------------------------------------------------------------------------
  // Tempo.

  add({
    id: 'round trip: Tempo ticks, pools, zones, and virtual addresses',
    oracle: 'round trip',
    covers: [
      'ox/tempo:Tick.fromPrice',
      'ox/tempo:Tick.toPrice',
      'ox/tempo:ZoneId.fromChainId',
      'ox/tempo:ZoneId.toChainId',
      'ox/tempo:VirtualAddress.from',
      'ox/tempo:VirtualAddress.parse',
      'ox/tempo:VirtualAddress.isVirtual',
      'ox/tempo:VirtualAddress.validate',
      'ox/tempo:PoolId.from',
    ],
    runs: 200,
    arb: fc.record({
      tick: fc.integer({ min: -2000, max: 2000 }),
      zone: fc.integer({ min: 1, max: 1000 }),
      masterId: hexOf(4, 4),
      userTag: hexOf(6, 6),
      a: address,
      b: address,
    }),
    check({ tick, zone, masterId, userTag, a, b }) {
      const price = call('ox/tempo:Tick.toPrice', tick)
      same(
        'ox/tempo:Tick.fromPrice',
        call('ox/tempo:Tick.fromPrice', price),
        tick,
        `Tick.fromPrice(Tick.toPrice(${tick}) = ${price})`,
      )
      const chain = attempt(() => fn('ox/tempo:ZoneId.toChainId')(zone))
      if (chain !== undefined)
        same(
          'ox/tempo:ZoneId.fromChainId',
          call('ox/tempo:ZoneId.fromChainId', chain),
          zone,
          'ZoneId round trip',
        )
      const virtual = call('ox/tempo:VirtualAddress.from', {
        masterId,
        userTag,
      })
      same(
        'ox/tempo:VirtualAddress.parse',
        canonical(call('ox/tempo:VirtualAddress.parse', virtual)),
        canonical({ masterId, userTag }),
        'VirtualAddress round trip',
      )
      same(
        'ox/tempo:VirtualAddress.isVirtual',
        call('ox/tempo:VirtualAddress.isVirtual', virtual),
        true,
        'isVirtual',
      )
      call('ox/tempo:VirtualAddress.validate', virtual)
      same(
        'ox/tempo:PoolId.from',
        call('ox/tempo:PoolId.from', { userToken: a, validatorToken: b }),
        call('ox/tempo:PoolId.from', { userToken: a, validatorToken: b }),
        'PoolId is deterministic',
      )
    },
  })

  add({
    id: 'crash: Tempo EarnShares conversions on any vault state',
    oracle: 'crash',
    covers: [
      'ox/tempo:EarnShares.toAmount',
      'ox/tempo:EarnShares.toAmountUp',
      'ox/tempo:EarnShares.toVenueAmount',
    ],
    runs: 300,
    arb: fc.tuple(
      fc.record({ engineShares: uint(128), shareSupply: uint(128) }),
      uint(128),
    ),
    check([vault, shares]: [Any, bigint]) {
      for (const name of [
        'ox/tempo:EarnShares.toAmount',
        'ox/tempo:EarnShares.toAmountUp',
        'ox/tempo:EarnShares.toVenueAmount',
      ])
        try {
          fn(name)(vault, shares)
        } catch (error) {
          if (!documented(error)) throw crash(name, error)
        }
    },
  })

  add({
    id: 'crash: Tempo and EIP-8141 decoders on malformed input',
    oracle: 'crash',
    covers: [
      'ox/tempo:TxEnvelopeTempo.deserialize',
      'ox/tempo:KeyAuthorization.deserialize',
      'ox/tempo:SignatureEnvelope.deserialize',
      'ox:TxEnvelopeEip8141.deserialize',
      'ox:Cbor.decode',
    ],
    runs: 500,
    // A type byte and the RLP of random nested lists and strings, so decoding gets past the
    // envelope and into each field's shape.
    arb: fc
      .tuple(fc.constantFrom(0x76, 0x06, 0x01, 0x02, 0x03, 0x04, 0xc0), rlpArb)
      .map(([type, body]) => {
        const rlp = hexBytes(ethers.encodeRlp(body))
        return toHex(type >= 0xc0 ? rlp : Uint8Array.from([type, ...rlp]))
      }),
    check(serialized) {
      for (const name of [
        'ox/tempo:TxEnvelopeTempo.deserialize',
        'ox/tempo:KeyAuthorization.deserialize',
        'ox/tempo:SignatureEnvelope.deserialize',
        'ox:TxEnvelopeEip8141.deserialize',
        'ox:Cbor.decode',
      ])
        try {
          fn(name)(serialized)
        } catch (error) {
          if (!documented(error)) throw crash(name, error)
        }
    },
  })

  add({
    id: 'round trip: Tempo transactions serialize and deserialize',
    oracle: 'round trip',
    covers: [
      'ox/tempo:TxEnvelopeTempo.from',
      'ox/tempo:TxEnvelopeTempo.serialize',
      'ox/tempo:TxEnvelopeTempo.deserialize',
      'ox/tempo:TxEnvelopeTempo.hash',
      'ox/tempo:TxEnvelopeTempo.getSignPayload',
      'ox/tempo:TxEnvelopeTempo.validate',
      'ox/tempo:TxEnvelopeTempo.assert',
      'ox/tempo:SignatureEnvelope.from',
      'ox/tempo:SignatureEnvelope.serialize',
      'ox/tempo:SignatureEnvelope.deserialize',
      'ox/tempo:SignatureEnvelope.getType',
      'ox/tempo:SignatureEnvelope.toRpc',
      'ox/tempo:SignatureEnvelope.fromRpc',
    ],
    runs: 150,
    arb: fc.record({
      chainId,
      nonce: quantity,
      nonceKey: fc.option(uint(64), { nil: undefined }),
      gas: quantity,
      maxFeePerGas: quantity,
      maxPriorityFeePerGas: quantity,
      calls: fc.array(
        fc.record({ to: address, value: quantity, data: hexOf(0, 30) }),
        { minLength: 1, maxLength: 3 },
      ),
      feeToken: fc.option(address, { nil: undefined }),
      validBefore: fc.option(fc.integer({ min: 0, max: 2 ** 31 }), {
        nil: undefined,
      }),
      signature,
    }),
    check({ signature: sig, ...fields }) {
      const clean = stripEmpty(fields) as Any
      // ox rejects a tip above the fee cap.
      if (clean.maxPriorityFeePerGas > clean.maxFeePerGas) return
      const envelope = call('ox/tempo:TxEnvelopeTempo.from', clean)
      const signatureEnvelope = call('ox/tempo:SignatureEnvelope.from', sig)
      const serialized = call('ox/tempo:TxEnvelopeTempo.serialize', envelope, {
        signature: signatureEnvelope,
      })
      const back = call('ox/tempo:TxEnvelopeTempo.deserialize', serialized)
      same(
        'ox/tempo:TxEnvelopeTempo.serialize',
        call('ox/tempo:TxEnvelopeTempo.serialize', back),
        serialized,
        'serialize(deserialize(serialize(...)))',
      )
      for (const key of Object.keys(clean)) {
        // RLP encodes zero and empty as `0x`, which deserializing leaves out.
        if (back[key] === undefined && isZero(clean[key])) continue
        same(
          'ox/tempo:TxEnvelopeTempo.deserialize',
          canonical(stripZero(back[key])),
          canonical(stripZero(clean[key])),
          `deserialize(...).${key}`,
        )
      }
      same(
        'ox/tempo:TxEnvelopeTempo.hash',
        call('ox/tempo:TxEnvelopeTempo.hash', back),
        call('ox:Hash.keccak256', serialized),
        'hash is keccak256(serialized)',
      )
      call('ox/tempo:TxEnvelopeTempo.getSignPayload', envelope)
      call('ox/tempo:TxEnvelopeTempo.assert', envelope)
      same(
        'ox/tempo:TxEnvelopeTempo.validate',
        call('ox/tempo:TxEnvelopeTempo.validate', envelope),
        true,
        'validate',
      )
      const sigHex = call(
        'ox/tempo:SignatureEnvelope.serialize',
        signatureEnvelope,
      )
      same(
        'ox/tempo:SignatureEnvelope.deserialize',
        canonical(call('ox/tempo:SignatureEnvelope.deserialize', sigHex)),
        canonical(signatureEnvelope),
        'SignatureEnvelope round trip',
      )
      call('ox/tempo:SignatureEnvelope.getType', signatureEnvelope)
      same(
        'ox/tempo:SignatureEnvelope.fromRpc',
        canonical(
          call(
            'ox/tempo:SignatureEnvelope.fromRpc',
            call('ox/tempo:SignatureEnvelope.toRpc', signatureEnvelope),
          ),
        ),
        canonical(signatureEnvelope),
        'SignatureEnvelope RPC round trip',
      )
    },
  })

  return out

  // Helpers that need `fn`.
  function bigOf(hex: string, side: 'Left' | 'Right') {
    const body = hex.slice(2)
    if (side === 'Left') return body ? BigInt(`0x${body}`) : 0n
    return body.replace(/0+$/, '')
  }
  function capture(thunk: () => unknown) {
    try {
      thunk()
    } catch (error) {
      return error
    }
    return undefined
  }
}

/**
 * Hand-written argument sets for public functions that ox's tests never call, or call only with
 * values the recording cannot carry. The fuzzer mutates them like recorded ones.
 */
export function seeds(lib: Lib): Record<string, unknown[][]> {
  const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
  const hash = `0x${'ab'.repeat(32)}`
  const out: Record<string, unknown[][]> = {}
  const set = (name: string, ...argumentSets: unknown[][]) => {
    out[name] = argumentSets
  }
  set(
    'ox/tempo:EarnShares.toAmount',
    [{ engineShares: 1000n, shareSupply: 2000n }, 10n],
    [{ engineShares: 1n, shareSupply: 1n }, 0n],
  )
  set('ox/tempo:EarnShares.toAmountUp', [
    { engineShares: 1000n, shareSupply: 2000n },
    10n,
  ])
  set('ox/tempo:EarnShares.toVenueAmount', [
    { engineShares: 1000n, shareSupply: 2000n },
    10n,
  ])
  set('ox/tempo:VirtualMaster.getMasterId', [{ address, salt: hash }])
  set('ox/tempo:VirtualMaster.getRegistrationHash', [{ address, salt: hash }])
  void lib
  return out
}

// ---------------------------------------------------------------------------------------------
// Value helpers.

function toHex(bytes: Uint8Array): `0x${string}` {
  let out = '0x'
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out as `0x${string}`
}

function toHex32(value: bigint) {
  return `0x${value.toString(16).padStart(64, '0')}` as `0x${string}`
}

function hexBytes(hex: string): Uint8Array {
  const body = hex.slice(2)
  const out = new Uint8Array(body.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(body.slice(i * 2, i * 2 + 2), 16)
  return out
}

function asBytes(value: unknown): Uint8Array {
  return typeof value === 'string' ? hexBytes(value) : (value as Uint8Array)
}

function mapHex(value: unknown, map: (hex: string) => unknown): unknown {
  return Array.isArray(value)
    ? value.map((item) => mapHex(item, map))
    : map(value as string)
}

function mapBytes(
  value: unknown,
  map: (bytes: Uint8Array) => unknown,
): unknown {
  return Array.isArray(value)
    ? value.map((item) => mapBytes(item, map))
    : map(value as Uint8Array)
}

/** Drops `undefined` fields and empty lists, which encodings leave out. */
function stripEmpty(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripEmpty)
  if (value && typeof value === 'object' && !(value instanceof Uint8Array)) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue
      if (Array.isArray(item) && item.length === 0) continue
      out[key] = stripEmpty(item)
    }
    return out
  }
  return value
}

/** Whether a field holds what RLP encodes as `0x`: zero or empty. */
function isZero(value: unknown) {
  return value === 0n || value === '0x'
}

/**
 * {@link stripEmpty}, and also drops zero and empty fields: deserializing reads RLP `0x` as a
 * missing field, as viem does.
 */
function stripZero(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripZero)
  if (value && typeof value === 'object' && !(value instanceof Uint8Array)) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined || isZero(item)) continue
      if (Array.isArray(item) && item.length === 0) continue
      out[key] = stripZero(item)
    }
    return out
  }
  return value
}

function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a instanceof Uint8Array || b instanceof Uint8Array)
    return (
      a instanceof Uint8Array &&
      b instanceof Uint8Array &&
      a.length === b.length &&
      a.every((byte, i) => byte === b[i])
    )
  if (a instanceof Date || b instanceof Date)
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false
    return a.every((item, i) => equal(item, b[i]))
  }
  if (a && b && typeof a === 'object') {
    const keys = Object.keys(a as object)
    if (keys.length !== Object.keys(b as object).length) return false
    return keys.every((key) =>
      equal(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    )
  }
  return false
}

function show(value: unknown): string {
  const text = (() => {
    try {
      return JSON.stringify(value, (_, item) =>
        typeof item === 'bigint'
          ? `${item}n`
          : item instanceof Uint8Array
            ? `Uint8Array(${toHex(item)})`
            : item === undefined
              ? 'undefined'
              : item,
      )
    } catch {
      return String(value)
    }
  })()
  return text && text.length > 200 ? `${text.slice(0, 199)}…` : String(text)
}

function short(name: string) {
  return name.split(':')[1] ?? name
}

function siteOf(error: unknown): string | undefined {
  const stack = String((error as Error)?.stack ?? '')
  for (const line of stack.split('\n').slice(1)) {
    const match = line.match(/\(?(?:file:\/\/)?([^\s()]+):(\d+):\d+\)?$/)
    if (!match) continue
    const file = match[1]!
    if (/fuzz-|node:|fast-check/.test(file)) continue
    const relative = file.includes('/node_modules/')
      ? file.replace(
          /^.*\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?/,
          '',
        )
      : file.replace(/^.*\/dist\//, 'dist/')
    return `${relative}:${match[2]}`
  }
  return undefined
}
