/**
 * The structured properties the fuzz category runs for ox: round trips for every encode/decode and
 * to/from pair, differentials against the independent implementations ox's devDependencies
 * provide (viem, ethers v6, noble, @scure/base, @ethereumjs/rlp, micro-eth-signer), and
 * consistency between functions that must agree. Each property lists the public functions it
 * exercises (`covers`), and its failure names the function at fault (`blame`) when the check can
 * tell, such as ox disagreeing with every reference that accepted the input.
 *
 * Inputs are well-formed for the function's types (fast-check arbitraries), so any error a call
 * throws is a failure too, except where a check expects one of ox's documented errors.
 *
 * `seeds` lists hand-written argument sets for functions no property covers well, which the
 * worker mutates at the boundaries as it does recorded arguments. `library` loads the reference
 * implementations, and `mutations` and `budgets` set how many boundary mutations each function
 * gets, for this branch's dependencies and costs. Functions go by their leaf entry, such as
 * `ox/Hex:fromNumber`; the worker matches them to the names its lines use, such as
 * `ox:Hex.fromNumber`, by identity.
 *
 * @module
 */

import { createRequire } from 'node:module'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

import type fcModule from 'fast-check'

type Fc = typeof fcModule
type Arbitrary<value = unknown> = fcModule.Arbitrary<value>
type Module = Record<string, unknown>
type Any = any

export type Lib = {
  /** ox's entry points by public name, such as `ox/Hex` or `ox/tempo/TxEnvelopeTempo`. */
  ox: Record<string, Module>
  viem: Any
  viemSiwe: Any
  viemAa: Any
  viemUtils: Any
  ethers: Any
  /** noble, loaded through `require`: a separate instance from the one ox's build imports. */
  noble: Any
  /** @scure/base, for Base32, Base58, Base64 and Bech32m. */
  scure: Any
  bip32: Any
  ethereumjsRlp: Any
  micro: Any
  /** micro-eth-signer's KZG with the fast trusted setup, loaded on first use. */
  readonly kzg: Any
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

/**
 * Adds the independent implementations ox's devDependencies provide (viem, ethers, noble,
 * @scure/base, @ethereumjs/rlp, micro-eth-signer) to what the worker passes. noble is loaded
 * through `require`, a separate instance from the one ox's build imports.
 */
export async function library(base: Base): Promise<Lib> {
  const fromRoot = createRequire(path.join(base.root, 'package.json'))
  const fromSrc = createRequire(path.join(base.root, 'src/package.json'))
  const fromMicro = createRequire(fromRoot.resolve('micro-eth-signer'))
  const load = (specifier: string, require = fromRoot) =>
    import(pathToFileURL(require.resolve(specifier)).href)
  const noble = {
    secp256k1: fromSrc('@noble/curves/secp256k1').secp256k1,
    p256: fromSrc('@noble/curves/p256').p256,
    ed25519: fromSrc('@noble/curves/ed25519'),
    bls: fromSrc('@noble/curves/bls12-381').bls12_381,
    sha3: fromSrc('@noble/hashes/sha3'),
    sha2: fromSrc('@noble/hashes/sha2'),
    legacy: fromSrc('@noble/hashes/legacy'),
    blake3: fromSrc('@noble/hashes/blake3').blake3,
    hmac: fromSrc('@noble/hashes/hmac').hmac,
    pbkdf2: fromSrc('@noble/hashes/pbkdf2').pbkdf2,
    scrypt: fromSrc('@noble/hashes/scrypt').scrypt,
  }
  let kzg: unknown
  return {
    ...base,
    viem: await load('viem'),
    viemSiwe: await load('viem/siwe'),
    viemAa: await load('viem/account-abstraction'),
    viemUtils: await load('viem/utils'),
    ethers: await load('ethers'),
    noble,
    scure: fromMicro('@scure/base'),
    bip32: fromSrc('@scure/bip32'),
    ethereumjsRlp: await load('@ethereumjs/rlp'),
    micro: {
      ...(await load('micro-eth-signer')),
      ...(await load('micro-eth-signer/rlp.js')),
      typed: await load('micro-eth-signer/typed-data.js'),
    },
    get kzg() {
      // The trusted setup costs about a second and tens of MB, so only Blobs properties load it.
      if (!kzg) {
        const { KZG } = fromRoot('micro-eth-signer/kzg.js')
        const { trustedSetup } = fromRoot(
          '@paulmillr/trusted-setups/fast-kzg.js',
        )
        kzg = new KZG(trustedSetup)
      }
      return kzg
    },
  }
}

/** Mutated calls per function with recorded or hand-written arguments, unless `budgets` says otherwise. */
export const mutations = 400

/** Fewer calls for functions whose every call costs milliseconds; the first match applies. */
export const budgets: [RegExp, number][] = [
  [/^ox:(Blobs|Kzg)\./, 6],
  [
    /^ox:(Mnemonic|HdKey)\.|^ox:(Secp256k1|P256|Ed25519|AesGcm)\.fromMnemonic$/,
    10,
  ],
  // PBKDF2 runs 262,144 rounds unless told otherwise: seconds a call under coverage.
  [/^ox:Keystore\.pbkdf2/, 3],
  [/^ox:(Keystore|AesGcm)\./, 12],
  [/^ox:(Bls|BlsPoint)\./, 12],
  // Mining a salt is unbounded work by design (a mutant without `count` mines 2^32 salts), so only
  // the recorded calls run.
  [/^ox\/tempo:VirtualMaster\.mineSalt/, 0],
  [/^ox:BinaryStateTree\./, 60],
  [
    /^ox:(Secp256k1|P256|Ed25519|X25519|WebCryptoP256|WebAuthnP256)\.|^ox\/webauthn:|[.:](verify|recover\w*|extractAddress|extractPublicKey)$/,
    80,
  ],
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

export function properties(lib: Lib): Property[] {
  const { fc, ethers, noble, scure, viem } = lib
  const fn = (name: string): Any => {
    const [entry, key] = name.split(':') as [string, string]
    const value = lib.ox[entry]?.[key]
    if (typeof value !== 'function')
      throw new Error(`${name} is not a function`)
    return value
  }
  /** An ox module by entry, such as `ox('Hex')` or `ox('tempo/KeyAuthorization')`. */
  const ox = (entry: string): Any => {
    const module = lib.ox[`ox/${entry}`]
    if (!module) throw new Error(`ox has no ${entry}`)
    return module
  }
  const documented = (error: unknown) =>
    error instanceof Error &&
    ![TypeError, RangeError, SyntaxError, ReferenceError].includes(
      Object.getPrototypeOf(error)?.constructor,
    )

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
    error instanceof Failure
      ? error
      : new Failure(
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
  /** Calls an ox function on input it may reject: a documented error gives `undefined`. */
  const tolerant = (name: string, ...args: unknown[]): Any => {
    try {
      return { value: fn(name)(...args) }
    } catch (error) {
      if (documented(error)) return undefined
      throw crash(name, error)
    }
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
    if (equal(actual, expected)) return
    const [at, got, wanted] = difference(actual, expected, '')!
    throw new Failure(
      `${what}: ${at ? `at ${at}: ` : ''}got ${show(got)}, expected ${show(wanted)}`,
      { blame: Array.isArray(name) ? name : [name] },
    )
  }
  /**
   * Blames ox only when it disagrees with every reference that accepted the input: a reference
   * that agrees with ox is a second implementation on its side, and a reference that rejected the
   * input (`attempt` gave `undefined`) has no say.
   */
  const vote = (
    name: string,
    value: unknown,
    references: Record<string, unknown>,
    what: string,
  ) => {
    const refs = Object.keys(references).filter(
      (key) => references[key] !== undefined,
    )
    if (!refs.length) return
    if (refs.some((key) => equal(value, references[key]))) return
    const [at, ours, theirs] = difference(value, references[refs[0]!], '')!
    throw new Failure(
      `${what}: ${at ? `at ${at}: ` : ''}ox ${show(ours)}, ${refs[0]} ${show(theirs)}${refs.length > 1 ? ` (${refs.slice(1).join(', ')} disagree too)` : ''}`,
      { blame: [name] },
    )
  }

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
  const scalar = fc.bigInt({ min: 1n, max: secp256k1N - 1n })
  const privateKey = scalar.map(toHex32)
  const p256Key = fc.bigInt({ min: 1n, max: p256N - 1n }).map(toHex32)
  const signature = fc.record({
    r: scalar,
    s: scalar,
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
    fc.constantFrom(1, 10, 4217, 42431, 2 ** 31 - 1),
    fc.integer({ min: 1, max: 2 ** 32 - 1 }),
  )
  const optional = <value>(arb: Arbitrary<value>) =>
    fc.option(arb, { nil: undefined })

  const props: Property[] = []
  const add = (prop: Property) => props.push(prop)

  // Numbers and bigints to hex and bytes, with sizes and signs.
  {
    const sizedNumber = fc
      .record({
        size: optional(fc.integer({ min: 1, max: 32 })),
        signed: fc.boolean(),
      })
      .chain(({ size, signed: signed_ }) => {
        // Signed values need a size: without one, the width (and so the sign bit) is unknown.
        const signed = signed_ && size !== undefined
        const bits = (size ?? 32) * 8
        return fc.record({
          size: fc.constant(size),
          signed: fc.constant(signed),
          value: fc.oneof(
            signed ? int(bits) : uint(bits),
            fc.constantFrom(0n, 1n, signed ? -1n : 2n ** BigInt(bits) - 1n),
          ),
        })
      })
    add({
      id: 'round trip: number ↔ hex (differential with viem and ethers)',
      oracle: 'round trip',
      covers: ['ox/Hex:fromNumber', 'ox/Hex:toBigInt', 'ox/Hex:toNumber'],
      runs: 300,
      arb: sizedNumber,
      check({ value, size, signed }) {
        const hex = call('ox/Hex:fromNumber', value, { size, signed })
        if (size !== undefined)
          same(
            'ox/Hex:fromNumber',
            (hex.length - 2) / 2,
            size,
            'size of Hex.fromNumber output',
          )
        same(
          'ox/Hex:toBigInt',
          call('ox/Hex:toBigInt', hex, { size, signed }),
          value,
          'Hex.toBigInt(Hex.fromNumber(x))',
        )
        if (
          value >= BigInt(Number.MIN_SAFE_INTEGER) &&
          value <= BigInt(Number.MAX_SAFE_INTEGER)
        ) {
          same(
            'ox/Hex:toNumber',
            call('ox/Hex:toNumber', hex, { size, signed }),
            Number(value),
            'Hex.toNumber(Hex.fromNumber(x))',
          )
          same(
            'ox/Hex:fromNumber',
            call('ox/Hex:fromNumber', Number(value), { size, signed }),
            hex,
            'Hex.fromNumber(number) agrees with Hex.fromNumber(bigint)',
          )
        } else
          rejects(
            'ox/Hex:toNumber',
            `${hex}, which is not a safe integer`,
            hex,
            { size, signed },
          )
        vote(
          'ox/Hex:fromNumber',
          hex,
          {
            viem: attempt(() => viem.numberToHex(value, { size, signed })),
            ...(!signed && size !== undefined
              ? { ethers: attempt(() => ethers.toBeHex(value, size)) }
              : {}),
          },
          'Hex.fromNumber',
        )
      },
    })
    add({
      id: 'round trip: number ↔ bytes (differential with viem)',
      oracle: 'round trip',
      covers: ['ox/Bytes:fromNumber', 'ox/Bytes:toBigInt', 'ox/Bytes:toNumber'],
      runs: 300,
      arb: sizedNumber,
      check({ value, size, signed }) {
        const bytes = call('ox/Bytes:fromNumber', value, { size, signed })
        if (size !== undefined)
          same(
            'ox/Bytes:fromNumber',
            bytes.length,
            size,
            'length of Bytes.fromNumber output',
          )
        same(
          'ox/Bytes:toBigInt',
          call('ox/Bytes:toBigInt', bytes, { size, signed }),
          value,
          'Bytes.toBigInt(Bytes.fromNumber(x))',
        )
        if (
          value >= BigInt(Number.MIN_SAFE_INTEGER) &&
          value <= BigInt(Number.MAX_SAFE_INTEGER)
        )
          same(
            'ox/Bytes:toNumber',
            call('ox/Bytes:toNumber', bytes, { size, signed }),
            Number(value),
            'Bytes.toNumber(Bytes.fromNumber(x))',
          )
        vote(
          'ox/Bytes:fromNumber',
          bytes,
          { viem: attempt(() => viem.numberToBytes(value, { size, signed })) },
          'Bytes.fromNumber',
        )
      },
    })
    add({
      id: 'consistency: empty hex and bytes read as zero or are rejected alike',
      oracle: 'consistency',
      covers: [
        'ox/Hex:toBigInt',
        'ox/Hex:toNumber',
        'ox/Bytes:toBigInt',
        'ox/Bytes:toNumber',
      ],
      runs: 4,
      arb: fc.boolean(),
      check(signed) {
        // `0x` is a valid `Hex`, and `Hex.toNumber('0x')` throws the documented
        // IntegerOutOfRangeError (ox's Hex.test.ts); the others must not throw a built-in error.
        tolerant('ox/Hex:toNumber', '0x', { signed })
        tolerant('ox/Hex:toBigInt', '0x', { signed })
        tolerant('ox/Bytes:toNumber', new Uint8Array(), { signed })
        tolerant('ox/Bytes:toBigInt', new Uint8Array(), { signed })
      },
    })
    add({
      id: 'consistency: out-of-range integers are rejected',
      oracle: 'consistency',
      covers: ['ox/Hex:fromNumber', 'ox/Bytes:fromNumber'],
      runs: 200,
      arb: fc
        .record({
          size: fc.integer({ min: 1, max: 32 }),
          signed: fc.boolean(),
          over: fc.bigInt({ min: 0n, max: 2n ** 70n }),
          below: fc.boolean(),
        })
        .map(({ size, signed, over, below }) => {
          const bits = BigInt(size * 8)
          const max = signed ? 2n ** (bits - 1n) - 1n : 2n ** bits - 1n
          const min = signed ? -(2n ** (bits - 1n)) : 0n
          return {
            size,
            signed,
            value: below ? min - 1n - over : max + 1n + over,
          }
        }),
      check({ size, signed, value }) {
        const why = `${value}n, out of range for ${signed ? 'int' : 'uint'}${size * 8}`
        rejects('ox/Hex:fromNumber', why, value, { size, signed })
        rejects('ox/Bytes:fromNumber', why, value, { size, signed })
      },
    })
    add({
      id: 'consistency: non-integer numbers are rejected',
      oracle: 'consistency',
      covers: ['ox/Hex:fromNumber', 'ox/Bytes:fromNumber'],
      runs: 100,
      arb: fc.oneof(
        fc.double({ noInteger: true, noNaN: true }),
        fc.constantFrom(
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ),
      ),
      check(value) {
        // A fraction cannot be hex. Any error will do (BigInt's RangeError names the number), but
        // returning a value is wrong output.
        for (const name of ['ox/Hex:fromNumber', 'ox/Bytes:fromNumber']) {
          let result: unknown
          try {
            result = fn(name)(value)
          } catch {
            continue
          }
          throw new Failure(
            `${short(name)} accepted the non-integer ${value} and returned ${show(result)}`,
            { blame: [name], kind: 'wrong output' },
          )
        }
      },
    })
  }
  add({
    id: 'round trip: string ↔ hex/bytes (differential with ethers)',
    oracle: 'round trip',
    covers: [
      'ox/Hex:fromString',
      'ox/Hex:toString',
      'ox/Bytes:fromString',
      'ox/Bytes:toString',
    ],
    runs: 300,
    arb: fc.record({
      value: fc.oneof(text, fc.string({ unit: 'binary', maxLength: 20 })),
      pad: optional(fc.integer({ min: 0, max: 8 })),
    }),
    check({ value, pad }) {
      const encoded = new TextEncoder().encode(value)
      // Lone surrogates do not survive UTF-8, so only well-formed strings round-trip.
      const wellFormed = new TextDecoder().decode(encoded) === value
      // Padding a string ending in NUL loses the NULs, as documented trimming does, and the
      // empty string padded reads back as one NUL (trimming keeps one byte), as viem's does.
      const size =
        pad === undefined || /\0$/.test(value) || value === ''
          ? undefined
          : encoded.length + pad
      const hex = call('ox/Hex:fromString', value, { size })
      const bytes = call('ox/Bytes:fromString', value, { size })
      same(
        'ox/Hex:fromString',
        hex,
        toHex(bytes),
        'Hex.fromString agrees with Bytes.fromString',
      )
      if (wellFormed) {
        same(
          'ox/Hex:toString',
          call('ox/Hex:toString', hex, { size }),
          value,
          'Hex.toString(Hex.fromString(s))',
        )
        same(
          'ox/Bytes:toString',
          call('ox/Bytes:toString', bytes, { size }),
          value,
          'Bytes.toString(Bytes.fromString(s))',
        )
      }
      vote(
        'ox/Bytes:fromString',
        call('ox/Bytes:fromString', value),
        { ethers: attempt(() => ethers.toUtf8Bytes(value)), encoder: encoded },
        'UTF-8 bytes',
      )
    },
  })
  add({
    id: 'round trip: bool ↔ hex/bytes',
    oracle: 'round trip',
    covers: [
      'ox/Hex:fromBoolean',
      'ox/Hex:toBoolean',
      'ox/Bytes:fromBoolean',
      'ox/Bytes:toBoolean',
    ],
    runs: 60,
    arb: fc.record({
      value: fc.boolean(),
      size: optional(fc.integer({ min: 1, max: 32 })),
    }),
    check({ value, size }) {
      const hex = call('ox/Hex:fromBoolean', value, { size })
      same(
        'ox/Hex:fromBoolean',
        BigInt(hex),
        value ? 1n : 0n,
        'Hex.fromBoolean value',
      )
      same(
        'ox/Hex:toBoolean',
        call('ox/Hex:toBoolean', hex, { size }),
        value,
        'Hex.toBoolean(Hex.fromBoolean(b))',
      )
      const bytes = call('ox/Bytes:fromBoolean', value, { size })
      same(
        'ox/Bytes:fromBoolean',
        toHex(bytes),
        call('ox/Hex:fromBoolean', value, { size: size ?? 1 }),
        'Bytes.fromBoolean agrees with Hex.fromBoolean',
      )
      same(
        'ox/Bytes:toBoolean',
        call('ox/Bytes:toBoolean', bytes, { size }),
        value,
        'Bytes.toBoolean(Bytes.fromBoolean(b))',
      )
    },
  })
  add({
    id: 'consistency: toBoolean rejects values other than 0 and 1',
    oracle: 'consistency',
    covers: ['ox/Hex:toBoolean', 'ox/Bytes:toBoolean'],
    runs: 100,
    arb: fc.record({
      value: uint(256).filter((value) => value > 1n),
      bytes: fc.integer({ min: 1, max: 32 }),
    }),
    check({ value, bytes }) {
      const hex = `0x${value.toString(16).padStart(bytes * 2, '0')}`
      rejects('ox/Hex:toBoolean', `${hex}, which is neither 0 nor 1`, hex)
      rejects(
        'ox/Bytes:toBoolean',
        `${hex} as bytes, which is neither 0 nor 1`,
        hexBytes(hex),
      )
    },
  })
  add({
    id: 'round trip: bytes ↔ hex (differential with ethers)',
    oracle: 'round trip',
    covers: [
      'ox/Bytes:toHex',
      'ox/Bytes:fromHex',
      'ox/Hex:fromBytes',
      'ox/Hex:toBytes',
      'ox/Hex:from',
      'ox/Bytes:from',
      'ox/Bytes:fromArray',
    ],
    runs: 300,
    arb: fc.record({
      bytes: bytesOf(0, 80),
      upper: fc.boolean(),
      pad: optional(fc.integer({ min: 0, max: 8 })),
    }),
    check({ bytes, upper, pad }) {
      const hex = call('ox/Bytes:toHex', bytes)
      vote(
        'ox/Bytes:toHex',
        hex,
        { ethers: ethers.hexlify(bytes) },
        'Bytes.toHex',
      )
      same(
        'ox/Hex:fromBytes',
        call('ox/Hex:fromBytes', bytes),
        hex,
        'Hex.fromBytes agrees with Bytes.toHex',
      )
      same('ox/Hex:from', call('ox/Hex:from', bytes), hex, 'Hex.from(bytes)')
      same('ox/Hex:from', call('ox/Hex:from', [...bytes]), hex, 'Hex.from([])')
      same('ox/Hex:from', call('ox/Hex:from', hex), hex, 'Hex.from(hex)')
      const input = upper ? `0x${hex.slice(2).toUpperCase()}` : hex
      same(
        'ox/Hex:toBytes',
        call('ox/Hex:toBytes', input),
        bytes,
        'Hex.toBytes(Bytes.toHex(b))',
      )
      same(
        'ox/Bytes:fromHex',
        call('ox/Bytes:fromHex', input),
        bytes,
        'Bytes.fromHex(Bytes.toHex(b))',
      )
      same('ox/Bytes:from', call('ox/Bytes:from', input), bytes, 'Bytes.from')
      same(
        'ox/Bytes:fromArray',
        call('ox/Bytes:fromArray', [...bytes]),
        bytes,
        'Bytes.fromArray',
      )
      if (pad !== undefined) {
        // A size pads bytes on the right, as text (viem's bytesToHex and hexToBytes agree).
        const size = bytes.length + pad
        const padded = new Uint8Array(size)
        padded.set(bytes, 0)
        vote(
          'ox/Bytes:toHex',
          call('ox/Bytes:toHex', bytes, { size }),
          { viem: viem.bytesToHex(bytes, { size }), reference: toHex(padded) },
          'Bytes.toHex(b, {size})',
        )
        vote(
          'ox/Hex:toBytes',
          call('ox/Hex:toBytes', hex, { size }),
          { viem: viem.hexToBytes(hex, { size }), reference: padded },
          'Hex.toBytes(h, {size})',
        )
      }
    },
  })
  add({
    id: 'consistency: odd-length hex reads with a leading zero nibble',
    oracle: 'consistency',
    covers: ['ox/Hex:toBytes', 'ox/Bytes:fromHex'],
    runs: 100,
    arb: fc
      .string({ unit: fc.constantFrom(...'0123456789abcdef'), maxLength: 15 })
      .filter((body) => body.length % 2 === 1),
    check(body) {
      const expected = hexBytes(`0x0${body}`)
      same(
        'ox/Bytes:fromHex',
        call('ox/Bytes:fromHex', `0x${body}`),
        expected,
        `Bytes.fromHex(0x${body})`,
      )
      same(
        'ox/Hex:toBytes',
        call('ox/Hex:toBytes', `0x${body}`),
        expected,
        `Hex.toBytes(0x${body})`,
      )
    },
  })
  add({
    id: 'differential: hex decoding rejects what is not hex',
    oracle: 'differential',
    covers: ['ox/Hex:toBytes', 'ox/Bytes:fromHex', 'ox/Bytes:from'],
    runs: 300,
    arb: fc
      .string({
        unit: fc.constantFrom(...'0123456789abcdefABCDEFgxz -'),
        maxLength: 12,
      })
      .map((body) => `0x${body}`),
    check(hex) {
      if (/^0x[0-9a-fA-F]*$/.test(hex)) return
      for (const name of [
        'ox/Hex:toBytes',
        'ox/Bytes:fromHex',
        'ox/Bytes:from',
      ])
        rejects(name, `${JSON.stringify(hex)}, which is not hex`, hex)
    },
  })

  // size, pad, trim, slice, and concat on hex and bytes.
  add({
    id: 'consistency: pad, trim and size on hex and bytes',
    oracle: 'consistency',
    covers: [
      'ox/Hex:padLeft',
      'ox/Hex:padRight',
      'ox/Hex:trimLeft',
      'ox/Hex:trimRight',
      'ox/Hex:size',
      'ox/Bytes:padLeft',
      'ox/Bytes:padRight',
      'ox/Bytes:trimLeft',
      'ox/Bytes:trimRight',
      'ox/Bytes:size',
    ],
    runs: 300,
    arb: fc.record({
      bytes: fc.oneof(
        bytesOf(0, 40),
        fc
          .tuple(fc.nat(6), bytesOf(0, 6), fc.nat(6))
          .map(
            ([left, middle, right]) =>
              new Uint8Array([
                ...new Uint8Array(left),
                ...middle,
                ...new Uint8Array(right),
              ]),
          ),
      ),
      size: optional(fc.integer({ min: 0, max: 48 })),
    }),
    check({ bytes, size }) {
      const hex = toHex(bytes)
      same('ox/Hex:size', call('ox/Hex:size', hex), bytes.length, 'Hex.size')
      same(
        'ox/Bytes:size',
        call('ox/Bytes:size', bytes),
        bytes.length,
        'Bytes.size',
      )
      const target = size ?? 32
      for (const dir of ['Left', 'Right'] as const) {
        const hexName = `ox/Hex:pad${dir}`
        const bytesName = `ox/Bytes:pad${dir}`
        // Size 0 leaves the value as it is (src/core/internal/hex.ts `pad`).
        if (target === 0) {
          same(hexName, call(hexName, hex, size), hex, `Hex.pad${dir}(x, 0)`)
          same(
            bytesName,
            call(bytesName, bytes, size),
            bytes,
            `Bytes.pad${dir}(x, 0)`,
          )
          continue
        }
        if (bytes.length > target) {
          rejects(hexName, `${hex} into ${target} bytes`, hex, size)
          rejects(
            bytesName,
            `${bytes.length} bytes into ${target}`,
            bytes,
            size,
          )
          continue
        }
        const expected = new Uint8Array(target)
        expected.set(bytes, dir === 'Left' ? target - bytes.length : 0)
        same(
          hexName,
          call(hexName, hex, size),
          toHex(expected),
          `Hex.pad${dir}(${hex}, ${size})`,
        )
        same(
          bytesName,
          call(bytesName, bytes, size),
          expected,
          `Bytes.pad${dir}(${bytes.length} bytes, ${size})`,
        )
      }
      // Hex trims nibbles and may return `0x` (ox's Hex.test.ts); Bytes trims whole bytes and
      // keeps at least one. Both keep the value.
      const left = call('ox/Hex:trimLeft', hex)
      same(
        'ox/Hex:trimLeft',
        left === '0x' ? 0n : BigInt(left),
        bytes.length ? BigInt(hex) : 0n,
        `Hex.trimLeft(${hex}) keeps the value`,
      )
      if (/^0x0/.test(left))
        throw new Failure(`Hex.trimLeft(${hex}) left a leading zero: ${left}`, {
          blame: ['ox/Hex:trimLeft'],
        })
      same(
        'ox/Bytes:trimLeft',
        call('ox/Bytes:trimLeft', bytes),
        trimBytes(bytes, 'left'),
        `Bytes.trimLeft drops only leading zero bytes`,
      )
      same(
        'ox/Bytes:trimRight',
        call('ox/Bytes:trimRight', bytes),
        trimBytes(bytes, 'right'),
        `Bytes.trimRight drops only trailing zero bytes`,
      )
      const right = call('ox/Hex:trimRight', hex)
      if (
        !/^0x([0-9a-f]{2})*$/.test(right) ||
        !hex.startsWith(right) ||
        /^0*$/.test(hex.slice(right.length)) === false
      )
        throw new Failure(
          `Hex.trimRight(${hex}) returned ${right}, which is not the input less trailing zero bytes`,
          { blame: ['ox/Hex:trimRight'] },
        )
    },
  })
  add({
    id: 'consistency: slice on hex and bytes agree with Array.prototype.slice',
    oracle: 'consistency',
    covers: ['ox/Hex:slice', 'ox/Bytes:slice'],
    runs: 300,
    arb: fc.record({
      bytes: bytesOf(0, 24),
      start: optional(fc.integer({ min: -4, max: 28 })),
      end: optional(fc.integer({ min: -4, max: 28 })),
      strict: fc.boolean(),
    }),
    check({ bytes, start, end, strict }) {
      const hex = toHex(bytes)
      const outcome = (name: string, value: unknown) => {
        try {
          return { value: fn(name)(value, start, end, { strict }) }
        } catch (error) {
          if (!documented(error)) throw crash(name, error)
          return { error: (error as Error).name }
        }
      }
      const fromHex = outcome('ox/Hex:slice', hex) as Any
      const fromBytes = outcome('ox/Bytes:slice', bytes) as Any
      const view = (result: Any) =>
        'value' in result
          ? toHex(
              result.value instanceof Uint8Array
                ? result.value
                : hexBytes(result.value),
            )
          : `throws ${result.error.replace(/^(Hex|Bytes)\./, '')}`
      if (view(fromHex) !== view(fromBytes))
        throw new Failure(
          `Hex.slice(${hex}, ${start}, ${end}, {strict: ${strict}}) → ${view(fromHex)}, Bytes.slice → ${view(fromBytes)}`,
          { blame: ['ox/Hex:slice', 'ox/Bytes:slice'] },
        )
      if ('value' in fromBytes)
        same(
          ['ox/Bytes:slice', 'ox/Hex:slice'],
          view(fromBytes),
          toHex(bytes.slice(start, end)),
          `slice(${start}, ${end}) of ${bytes.length} bytes`,
        )
    },
  })
  add({
    id: 'consistency: concat and isEqual on hex and bytes',
    oracle: 'consistency',
    covers: [
      'ox/Hex:concat',
      'ox/Bytes:concat',
      'ox/Hex:isEqual',
      'ox/Bytes:isEqual',
    ],
    runs: 200,
    arb: fc.tuple(fc.array(bytesOf(0, 12), { maxLength: 5 }), bytesOf(0, 4)),
    check([parts, other]) {
      const expected = Uint8Array.from(parts.flatMap((part) => [...part]))
      const hex = call('ox/Hex:concat', ...parts.map(toHex))
      const bytes = call('ox/Bytes:concat', ...parts)
      same('ox/Hex:concat', hex, toHex(expected), 'Hex.concat')
      same('ox/Bytes:concat', bytes, expected, 'Bytes.concat')
      same(
        'ox/Hex:isEqual',
        call('ox/Hex:isEqual', hex, hex.toUpperCase().replace('0X', '0x')),
        true,
        'Hex.isEqual ignores case',
      )
      same(
        'ox/Hex:isEqual',
        call('ox/Hex:isEqual', hex, toHex(other)),
        equal(expected, other),
        'Hex.isEqual',
      )
      same(
        'ox/Bytes:isEqual',
        call('ox/Bytes:isEqual', bytes, other),
        equal(expected, other),
        'Bytes.isEqual',
      )
    },
  })
  add({
    id: 'consistency: validate and assert on hex and bytes',
    oracle: 'consistency',
    covers: [
      'ox/Hex:validate',
      'ox/Hex:assert',
      'ox/Bytes:validate',
      'ox/Bytes:assert',
    ],
    runs: 300,
    arb: fc.oneof(
      fc
        .string({
          unit: fc.constantFrom(...'0123456789abcdefABCDEFx g'),
          maxLength: 70,
        })
        .map((body) => `0x${body}`),
      fc.string({ maxLength: 8 }),
      bytesOf(0, 8),
      fc.constantFrom(null, undefined, 0, 1n, {}, [], [1, 2]),
    ),
    check(value) {
      // `strict` defaults to false: any string that starts with `0x` passes (src/core/Hex.ts).
      const hex = typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value)
      const loose = typeof value === 'string' && value.startsWith('0x')
      same(
        'ox/Hex:validate',
        call('ox/Hex:validate', value, { strict: true }),
        hex,
        `Hex.validate(${show(value)}, {strict: true})`,
      )
      same(
        'ox/Hex:validate',
        call('ox/Hex:validate', value),
        loose,
        `Hex.validate(${show(value)})`,
      )
      same(
        'ox/Hex:validate',
        call('ox/Hex:validate', value, { even: true, strict: true }),
        hex && value.length % 2 === 0,
        `Hex.validate(${show(value)}, {even: true, strict: true})`,
      )
      if (hex) call('ox/Hex:assert', value, { strict: true })
      else rejects('ox/Hex:assert', show(value), value, { strict: true })
      if (loose) call('ox/Hex:assert', value)
      else rejects('ox/Hex:assert', show(value), value)
      const isBytes = value instanceof Uint8Array
      same(
        'ox/Bytes:validate',
        call('ox/Bytes:validate', value),
        isBytes,
        `Bytes.validate(${show(value)})`,
      )
      if (isBytes) call('ox/Bytes:assert', value)
      else rejects('ox/Bytes:assert', show(value), value)
    },
  })
  add({
    id: 'consistency: random values have the requested size',
    oracle: 'consistency',
    covers: ['ox/Hex:random', 'ox/Bytes:random'],
    runs: 60,
    arb: fc.integer({ min: 0, max: 64 }),
    check(length) {
      same(
        'ox/Hex:random',
        hexBytes(call('ox/Hex:random', length)).length,
        length,
        'Hex.random size',
      )
      same(
        'ox/Bytes:random',
        call('ox/Bytes:random', length).length,
        length,
        'Bytes.random size',
      )
    },
  })

  // Base32, Base58, Base64, Bech32m.
  {
    const ascii = fc.string({ maxLength: 40 })
    add({
      id: 'round trip: Base64 (differential with Buffer)',
      oracle: 'round trip',
      covers: [
        'ox/Base64:fromBytes',
        'ox/Base64:fromHex',
        'ox/Base64:fromString',
        'ox/Base64:toBytes',
        'ox/Base64:toHex',
        'ox/Base64:toString',
      ],
      runs: 300,
      arb: fc.record({
        bytes: bytesOf(0, 60),
        value: text,
        pad: optional(fc.boolean()),
        url: optional(fc.boolean()),
      }),
      check({ bytes, value, pad, url }) {
        const options = { pad, url }
        const encoded = call('ox/Base64:fromBytes', bytes, options)
        let expected = Buffer.from(bytes).toString(url ? 'base64url' : 'base64')
        if (url) expected = expected.replace(/=+$/, '')
        if (pad !== false && expected.length % 4)
          expected += '='.repeat(4 - (expected.length % 4))
        if (pad === false) expected = expected.replace(/=+$/, '')
        vote(
          'ox/Base64:fromBytes',
          encoded,
          { Buffer: expected },
          'Base64.fromBytes',
        )
        same(
          'ox/Base64:fromHex',
          call('ox/Base64:fromHex', toHex(bytes), options),
          encoded,
          'Base64.fromHex agrees with fromBytes',
        )
        same(
          'ox/Base64:toBytes',
          call('ox/Base64:toBytes', encoded),
          bytes,
          'Base64.toBytes(Base64.fromBytes(b))',
        )
        same(
          'ox/Base64:toHex',
          call('ox/Base64:toHex', encoded),
          toHex(bytes),
          'Base64.toHex(Base64.fromBytes(b))',
        )
        const wellFormed =
          new TextDecoder().decode(new TextEncoder().encode(value)) === value
        const fromString = call('ox/Base64:fromString', value, options)
        if (wellFormed)
          same(
            'ox/Base64:toString',
            call('ox/Base64:toString', fromString),
            value,
            'Base64.toString(Base64.fromString(s))',
          )
      },
    })
    add({
      id: 'differential: Base64 decoding of arbitrary strings against Buffer',
      oracle: 'differential',
      covers: ['ox/Base64:toBytes'],
      runs: 300,
      arb: fc.string({
        unit: fc.constantFrom(
          ...'ABCDEFabcdef0123456789+/-_=',
          ' ',
          '\n',
          '.',
          'é',
        ),
        maxLength: 24,
      }),
      check(value) {
        const result = tolerant('ox/Base64:toBytes', value)
        if (!result) return
        // Buffer skips characters outside the alphabet; only judge strings in the alphabet.
        if (!/^[A-Za-z0-9+/\-_]*=*$/.test(value)) return
        const body = value.replace(/=+$/, '')
        if (body.length % 4 === 1) return // Not a whole byte; any answer is lenient.
        same(
          'ox/Base64:toBytes',
          result.value,
          new Uint8Array(Buffer.from(body, 'base64')),
          `Base64.toBytes(${JSON.stringify(value)})`,
        )
      },
    })
    add({
      id: 'round trip: Base58 (differential with @scure/base and ethers)',
      oracle: 'round trip',
      covers: [
        'ox/Base58:fromBytes',
        'ox/Base58:fromHex',
        'ox/Base58:fromString',
        'ox/Base58:toBytes',
        'ox/Base58:toHex',
        'ox/Base58:toString',
      ],
      runs: 300,
      arb: fc.record({
        bytes: fc.oneof(
          bytesOf(0, 40),
          fc
            .tuple(fc.nat(4), bytesOf(0, 8))
            .map(
              ([zeros, rest]) =>
                new Uint8Array([...new Uint8Array(zeros), ...rest]),
            ),
        ),
        value: ascii,
      }),
      check({ bytes, value }) {
        const encoded = call('ox/Base58:fromBytes', bytes)
        vote(
          'ox/Base58:fromBytes',
          encoded,
          {
            scure: scure.base58.encode(bytes),
            ...(bytes.length && bytes[0] !== 0
              ? { ethers: attempt(() => ethers.encodeBase58(bytes)) }
              : {}),
          },
          'Base58.fromBytes',
        )
        same(
          'ox/Base58:fromHex',
          call('ox/Base58:fromHex', toHex(bytes)),
          encoded,
          'Base58.fromHex agrees with fromBytes',
        )
        same(
          'ox/Base58:toBytes',
          call('ox/Base58:toBytes', encoded),
          bytes,
          'Base58.toBytes(Base58.fromBytes(b))',
        )
        same(
          'ox/Base58:toHex',
          call('ox/Base58:toHex', encoded),
          toHex(bytes),
          'Base58.toHex(Base58.fromBytes(b))',
        )
        const fromString = call('ox/Base58:fromString', value)
        same(
          'ox/Base58:fromString',
          fromString,
          scure.base58.encode(new TextEncoder().encode(value)),
          'Base58.fromString',
        )
        if (new TextDecoder().decode(new TextEncoder().encode(value)) === value)
          same(
            'ox/Base58:toString',
            call('ox/Base58:toString', fromString),
            value,
            'Base58.toString(Base58.fromString(s))',
          )
      },
    })
    add({
      id: 'differential: Base58 decoding of arbitrary strings against @scure/base',
      oracle: 'differential',
      covers: ['ox/Base58:toBytes', 'ox/Base58:toHex'],
      runs: 300,
      arb: fc.string({
        unit: fc.constantFrom(...'123456789ABCabcxyzZ0OIl+ '),
        maxLength: 20,
      }),
      check(value) {
        const expected = attempt(() => scure.base58.decode(value))
        const actual = tolerant('ox/Base58:toBytes', value)
        if (!actual) return
        if (expected === undefined)
          throw new Failure(
            `Base58.toBytes accepted ${JSON.stringify(value)} (not Base58; @scure/base rejects it) and returned ${show(actual.value)}`,
            { blame: ['ox/Base58:toBytes'], kind: 'accepted invalid input' },
          )
        same(
          'ox/Base58:toBytes',
          actual.value,
          expected,
          `Base58.toBytes(${JSON.stringify(value)})`,
        )
      },
    })
    add({
      id: 'round trip: Base32 (differential with @scure/base bech32 words)',
      oracle: 'round trip',
      covers: [
        'ox/Base32:fromBytes',
        'ox/Base32:fromHex',
        'ox/Base32:toBytes',
        'ox/Base32:toHex',
      ],
      runs: 300,
      arb: bytesOf(0, 50),
      check(bytes) {
        const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
        const encoded = call('ox/Base32:fromBytes', bytes)
        vote(
          'ox/Base32:fromBytes',
          encoded,
          {
            scure: scure.bech32
              .toWords(bytes)
              .map((word: number) => alphabet[word])
              .join(''),
          },
          'Base32.fromBytes',
        )
        same(
          'ox/Base32:fromHex',
          call('ox/Base32:fromHex', toHex(bytes)),
          encoded,
          'Base32.fromHex agrees with fromBytes',
        )
        same(
          'ox/Base32:toBytes',
          call('ox/Base32:toBytes', encoded),
          bytes,
          'Base32.toBytes(Base32.fromBytes(b))',
        )
        same(
          'ox/Base32:toHex',
          call('ox/Base32:toHex', encoded),
          toHex(bytes),
          'Base32.toHex(Base32.fromBytes(b))',
        )
      },
    })
    add({
      id: 'differential: Base32 decoding of arbitrary strings',
      oracle: 'differential',
      covers: ['ox/Base32:toBytes'],
      runs: 300,
      arb: fc.string({
        unit: fc.constantFrom(...'qpzry9x8gf2tvdw0s3jn54khce6mua7lQPb1io '),
        maxLength: 20,
      }),
      check(value) {
        const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
        const actual = tolerant('ox/Base32:toBytes', value)
        if (!actual) return
        if (![...value].every((char) => alphabet.includes(char)))
          throw new Failure(
            `Base32.toBytes accepted ${JSON.stringify(value)}, which has characters outside the bech32 alphabet, and returned ${show(actual.value)}`,
            { blame: ['ox/Base32:toBytes'], kind: 'accepted invalid input' },
          )
        const words = [...value].map((char) => alphabet.indexOf(char))
        const expected = attempt(() => scure.bech32.fromWordsUnsafe(words))
        if (expected)
          same('ox/Base32:toBytes', actual.value, expected, 'Base32.toBytes')
      },
    })
    const hrp = fc.stringMatching(/^[a-z0-9!-@[-`{-~]{1,10}$/)
    add({
      id: 'round trip: Bech32m (differential with @scure/base)',
      oracle: 'round trip',
      covers: ['ox/Bech32m:encode', 'ox/Bech32m:decode'],
      runs: 300,
      arb: fc.record({ hrp, data: bytesOf(0, 40) }),
      check({ hrp, data }) {
        const encoded = call('ox/Bech32m:encode', hrp, data)
        vote(
          'ox/Bech32m:encode',
          encoded,
          {
            scure: attempt(() =>
              scure.bech32m.encode(hrp, scure.bech32m.toWords(data), 90),
            ),
          },
          'Bech32m.encode',
        )
        const decoded = call('ox/Bech32m:decode', encoded)
        same(
          'ox/Bech32m:decode',
          decoded,
          { hrp, data },
          'Bech32m.decode(Bech32m.encode(hrp, data))',
        )
        same(
          'ox/Bech32m:decode',
          call('ox/Bech32m:decode', encoded.toUpperCase()),
          { hrp, data },
          'Bech32m.decode of the uppercase encoding',
        )
      },
    })
    add({
      id: 'differential: Bech32m decoding of mutated strings against @scure/base',
      oracle: 'differential',
      covers: ['ox/Bech32m:decode'],
      runs: 400,
      arb: fc
        .tuple(
          hrp,
          bytesOf(0, 20),
          fc.nat(),
          fc.integer({ min: 0, max: 4 }),
          fc.constantFrom(...'qpzry9x8gf2tvdw0s3jn54khce6mua7l1bBQ'),
        )
        .map(([hrp, data, at, how, char]) => {
          const words = scure.bech32m.toWords(data)
          const chars = [...scure.bech32m.encode(hrp, words, 1000)]
          const index = at % chars.length
          if (how === 0) chars.splice(index, 1)
          else if (how === 1) chars[index] = char
          else if (how === 2) chars.splice(index, 0, char)
          else if (how === 3) chars[index] = chars[index]!.toUpperCase()
          else chars.length = index
          return chars.join('')
        }),
      check(value) {
        const expected = attempt(() => {
          const { prefix, words } = scure.bech32m.decode(value, 1000)
          return { hrp: prefix, data: scure.bech32m.fromWords(words) }
        })
        const actual = tolerant('ox/Bech32m:decode', value, { limit: 1000 })
        if (!actual) return
        if (expected === undefined)
          throw new Failure(
            `Bech32m.decode accepted ${JSON.stringify(value)} (@scure/base rejects it) and returned ${show(actual.value)}`,
            { blame: ['ox/Bech32m:decode'], kind: 'accepted invalid input' },
          )
        same(
          'ox/Bech32m:decode',
          actual.value,
          expected,
          `Bech32m.decode(${value})`,
        )
      },
    })
  }

  // CBOR, CompactSize, RLP, JSON.
  {
    type Cbor = unknown
    const cborValue: Arbitrary<Cbor> = fc.letrec<{ value: Cbor }>((tie) => ({
      value: fc.oneof(
        { depthSize: 'small' },
        fc.oneof(
          // Safe integers past 32 bits throw the documented Cbor.NumberTooLargeError on purpose
          // (src/core/Cbor.ts), so they are left out here.
          fc.integer(),
          fc.constantFrom(
            0,
            23,
            24,
            255,
            256,
            65535,
            65536,
            2 ** 32 - 1,
            2 ** 53,
            -1,
            -24,
            -25,
            -(2 ** 32),
            -(2 ** 53),
          ),
          fc
            .double({ noNaN: true })
            .filter(
              (value) =>
                !Number.isSafeInteger(value) || Math.abs(value) <= 2 ** 32 - 1,
            ),
          text,
          fc.boolean(),
          fc.constant(null),
          bytesOf(0, 30),
        ),
        fc.array(tie('value'), { maxLength: 4 }),
        fc.dictionary(fc.string({ maxLength: 8 }), tie('value'), {
          maxKeys: 4,
        }),
      ),
    })).value
    add({
      id: 'round trip: CBOR',
      oracle: 'round trip',
      covers: ['ox/Cbor:encode', 'ox/Cbor:decode'],
      runs: 300,
      arb: cborValue,
      check(value) {
        const wellFormed = (item: unknown): boolean =>
          typeof item === 'string'
            ? new TextDecoder().decode(new TextEncoder().encode(item)) === item
            : Array.isArray(item)
              ? item.every(wellFormed)
              : item &&
                  typeof item === 'object' &&
                  !(item instanceof Uint8Array)
                ? Object.entries(item).every(
                    ([key, entry]) => wellFormed(key) && wellFormed(entry),
                  )
                : true
        const encoded = call('ox/Cbor:encode', value)
        const asBytes = call('ox/Cbor:encode', value, { as: 'Bytes' })
        same(
          'ox/Cbor:encode',
          toHex(asBytes),
          encoded,
          'Cbor.encode as Bytes agrees with Hex',
        )
        if (!wellFormed(value)) return
        same(
          'ox/Cbor:decode',
          normalizeZero(call('ox/Cbor:decode', encoded)),
          normalizeZero(value),
          'Cbor.decode(Cbor.encode(x))',
        )
        same(
          'ox/Cbor:decode',
          normalizeZero(call('ox/Cbor:decode', asBytes)),
          normalizeZero(value),
          'Cbor.decode(bytes)',
        )
      },
    })
    add({
      id: 'crash: CBOR decoding of mutated data',
      oracle: 'crash',
      covers: ['ox/Cbor:decode'],
      runs: 400,
      arb: fc
        .tuple(
          cborValue,
          fc.nat(),
          fc.integer({ min: 0, max: 4 }),
          bytesOf(1, 9),
        )
        .map(([value, at, how, junk]) => {
          let bytes: number[]
          try {
            bytes = [
              ...(fn('ox/Cbor:encode')(value, { as: 'Bytes' }) as Uint8Array),
            ]
          } catch {
            bytes = [0xa0]
          }
          const index = bytes.length ? at % bytes.length : 0
          if (how === 0) bytes.length = index
          else if (how === 1) bytes[index] = junk[0]!
          else if (how === 2) bytes.splice(index, 0, ...junk)
          else if (how === 3) bytes.splice(index, junk.length)
          else bytes = [...junk]
          return toHex(Uint8Array.from(bytes))
        }),
      check(hex) {
        tolerant('ox/Cbor:decode', hex)
      },
    })
    add({
      id: 'round trip: CompactSize (against the Bitcoin reference encoding)',
      oracle: 'round trip',
      covers: [
        'ox/CompactSize:toBytes',
        'ox/CompactSize:toHex',
        'ox/CompactSize:fromBytes',
        'ox/CompactSize:fromHex',
      ],
      runs: 300,
      arb: fc.record({
        value: fc.oneof(
          uint(64),
          fc.constantFrom(
            0n,
            0xfcn,
            0xfdn,
            0xffffn,
            0x10000n,
            0xffffffffn,
            0x100000000n,
            2n ** 64n - 1n,
          ),
        ),
        number: fc.boolean(),
        trailing: bytesOf(0, 3),
      }),
      check({ value, number, trailing }) {
        const reference =
          value < 0xfdn
            ? [Number(value)]
            : value <= 0xffffn
              ? [0xfd, ...le(value, 2)]
              : value <= 0xffffffffn
                ? [0xfe, ...le(value, 4)]
                : [0xff, ...le(value, 8)]
        const input =
          number && value <= BigInt(Number.MAX_SAFE_INTEGER)
            ? Number(value)
            : value
        const bytes = call('ox/CompactSize:toBytes', input)
        same(
          'ox/CompactSize:toBytes',
          bytes,
          Uint8Array.from(reference),
          `CompactSize.toBytes(${value})`,
        )
        same(
          'ox/CompactSize:toHex',
          call('ox/CompactSize:toHex', input),
          toHex(bytes),
          'CompactSize.toHex agrees with toBytes',
        )
        const data = new Uint8Array([...bytes, ...trailing])
        const decoded = call('ox/CompactSize:fromBytes', data)
        same(
          'ox/CompactSize:fromBytes',
          { value: BigInt(decoded.value), size: decoded.size },
          { value, size: bytes.length },
          'CompactSize.fromBytes(CompactSize.toBytes(x))',
        )
        const fromHex = call('ox/CompactSize:fromHex', toHex(data))
        same(
          'ox/CompactSize:fromHex',
          { value: BigInt(fromHex.value), size: fromHex.size },
          { value, size: bytes.length },
          'CompactSize.fromHex',
        )
      },
    })
    add({
      id: 'consistency: CompactSize rejects negative and oversized values',
      oracle: 'consistency',
      covers: ['ox/CompactSize:toBytes', 'ox/CompactSize:toHex'],
      runs: 60,
      arb: fc.oneof(
        fc.bigInt({ min: -(2n ** 70n), max: -1n }),
        fc.bigInt({ min: 2n ** 64n, max: 2n ** 80n }),
        fc.integer({ min: -(2 ** 40), max: -1 }),
      ),
      check(value) {
        rejects('ox/CompactSize:toBytes', `${value}, outside uint64`, value)
        rejects('ox/CompactSize:toHex', `${value}, outside uint64`, value)
      },
    })

    type Rlp = string | Rlp[]
    const rlpArb: Arbitrary<Rlp> = fc.letrec<{ item: Rlp }>((tie) => ({
      item: fc.oneof(
        { depthSize: 'small' },
        fc.oneof(hexOf(0, 2), hexOf(0, 60), hexOf(54, 58)),
        fc.array(tie('item'), { maxLength: 4 }),
      ),
    })).item
    const deep = fc.integer({ min: 1, max: 40 }).map((depth) => {
      let value: Rlp = '0x01'
      for (let i = 0; i < depth; i++) value = [value]
      return value
    })
    add({
      id: 'round trip: RLP (differential with viem, ethers, @ethereumjs/rlp, micro-eth-signer)',
      oracle: 'round trip',
      covers: [
        'ox/Rlp:fromHex',
        'ox/Rlp:fromBytes',
        'ox/Rlp:from',
        'ox/Rlp:toHex',
        'ox/Rlp:toBytes',
        'ox/Rlp:to',
      ],
      runs: 300,
      arb: fc.oneof(
        { weight: 9, arbitrary: rlpArb },
        { weight: 1, arbitrary: deep },
      ),
      check(value) {
        const encoded = call('ox/Rlp:fromHex', value)
        const asBytes = mapRlp(value, hexBytes)
        vote(
          'ox/Rlp:fromHex',
          encoded,
          {
            viem: attempt(() => viem.toRlp(value)),
            ethers: attempt(() => ethers.encodeRlp(value)),
            ethereumjs: attempt(() =>
              toHex(lib.ethereumjsRlp.RLP.encode(asBytes)),
            ),
          },
          'RLP encoding',
        )
        same(
          'ox/Rlp:fromBytes',
          call('ox/Rlp:fromBytes', asBytes, { as: 'Hex' }),
          encoded,
          'Rlp.fromBytes agrees with Rlp.fromHex',
        )
        same(
          'ox/Rlp:fromBytes',
          call('ox/Rlp:fromBytes', asBytes),
          hexBytes(encoded),
          'Rlp.fromBytes returns bytes by default',
        )
        same(
          'ox/Rlp:from',
          call('ox/Rlp:from', value, { as: 'Hex' }),
          encoded,
          'Rlp.from agrees with Rlp.fromHex',
        )
        same(
          'ox/Rlp:toHex',
          call('ox/Rlp:toHex', encoded),
          value,
          'Rlp.toHex(Rlp.fromHex(x))',
        )
        same(
          'ox/Rlp:toBytes',
          call('ox/Rlp:toBytes', hexBytes(encoded)),
          asBytes,
          'Rlp.toBytes(Rlp.fromBytes(x))',
        )
        same(
          'ox/Rlp:to',
          call('ox/Rlp:to', encoded, 'Hex'),
          value,
          'Rlp.to(…, Hex)',
        )
        const micro = attempt(() => lib.micro.RLP.decode(hexBytes(encoded)))
        if (micro !== undefined)
          same(
            'ox/Rlp:toBytes',
            call('ox/Rlp:toBytes', encoded),
            micro,
            'Rlp.toBytes agrees with micro-eth-signer',
          )
      },
    })
    add({
      id: 'differential: RLP decoding of malformed input (against ethers and @ethereumjs/rlp)',
      oracle: 'differential',
      covers: ['ox/Rlp:toHex', 'ox/Rlp:toBytes'],
      runs: 400,
      arb: fc
        .tuple(
          rlpArb,
          fc.nat(),
          fc.integer({ min: 0, max: 7 }),
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
          else if (how === 5) out.unshift(0x81, junk[0]! & 0x7f)
          else if (how === 6) out.unshift(0xb8, junk[0]! & 0x37)
          else out.unshift(0xf9, 0x00, junk[0]!)
          return toHex(Uint8Array.from(out))
        }),
      check(hex) {
        // ox decodes empty input to `0x` on purpose (Rlp.test.ts), as viem does.
        if (hex === '0x') return
        const ethersValue = attempt(() => ethers.decodeRlp(hex))
        const ethereumjs = attempt(() =>
          mapRlp(lib.ethereumjsRlp.RLP.decode(hexBytes(hex)), toHex),
        )
        const actual = tolerant('ox/Rlp:toHex', hex)
        tolerant('ox/Rlp:toBytes', hexBytes(hex))
        if (!actual) return // Rejecting malformed RLP is right whatever the references do.
        if (ethersValue === undefined && ethereumjs === undefined)
          throw new Failure(
            `Rlp.toHex accepted malformed RLP ${hex} (ethers and @ethereumjs/rlp reject it) and returned ${show(actual.value)}`,
            { blame: ['ox/Rlp:toHex'], kind: 'accepted invalid input' },
          )
        vote(
          'ox/Rlp:toHex',
          actual.value,
          { ethers: ethersValue, ethereumjs },
          `Rlp.toHex(${hex})`,
        )
      },
    })
    add({
      id: 'differential: RLP encoding of malformed hex leaves (against ethers)',
      oracle: 'differential',
      covers: ['ox/Rlp:fromHex', 'ox/Rlp:from'],
      runs: 200,
      arb: fc
        .tuple(
          rlpArb,
          // Leaves without `0x`, with an uppercase `0X`, or with a character
          // that is not hex. (ox reads an odd number of digits on purpose.)
          fc.constantFrom('zz', 'abcd', '0', '', 'x0', '0X01', '0xzz', '0x1g'),
          fc.boolean(),
        )
        .map(
          ([value, leaf, first]): Rlp =>
            first ? [leaf, value] : [value, [leaf]],
        ),
      check(value) {
        if (attempt(() => ethers.encodeRlp(value)) !== undefined) return
        rejects(
          'ox/Rlp:fromHex',
          `a malformed hex leaf in ${show(value)}`,
          value,
        )
        rejects(
          'ox/Rlp:from',
          `a malformed hex leaf in ${show(value)}`,
          value,
          { as: 'Hex' },
        )
      },
    })
    add({
      id: 'round trip: RLP through a cursor',
      oracle: 'round trip',
      covers: [
        'ox/Rlp:decodeRlpCursor',
        'ox/Rlp:readList',
        'ox/Rlp:readLength',
      ],
      runs: 200,
      arb: rlpArb,
      check(value) {
        const bytes = hexBytes(ethers.encodeRlp(value))
        const cursor = makeCursor(bytes)
        same(
          'ox/Rlp:decodeRlpCursor',
          call('ox/Rlp:decodeRlpCursor', cursor, 'Hex'),
          value,
          'Rlp.decodeRlpCursor',
        )
        if (Array.isArray(value)) {
          const listCursor = makeCursor(bytes)
          const prefix = bytes[listCursor.position++]!
          const length = call('ox/Rlp:readLength', listCursor, prefix, 0xc0)
          same(
            'ox/Rlp:readList',
            call('ox/Rlp:readList', listCursor, length, 'Hex'),
            value,
            'Rlp.readList',
          )
        }
      },
    })

    const jsonValue: Arbitrary<unknown> = fc.letrec<{ value: unknown }>(
      (tie) => ({
        value: fc.oneof(
          { depthSize: 'small' },
          fc.oneof(
            fc.integer(),
            fc.bigInt({ min: -(2n ** 200n), max: 2n ** 200n }),
            fc.double({ noNaN: true, noDefaultInfinity: true }),
            text,
            fc.boolean(),
            fc.constant(null),
          ),
          fc.array(tie('value'), { maxLength: 4 }),
          fc.dictionary(fc.string({ maxLength: 8 }), tie('value'), {
            maxKeys: 4,
          }),
        ),
      }),
    ).value
    add({
      id: 'round trip: Json.stringify ↔ Json.parse with bigints',
      oracle: 'round trip',
      covers: ['ox/Json:stringify', 'ox/Json:parse'],
      runs: 300,
      arb: fc.record({ value: jsonValue, space: optional(fc.nat(4)) }),
      check({ value, space }) {
        const text = call('ox/Json:stringify', value, null, space)
        const parsed = call('ox/Json:parse', text)
        same(
          'ox/Json:parse',
          normalizeZero(parsed),
          normalizeZero(value),
          'Json.parse(Json.stringify(x))',
        )
        if (!containsBigint(value))
          same(
            'ox/Json:stringify',
            text,
            JSON.stringify(value, null, space),
            'Json.stringify agrees with JSON.stringify without bigints',
          )
      },
    })
    add({
      id: 'differential: Json.canonicalize against an RFC 8785 reference',
      oracle: 'differential',
      covers: ['ox/Json:canonicalize'],
      runs: 300,
      arb: fc.letrec<{ value: unknown }>((tie) => ({
        value: fc.oneof(
          { depthSize: 'small' },
          fc.oneof(
            fc.integer(),
            fc.double({ noNaN: true, noDefaultInfinity: true }),
            fc.string({ unit: 'grapheme', maxLength: 10 }),
            fc.boolean(),
            fc.constant(null),
          ),
          fc.array(tie('value'), { maxLength: 4 }),
          fc.dictionary(
            fc.string({ unit: 'grapheme', maxLength: 6 }),
            tie('value'),
            {
              maxKeys: 4,
            },
          ),
        ),
      })).value,
      check(value) {
        const canonical = call('ox/Json:canonicalize', value)
        same('ox/Json:canonicalize', canonical, jcs(value), 'Json.canonicalize')
        same(
          'ox/Json:canonicalize',
          normalizeZero(JSON.parse(canonical)),
          normalizeZero(value),
          'JSON.parse(Json.canonicalize(x))',
        )
      },
    })
    add({
      id: 'consistency: Json.canonicalize writes valid JSON for what JSON.stringify accepts',
      oracle: 'consistency',
      covers: ['ox/Json:canonicalize'],
      runs: 60,
      arb: fc.oneof(
        fc
          .array(fc.oneof(fc.integer(), fc.constant(undefined)), {
            minLength: 1,
            maxLength: 4,
          })
          .filter((items) => items.includes(undefined)),
        fc.record({ a: fc.constant(undefined), b: fc.integer() }),
        fc.constant({ toJSON: () => 1 }),
      ),
      check(value) {
        const canonical = call('ox/Json:canonicalize', value)
        const parsed = attempt(() => JSON.parse(canonical))
        if (parsed === undefined && canonical !== 'null')
          throw new Failure(
            `Json.canonicalize(${show(value)}) returned ${JSON.stringify(canonical)}, which is not JSON (JSON.stringify gives ${JSON.stringify(value)})`,
            { blame: ['ox/Json:canonicalize'], kind: 'invalid output' },
          )
      },
    })
  }

  // Hashes.
  add({
    id: 'differential: keccak256, sha256, ripemd160, hmac256 against noble and ethers',
    oracle: 'differential',
    covers: [
      'ox/Hash:keccak256',
      'ox/Hash:sha256',
      'ox/Hash:ripemd160',
      'ox/Hash:hmac256',
    ],
    runs: 200,
    arb: fc.record({
      data: bytesOf(0, 200),
      key: bytesOf(0, 80),
      hex: fc.boolean(),
      as: fc.constantFrom(undefined, 'Hex', 'Bytes'),
    }),
    check({ data, key, hex, as }) {
      const input = hex ? toHex(data) : data
      const view = (value: unknown) =>
        value instanceof Uint8Array ? toHex(value) : value
      const shape = (value: unknown, name: string) => {
        const expected = as ?? (hex ? 'Hex' : 'Bytes')
        if ((expected === 'Hex') !== (typeof value === 'string'))
          throw new Failure(
            `${short(name)} returned ${show(value)}, expected ${expected}`,
            { blame: [name] },
          )
      }
      for (const [name, reference, second] of [
        [
          'ox/Hash:keccak256',
          noble.sha3.keccak_256(data),
          ethers.keccak256(data),
        ],
        ['ox/Hash:sha256', noble.sha2.sha256(data), ethers.sha256(data)],
        [
          'ox/Hash:ripemd160',
          noble.legacy.ripemd160(data),
          ethers.ripemd160(data),
        ],
      ] as const) {
        const value = call(name, input, { as })
        shape(value, name)
        vote(
          name,
          view(value),
          { noble: toHex(reference), ethers: second },
          short(name),
        )
      }
      const mac = call('ox/Hash:hmac256', hex ? toHex(key) : key, input, {
        as,
      })
      shape(mac, 'ox/Hash:hmac256')
      vote(
        'ox/Hash:hmac256',
        view(mac),
        {
          noble: toHex(noble.hmac(noble.sha2.sha256, key, data)),
          ethers: ethers.computeHmac('sha256', key, data),
        },
        'Hash.hmac256',
      )
    },
  })
  add({
    id: 'consistency: Hash.validate accepts exactly 32-byte hex',
    oracle: 'consistency',
    covers: ['ox/Hash:validate'],
    runs: 200,
    arb: fc.oneof(
      hexOf(0, 40),
      hash,
      hash.map((value) => value.toUpperCase().replace('0X', '0x')),
      fc.string({ maxLength: 70 }),
    ),
    check(value) {
      same(
        'ox/Hash:validate',
        call('ox/Hash:validate', value),
        /^0x[0-9a-fA-F]{64}$/.test(value),
        `Hash.validate(${value})`,
      )
    },
  })

  // ABI: parameters, functions, errors, events, constructors, packed encoding, signatures.
  {
    /** A random ABI parameter type, with its value arbitrary. */
    type Param = {
      type: string
      name?: string
      components?: Param[]
      indexed?: boolean
    }
    const elementary = fc.oneof(
      fc.integer({ min: 1, max: 32 }).map((n) => `uint${n * 8}`),
      fc.integer({ min: 1, max: 32 }).map((n) => `int${n * 8}`),
      fc.constantFrom(
        'address',
        'bool',
        'bytes',
        'string',
        'uint256',
        'bytes32',
      ),
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
      if (sized?.[1] === 'uint')
        return fc.oneof(
          uint(Number(sized[2])),
          fc.constantFrom(0n, 2n ** BigInt(sized[2]) - 1n),
        )
      if (sized?.[1] === 'int')
        return fc.oneof(
          int(Number(sized[2])),
          fc.constantFrom(-(2n ** BigInt(Number(sized[2]) - 1)), -1n),
        )
      if (sized?.[1] === 'bytes')
        return hexOf(Number(sized[2]), Number(sized[2]))
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
    const identifier = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,12}$/)
    /** A value in the shape decoders return: tuples as objects, hex lowercase, ints as bigints. */
    const canonical = (value: unknown): unknown => {
      if (typeof value === 'string' && /^0x/.test(value))
        return value.toLowerCase()
      // ox decodes (u)int8 to (u)int48 as numbers, by design (abitype's types say so).
      if (typeof value === 'number' && Number.isSafeInteger(value))
        return BigInt(value)
      if (Array.isArray(value)) return value.map(canonical)
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, canonical(item)]),
        )
      return value
    }
    /** An ethers `Result` as plain arrays, keyed like `canonical` for tuples. */
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
    const toEthers = (param: Param, value: Any): unknown => {
      const array = param.type.match(/^(.*)\[(\d*)\]$/)
      if (array)
        return value.map((item: unknown) =>
          toEthers({ ...param, type: array[1]! }, item),
        )
      if (param.type === 'tuple')
        return param.components!.map((component) =>
          toEthers(component, value[component.name!]),
        )
      return value
    }
    const ethersEncode = (params: Param[], values: unknown[]) =>
      ethers.AbiCoder.defaultAbiCoder().encode(
        params,
        params.map((param, i) => toEthers(param, values[i])),
      )

    add({
      id: 'round trip: ABI parameters (differential with viem and ethers)',
      oracle: 'round trip',
      covers: ['ox/AbiParameters:encode', 'ox/AbiParameters:decode'],
      runs: 250,
      arb: paramsWithValues,
      check([params, values]) {
        const encoded = call('ox/AbiParameters:encode', params, values)
        vote(
          'ox/AbiParameters:encode',
          encoded,
          {
            viem: attempt(() => viem.encodeAbiParameters(params, values)),
            ethers: attempt(() => ethersEncode(params, values)),
          },
          'ABI encoding',
        )
        const decoded = call('ox/AbiParameters:decode', params, encoded)
        same(
          'ox/AbiParameters:decode',
          canonical(decoded),
          canonical(values),
          'AbiParameters.decode(AbiParameters.encode(x))',
        )
        same(
          'ox/AbiParameters:decode',
          canonical(call('ox/AbiParameters:decode', params, hexBytes(encoded))),
          canonical(values),
          'AbiParameters.decode(bytes)',
        )
      },
    })
    add({
      id: 'consistency: decoded integers fit their ABI type',
      oracle: 'consistency',
      covers: ['ox/AbiParameters:decode'],
      runs: 200,
      arb: fc.record({
        bits: fc.integer({ min: 1, max: 31 }).map((n) => n * 8),
        signed: fc.boolean(),
        word: fc.oneof(
          uint(256),
          fc.constantFrom(
            2n ** 256n - 1n,
            2n ** 255n,
            255n,
            2n ** 64n,
            2n ** 128n + 1n,
          ),
        ),
      }),
      check({ bits, signed, word }) {
        // A word outside the type's range is not a valid encoding: solc's decoder reverts on it.
        const type = `${signed ? 'int' : 'uint'}${bits}`
        const data = toHex32(word)
        const result = tolerant('ox/AbiParameters:decode', [{ type }], data)
        if (!result) return
        const value = BigInt(result.value[0] as bigint)
        const min = signed ? -(2n ** BigInt(bits - 1)) : 0n
        const max = signed
          ? 2n ** BigInt(bits - 1) - 1n
          : 2n ** BigInt(bits) - 1n
        if (value < min || value > max)
          throw new Failure(
            `AbiParameters.decode([{type: '${type}'}], ${data}) returned ${value}, outside ${type} (${min} to ${max})`,
            { blame: ['ox/AbiParameters:decode'], kind: 'wrong output' },
          )
      },
    })
    add({
      id: 'differential: ABI decoding of malformed data (against viem and ethers)',
      oracle: 'differential',
      covers: ['ox/AbiParameters:decode'],
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
          const bytes = [...hexBytes(ethersEncode(params, values))]
          const index = bytes.length ? at % bytes.length : 0
          if (how === 0) bytes.length = index
          else if (how === 1) bytes[index] = junk[0]!
          else if (how === 2) bytes.splice(index, 0, ...junk)
          else bytes.splice(index, junk.length)
          return { params, data: toHex(Uint8Array.from(bytes)) }
        }),
      check({ params, data }) {
        const actual = tolerant('ox/AbiParameters:decode', params, data)
        if (!actual) return
        // ethers' Result throws on access when a value failed to decode, so read it all here.
        const fromEthersResult = attempt(() => {
          const result = ethers.AbiCoder.defaultAbiCoder().decode(params, data)
          return params.map((param: Param, i: number) =>
            fromEthers(param, result[i]),
          )
        })
        const fromViem = attempt(() =>
          canonical(viem.decodeAbiParameters(params, data)),
        )
        if (fromEthersResult === undefined && fromViem === undefined) return // Stricter is fine.
        vote(
          'ox/AbiParameters:decode',
          canonical(actual.value),
          { ethers: fromEthersResult, viem: fromViem },
          'AbiParameters.decode of mutated data',
        )
      },
    })
    add({
      id: 'round trip: AbiParameters.format ↔ AbiParameters.from',
      oracle: 'round trip',
      covers: ['ox/AbiParameters:format', 'ox/AbiParameters:from'],
      runs: 200,
      arb: fc
        .array(fc.tuple(paramArb, optional(identifier)), {
          minLength: 1,
          maxLength: 4,
        })
        .map((items) =>
          items.map(([param, name]) => (name ? { ...param, name } : param)),
        ),
      check(params) {
        const formatted = call('ox/AbiParameters:format', params)
        const parsed = call('ox/AbiParameters:from', formatted)
        same(
          'ox/AbiParameters:from',
          stripAbi(parsed),
          stripAbi(params),
          `AbiParameters.from(${JSON.stringify(formatted)})`,
        )
        same(
          'ox/AbiParameters:from',
          stripAbi(call('ox/AbiParameters:from', params)),
          stripAbi(params),
          'AbiParameters.from(parameters)',
        )
      },
    })
    {
      const packedType = fc.oneof(
        elementary,
        elementary
          .filter((type) => type !== 'string' && type !== 'bytes')
          .chain((type) =>
            fc
              .option(fc.integer({ min: 1, max: 3 }))
              .map((length) => `${type}[${length ?? ''}]`),
          ),
      )
      add({
        id: 'differential: AbiParameters.encodePacked against viem and ethers',
        oracle: 'differential',
        covers: ['ox/AbiParameters:encodePacked'],
        runs: 300,
        arb: fc
          .array(packedType, { maxLength: 4 })
          .chain((types) =>
            fc.tuple(
              fc.constant(types),
              fc.tuple(...types.map((type) => arbitraryOf({ type }))),
            ),
          ),
        check([types, values]) {
          const packed = call('ox/AbiParameters:encodePacked', types, values)
          vote(
            'ox/AbiParameters:encodePacked',
            packed,
            {
              viem: attempt(() => viem.encodePacked(types, values)),
              ethers: attempt(() => ethers.solidityPacked(types, values)),
            },
            'encodePacked',
          )
        },
      })
    }

    /** A random function, with arguments and a result for it. */
    const fnAbi = fc
      .record({
        name: identifier,
        inputs: paramsWithValues,
        outputs: paramsWithValues,
        stateMutability: fc.constantFrom(
          'view',
          'pure',
          'nonpayable',
          'payable',
        ),
      })
      .map(({ name, inputs, outputs, stateMutability }) => ({
        item: {
          type: 'function',
          name,
          stateMutability,
          inputs: inputs[0],
          outputs: outputs[0],
        } as Any,
        args: inputs[1],
        result: outputs[1],
      }))
    add({
      id: 'round trip: function data and results (differential with viem and ethers)',
      oracle: 'round trip',
      covers: [
        'ox/AbiFunction:encodeData',
        'ox/AbiFunction:decodeData',
        'ox/AbiFunction:encodeResult',
        'ox/AbiFunction:decodeResult',
        'ox/AbiFunction:getSelector',
        'ox/AbiFunction:fromAbi',
        'ox/AbiFunction:from',
        'ox/AbiFunction:format',
      ],
      runs: 200,
      arb: fnAbi,
      check({ item, args, result }) {
        const abi = [item]
        const fromAbi = call('ox/AbiFunction:fromAbi', abi, item.name)
        same(
          'ox/AbiFunction:fromAbi',
          stripAbi(fromAbi),
          stripAbi(item),
          'AbiFunction.fromAbi',
        )
        const parsed = call(
          'ox/AbiFunction:from',
          call('ox/AbiFunction:format', item),
        )
        same(
          ['ox/AbiFunction:from', 'ox/AbiFunction:format'],
          stripAbi(parsed),
          stripAbi(item),
          'AbiFunction.from(AbiFunction.format(f))',
        )
        const selector = call('ox/AbiFunction:getSelector', item)
        vote(
          'ox/AbiFunction:getSelector',
          selector,
          {
            ethers: attempt(() => ethers.FunctionFragment.from(item).selector),
            viem: attempt(() => viem.toFunctionSelector(item)),
          },
          'function selector',
        )
        const data = call('ox/AbiFunction:encodeData', item, args)
        vote(
          'ox/AbiFunction:encodeData',
          data,
          {
            viem: attempt(() =>
              viem.encodeFunctionData({ abi, functionName: item.name, args }),
            ),
            ethers: attempt(() =>
              ethers.concat([
                ethers.FunctionFragment.from(item).selector,
                ethersEncode(item.inputs, args),
              ]),
            ),
          },
          'function data',
        )
        const decoded = call('ox/AbiFunction:decodeData', item, data)
        same(
          'ox/AbiFunction:decodeData',
          canonical(decoded ?? []),
          canonical(args),
          'AbiFunction.decodeData(AbiFunction.encodeData(f, args))',
        )
        // A single output is passed and returned bare; several as an array.
        const output = item.outputs.length === 1 ? result[0] : result
        const encodedResult = call('ox/AbiFunction:encodeResult', item, output)
        vote(
          'ox/AbiFunction:encodeResult',
          encodedResult,
          {
            viem: attempt(() =>
              viem.encodeFunctionResult({
                abi,
                functionName: item.name,
                result: output,
              }),
            ),
            ethers: attempt(() => ethersEncode(item.outputs, result)),
          },
          'function result',
        )
        const decodedResult = call(
          'ox/AbiFunction:decodeResult',
          item,
          encodedResult,
        )
        same(
          'ox/AbiFunction:decodeResult',
          canonical(decodedResult),
          canonical(item.outputs.length ? output : undefined),
          'AbiFunction.decodeResult(AbiFunction.encodeResult(f, x))',
        )
      },
    })
    add({
      id: 'round trip: errors (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/AbiError:encode',
        'ox/AbiError:decode',
        'ox/AbiError:getSelector',
        'ox/AbiError:fromAbi',
        'ox/AbiError:from',
        'ox/AbiError:format',
      ],
      runs: 200,
      arb: fc.record({ name: identifier, inputs: paramsWithValues }),
      check({ name, inputs: [params, args] }) {
        const item = { type: 'error', name, inputs: params } as Any
        const abi = [item]
        same(
          'ox/AbiError:fromAbi',
          stripAbi(call('ox/AbiError:fromAbi', abi, name)),
          stripAbi(item),
          'AbiError.fromAbi',
        )
        same(
          ['ox/AbiError:from', 'ox/AbiError:format'],
          stripAbi(call('ox/AbiError:from', call('ox/AbiError:format', item))),
          stripAbi(item),
          'AbiError.from(AbiError.format(e))',
        )
        vote(
          'ox/AbiError:getSelector',
          call('ox/AbiError:getSelector', item),
          {
            ethers: attempt(() => ethers.ErrorFragment.from(item).selector),
          },
          'error selector',
        )
        const data = call('ox/AbiError:encode', item, args)
        vote(
          'ox/AbiError:encode',
          data,
          {
            viem: attempt(() =>
              viem.encodeErrorResult({ abi, errorName: name, args }),
            ),
          },
          'error data',
        )
        const decoded = call('ox/AbiError:decode', item, data)
        same(
          'ox/AbiError:decode',
          canonical(decoded),
          canonical(
            params.length === 0
              ? undefined
              : params.length === 1
                ? args[0]
                : args,
          ),
          'AbiError.decode(AbiError.encode(e, args))',
        )
      },
    })
    add({
      id: 'round trip: event topics and data (differential with ethers)',
      oracle: 'round trip',
      covers: [
        'ox/AbiEvent:encode',
        'ox/AbiEvent:decode',
        'ox/AbiEvent:getSelector',
        'ox/AbiEvent:fromAbi',
        'ox/AbiEvent:from',
        'ox/AbiEvent:format',
        'ox/AbiEvent:assertArgs',
      ],
      runs: 200,
      arb: fc
        .record({
          name: identifier,
          inputs: fc.array(
            fc.record({
              param: fc.oneof(
                { weight: 3, arbitrary: elementary.map((type) => ({ type })) },
                { weight: 1, arbitrary: paramArb },
              ),
              indexed: fc.boolean(),
            }),
            { maxLength: 5 },
          ),
          anonymous: fc.boolean(),
        })
        .chain(({ name, inputs, anonymous }) => {
          let indexedCount = 0
          const params = inputs.map(({ param, indexed }, i) => {
            // Only elementary types can be indexed and decoded back (others are hashed), and at
            // most three topics (four when anonymous) follow the selector.
            const canIndex =
              indexed &&
              !param.components &&
              !/\[/.test(param.type) &&
              indexedCount < (anonymous ? 4 : 3)
            if (canIndex) indexedCount++
            return { ...param, name: `a${i}`, indexed: canIndex }
          })
          return fc.record({
            item: fc.constant({
              type: 'event',
              name,
              inputs: params,
              anonymous,
            }),
            values: fc.tuple(...params.map(arbitraryOf)),
          })
        }),
      check({ item, values }) {
        const abi = [item]
        same(
          'ox/AbiEvent:fromAbi',
          stripAbi(call('ox/AbiEvent:fromAbi', abi, item.name)),
          stripAbi(item),
          'AbiEvent.fromAbi',
        )
        same(
          ['ox/AbiEvent:from', 'ox/AbiEvent:format'],
          stripAbi(call('ox/AbiEvent:from', call('ox/AbiEvent:format', item))),
          stripAbi({ ...item, anonymous: undefined }),
          'AbiEvent.from(AbiEvent.format(e))',
        )
        const selector = call('ox/AbiEvent:getSelector', item)
        vote(
          'ox/AbiEvent:getSelector',
          selector,
          { ethers: attempt(() => ethers.EventFragment.from(item).topicHash) },
          'event selector',
        )
        // Only indexed arguments become topics; `encode` takes those, by name.
        const indexedValues = Object.fromEntries(
          item.inputs
            .map((param: Param, i: number) => [param, values[i]])
            .filter(([param]: [Param]) => param.indexed)
            .map(([param, value]: [Param, unknown]) => [param.name, value]),
        )
        const { topics } = call('ox/AbiEvent:encode', item, indexedValues)
        const fragment = attempt(() => ethers.EventFragment.from(item))
        const reference = fragment
          ? attempt(() =>
              new ethers.Interface([fragment]).encodeEventLog(
                fragment,
                item.inputs.map((param: Param, i: number) =>
                  toEthers(param, values[i]),
                ),
              ),
            )
          : undefined
        if (reference)
          vote(
            'ox/AbiEvent:encode',
            topics,
            { ethers: reference.topics },
            'event topics',
          )
        const nonIndexed = item.inputs.filter((param: Param) => !param.indexed)
        const data = nonIndexed.length
          ? call(
              'ox/AbiParameters:encode',
              nonIndexed,
              item.inputs
                .map((param: Param, i: number) => [param, values[i]])
                .filter(([param]: [Param]) => !param.indexed)
                .map(([, value]: [Param, unknown]) => value),
            )
          : '0x'
        const decoded = call('ox/AbiEvent:decode', item, { data, topics })
        const expected = Object.fromEntries(
          item.inputs.map((param: Param, i: number) => [
            param.name,
            param.indexed && (param.type === 'string' || param.type === 'bytes')
              ? fn('ox/Hash:keccak256')(
                  param.type === 'string'
                    ? fn('ox/Hex:fromString')(values[i])
                    : values[i],
                )
              : values[i],
          ]),
        )
        same(
          'ox/AbiEvent:decode',
          canonical(decoded ?? {}),
          canonical(expected),
          'AbiEvent.decode(AbiEvent.encode(e, args))',
        )
        if (item.inputs.length) {
          const indexedArgs = Object.fromEntries(
            item.inputs
              .map((param: Param, i: number) => [param, values[i]])
              .filter(
                ([param]: [Param]) =>
                  param.indexed &&
                  param.type !== 'string' &&
                  param.type !== 'bytes',
              )
              .map(([param, value]: [Param, unknown]) => [param.name, value]),
          )
          call('ox/AbiEvent:assertArgs', item, decoded ?? {}, indexedArgs)
        }
      },
    })
    add({
      id: 'round trip: constructor data',
      oracle: 'round trip',
      covers: [
        'ox/AbiConstructor:encode',
        'ox/AbiConstructor:decode',
        'ox/AbiConstructor:fromAbi',
        'ox/AbiConstructor:from',
        'ox/AbiConstructor:format',
      ],
      runs: 150,
      arb: fc.record({
        inputs: paramsWithValues,
        bytecode: hexOf(1, 40),
        payable: fc.boolean(),
      }),
      check({ inputs: [params, args], bytecode, payable }) {
        const item = {
          type: 'constructor',
          inputs: params,
          stateMutability: payable ? 'payable' : 'nonpayable',
        } as Any
        same(
          'ox/AbiConstructor:fromAbi',
          stripAbi(call('ox/AbiConstructor:fromAbi', [item])),
          stripAbi(item),
          'AbiConstructor.fromAbi',
        )
        same(
          ['ox/AbiConstructor:from', 'ox/AbiConstructor:format'],
          stripAbi(
            call(
              'ox/AbiConstructor:from',
              call('ox/AbiConstructor:format', item),
            ),
          ),
          stripAbi(item),
          'AbiConstructor.from(AbiConstructor.format(c))',
        )
        const data = call('ox/AbiConstructor:encode', item, { bytecode, args })
        vote(
          'ox/AbiConstructor:encode',
          data,
          {
            viem: attempt(() =>
              viem.encodeDeployData({ abi: [item], bytecode, args }),
            ),
          },
          'deploy data',
        )
        const decoded = call('ox/AbiConstructor:decode', item, {
          bytecode,
          data,
        })
        same(
          'ox/AbiConstructor:decode',
          canonical(decoded ?? []),
          canonical(args),
          'AbiConstructor.decode(AbiConstructor.encode(c, args))',
        )
      },
    })
    add({
      id: 'differential: AbiItem signatures and selectors against ethers',
      oracle: 'differential',
      covers: [
        'ox/AbiItem:from',
        'ox/AbiItem:format',
        'ox/AbiItem:fromAbi',
        'ox/AbiItem:getSelector',
        'ox/AbiItem:getSignature',
        'ox/AbiItem:getSignatureHash',
        'ox/Abi:from',
        'ox/Abi:format',
      ],
      runs: 150,
      arb: fc.tuple(fnAbi, fc.constantFrom('function', 'event', 'error')),
      check([{ item: fnItem }, type]) {
        const item =
          type === 'function'
            ? fnItem
            : { type, name: fnItem.name, inputs: fnItem.inputs }
        const fragment = attempt(() => ethers.Fragment.from(item))
        const signature = call('ox/AbiItem:getSignature', item)
        vote(
          'ox/AbiItem:getSignature',
          signature,
          { ethers: fragment && attempt(() => fragment.format('sighash')) },
          'signature',
        )
        same(
          'ox/AbiItem:getSignatureHash',
          call('ox/AbiItem:getSignatureHash', item),
          ethers.id(signature),
          'AbiItem.getSignatureHash is keccak256 of the signature',
        )
        same(
          'ox/AbiItem:getSelector',
          call('ox/AbiItem:getSelector', item),
          ethers.id(signature).slice(0, 10),
          'AbiItem.getSelector',
        )
        same(
          'ox/AbiItem:getSignature',
          call('ox/AbiItem:getSignature', signature),
          signature,
          'AbiItem.getSignature(signature)',
        )
        const formatted = call('ox/AbiItem:format', item)
        same(
          ['ox/AbiItem:from', 'ox/AbiItem:format'],
          stripAbi(call('ox/AbiItem:from', formatted)),
          stripAbi(item),
          `AbiItem.from(${JSON.stringify(formatted)})`,
        )
        same(
          'ox/AbiItem:fromAbi',
          stripAbi(call('ox/AbiItem:fromAbi', [item], item.name)),
          stripAbi(item),
          'AbiItem.fromAbi',
        )
        const abi = call('ox/Abi:from', [formatted])
        same(
          ['ox/Abi:from', 'ox/Abi:format'],
          call('ox/Abi:format', abi),
          [formatted],
          'Abi.format(Abi.from([signature]))',
        )
      },
    })
  }

  // Addresses, public keys, signatures, and the curves.
  {
    const secp = noble.secp256k1
    const publicKeyOf = (key: string, compressed = false) =>
      secp.ProjectivePoint.fromHex(secp.getPublicKey(hexBytes(key), compressed))
    const oxPublicKey = (key: string) => {
      const point = publicKeyOf(key)
      return { prefix: 4, x: point.x, y: point.y }
    }
    add({
      id: 'differential: Address.checksum, from, validate against ethers and viem',
      oracle: 'differential',
      covers: [
        'ox/Address:checksum',
        'ox/Address:from',
        'ox/Address:validate',
        'ox/Address:assert',
        'ox/Address:isEqual',
      ],
      runs: 300,
      arb: fc.record({
        bytes: bytesOf(20, 20),
        form: fc.constantFrom(
          'lower',
          'upper',
          'checksum',
          'flipped',
          'short',
          'long',
          'nohex',
          'noprefix',
        ),
        at: fc.nat(39),
        other: address,
      }),
      check({ bytes, form, at, other }) {
        const lower = toHex(bytes)
        const checksummed = ethers.getAddress(lower)
        const flip = (text: string) => {
          const chars = [...text]
          const index = 2 + at
          const char = chars[index]!
          chars[index] =
            char === char.toLowerCase()
              ? char.toUpperCase()
              : char.toLowerCase()
          return chars.join('')
        }
        const value =
          form === 'lower'
            ? lower
            : form === 'upper'
              ? `0x${lower.slice(2).toUpperCase()}`
              : form === 'checksum'
                ? checksummed
                : form === 'flipped'
                  ? flip(checksummed)
                  : form === 'short'
                    ? lower.slice(0, -2)
                    : form === 'long'
                      ? `${lower}00`
                      : form === 'nohex'
                        ? `0x${'g'}${lower.slice(3)}`
                        : lower.slice(2)
        const valid = viem.isAddress(value, { strict: true })
        const prefixed = value.startsWith('0x')
        // ethers takes an all-uppercase address as unchecksummed (EIP-55 allows it); viem and
        // ox check its checksum in strict mode, so ox is only wrong when both disagree with it.
        if (prefixed) {
          vote(
            'ox/Address:validate',
            call('ox/Address:validate', value),
            {
              ethers: attempt(() => ethers.getAddress(value)) !== undefined,
              viem: valid,
            },
            `Address.validate(${value})`,
          )
          same(
            'ox/Address:validate',
            call('ox/Address:validate', value, { strict: false }),
            /^0x[0-9a-fA-F]{40}$/.test(value),
            `Address.validate(${value}, {strict: false})`,
          )
        }
        if (valid && prefixed) {
          call('ox/Address:assert', value)
          same(
            'ox/Address:checksum',
            call('ox/Address:checksum', value),
            checksummed,
            `Address.checksum(${value})`,
          )
          same(
            'ox/Address:from',
            call('ox/Address:from', value, { checksum: true }),
            checksummed,
            `Address.from(${value}, {checksum: true})`,
          )
          same(
            'ox/Address:from',
            call('ox/Address:from', value),
            value,
            `Address.from(${value})`,
          )
          same(
            'ox/Address:isEqual',
            call('ox/Address:isEqual', value, lower),
            true,
            'Address.isEqual ignores case',
          )
          same(
            'ox/Address:isEqual',
            call('ox/Address:isEqual', value, other),
            lower === other,
            'Address.isEqual',
          )
        } else if (prefixed) {
          rejects('ox/Address:assert', `${value}, not an address`, value)
          rejects('ox/Address:from', `${value}, not an address`, value)
        }
      },
    })
    add({
      id: 'differential: Address.fromPublicKey and Secp256k1 keys against ethers and noble',
      oracle: 'differential',
      covers: [
        'ox/Address:fromPublicKey',
        'ox/Secp256k1:getPublicKey',
        'ox/Secp256k1:getSharedSecret',
      ],
      runs: 120,
      arb: fc.tuple(privateKey, privateKey, fc.boolean()),
      check([key, otherKey, bytes]) {
        const input = bytes ? hexBytes(key) : key
        const publicKey = call('ox/Secp256k1:getPublicKey', {
          privateKey: input,
        })
        same(
          'ox/Secp256k1:getPublicKey',
          publicKey,
          oxPublicKey(key),
          'Secp256k1.getPublicKey',
        )
        const address = call('ox/Address:fromPublicKey', publicKey)
        vote(
          'ox/Address:fromPublicKey',
          address.toLowerCase(),
          {
            ethers: ethers.computeAddress(key).toLowerCase(),
            viem: attempt(() =>
              lib.viemUtils
                .publicKeyToAddress(
                  toHex(secp.getPublicKey(hexBytes(key), false)),
                )
                .toLowerCase(),
            ),
          },
          'Address.fromPublicKey',
        )
        same(
          'ox/Address:fromPublicKey',
          call('ox/Address:fromPublicKey', publicKey, { checksum: false }),
          address.toLowerCase(),
          'Address.fromPublicKey(…, {checksum: false})',
        )
        const otherPublic = oxPublicKey(otherKey)
        const shared = call('ox/Secp256k1:getSharedSecret', {
          privateKey: input,
          publicKey: otherPublic,
        })
        same(
          'ox/Secp256k1:getSharedSecret',
          shared,
          toHex(
            secp.getSharedSecret(
              hexBytes(key),
              hexBytes(
                `0x04${otherPublic.x.toString(16).padStart(64, '0')}${otherPublic.y.toString(16).padStart(64, '0')}`,
              ),
            ),
          ),
          'Secp256k1.getSharedSecret against noble',
        )
        same(
          'ox/Secp256k1:getSharedSecret',
          shared,
          call('ox/Secp256k1:getSharedSecret', {
            privateKey: otherKey,
            publicKey,
          }),
          'Secp256k1.getSharedSecret is symmetric',
        )
      },
    })
    add({
      id: 'differential: CREATE and CREATE2 addresses against ethers and viem',
      oracle: 'differential',
      covers: [
        'ox/ContractAddress:fromCreate',
        'ox/ContractAddress:fromCreate2',
        'ox/ContractAddress:from',
      ],
      runs: 200,
      arb: fc.record({
        from: address,
        nonce: fc.oneof(
          fc.constantFrom(0n, 1n, 127n, 128n, 255n, 256n, 2n ** 64n - 2n),
          uint(64).map((value) => (value === 2n ** 64n - 1n ? 0n : value)),
        ),
        salt: fc.oneof(hash, bytesOf(32, 32)),
        bytecode: hexOf(0, 60),
        hashed: fc.boolean(),
      }),
      check({ from, nonce, salt, bytecode, hashed }) {
        const create = call('ox/ContractAddress:fromCreate', { from, nonce })
        vote(
          'ox/ContractAddress:fromCreate',
          create.toLowerCase(),
          {
            ethers: attempt(() =>
              ethers.getCreateAddress({ from, nonce }).toLowerCase(),
            ),
            viem: attempt(() =>
              viem.getContractAddress({ from, nonce }).toLowerCase(),
            ),
          },
          'CREATE address',
        )
        same(
          'ox/ContractAddress:from',
          call('ox/ContractAddress:from', { from, nonce }),
          create,
          'ContractAddress.from({from, nonce})',
        )
        const saltHex = typeof salt === 'string' ? salt : toHex(salt)
        const options = hashed
          ? { from, salt, bytecodeHash: ethers.keccak256(bytecode) }
          : { from, salt, bytecode }
        const create2 = call('ox/ContractAddress:fromCreate2', options)
        vote(
          'ox/ContractAddress:fromCreate2',
          create2.toLowerCase(),
          {
            ethers: attempt(() =>
              ethers
                .getCreate2Address(from, saltHex, ethers.keccak256(bytecode))
                .toLowerCase(),
            ),
          },
          'CREATE2 address',
        )
        same(
          'ox/ContractAddress:from',
          call('ox/ContractAddress:from', options),
          create2,
          'ContractAddress.from(create2 options)',
        )
      },
    })
    add({
      id: 'round trip: public keys (differential with noble)',
      oracle: 'round trip',
      covers: [
        'ox/PublicKey:from',
        'ox/PublicKey:fromHex',
        'ox/PublicKey:fromBytes',
        'ox/PublicKey:toHex',
        'ox/PublicKey:toBytes',
        'ox/PublicKey:compress',
        'ox/PublicKey:assert',
        'ox/PublicKey:validate',
      ],
      runs: 150,
      arb: fc.tuple(privateKey, fc.boolean()),
      check([key, includePrefix]) {
        const uncompressed = toHex(secp.getPublicKey(hexBytes(key), false))
        const compressed = toHex(secp.getPublicKey(hexBytes(key), true))
        const expected = oxPublicKey(key)
        same(
          'ox/PublicKey:fromHex',
          call('ox/PublicKey:fromHex', uncompressed),
          expected,
          'PublicKey.fromHex(uncompressed)',
        )
        same(
          'ox/PublicKey:fromBytes',
          call('ox/PublicKey:fromBytes', hexBytes(uncompressed)),
          expected,
          'PublicKey.fromBytes(uncompressed)',
        )
        same(
          'ox/PublicKey:from',
          call('ox/PublicKey:from', uncompressed),
          expected,
          'PublicKey.from(hex)',
        )
        same(
          'ox/PublicKey:from',
          call('ox/PublicKey:from', { x: expected.x, y: expected.y }),
          expected,
          'PublicKey.from({x, y})',
        )
        const compressedKey = call('ox/PublicKey:compress', expected)
        same(
          'ox/PublicKey:compress',
          compressedKey,
          { prefix: Number(compressed.slice(0, 4)), x: expected.x },
          'PublicKey.compress against noble',
        )
        same(
          'ox/PublicKey:fromHex',
          call('ox/PublicKey:fromHex', compressed),
          compressedKey,
          'PublicKey.fromHex(compressed)',
        )
        same(
          'ox/PublicKey:toHex',
          call('ox/PublicKey:toHex', expected, { includePrefix }),
          includePrefix ? uncompressed : `0x${uncompressed.slice(4)}`,
          'PublicKey.toHex',
        )
        same(
          'ox/PublicKey:toHex',
          call('ox/PublicKey:toHex', compressedKey),
          compressed,
          'PublicKey.toHex(compressed)',
        )
        same(
          'ox/PublicKey:toBytes',
          call('ox/PublicKey:toBytes', expected, { includePrefix }),
          hexBytes(includePrefix ? uncompressed : `0x${uncompressed.slice(4)}`),
          'PublicKey.toBytes',
        )
        same(
          'ox/PublicKey:fromHex',
          call('ox/PublicKey:fromHex', `0x${uncompressed.slice(4)}`),
          expected,
          'PublicKey.fromHex without a prefix',
        )
        call('ox/PublicKey:assert', expected)
        same(
          'ox/PublicKey:validate',
          call('ox/PublicKey:validate', expected),
          true,
          'PublicKey.validate',
        )
        same(
          'ox/PublicKey:validate',
          call('ox/PublicKey:validate', {
            prefix: 5,
            x: expected.x,
            y: expected.y,
          }),
          false,
          'PublicKey.validate rejects prefix 5',
        )
      },
    })
    add({
      id: 'round trip: signature encodings (differential with ethers and noble DER)',
      oracle: 'round trip',
      covers: [
        'ox/Signature:toHex',
        'ox/Signature:fromHex',
        'ox/Signature:toBytes',
        'ox/Signature:fromBytes',
        'ox/Signature:toTuple',
        'ox/Signature:fromTuple',
        'ox/Signature:toRpc',
        'ox/Signature:fromRpc',
        'ox/Signature:toLegacy',
        'ox/Signature:fromLegacy',
        'ox/Signature:from',
        'ox/Signature:extract',
        'ox/Signature:assert',
        'ox/Signature:validate',
        'ox/Signature:toDerHex',
        'ox/Signature:fromDerHex',
        'ox/Signature:toDerBytes',
        'ox/Signature:fromDerBytes',
        'ox/Signature:vToYParity',
        'ox/Signature:yParityToV',
      ],
      runs: 200,
      arb: fc.record({
        signature: fc.oneof(
          signature,
          fc.record({
            r: fc.constantFrom(1n, 0xffn, 2n ** 248n),
            s: fc.constantFrom(1n, 0x7fn, 2n ** 200n + 1n),
            yParity: fc.integer({ min: 0, max: 1 }),
          }),
        ),
        chainId: fc.integer({ min: 1, max: 2 ** 20 }),
      }),
      check({ signature, chainId }) {
        const hex = call('ox/Signature:toHex', signature)
        const reference = attempt(
          () =>
            ethers.Signature.from({
              r: toHex32(signature.r),
              s: toHex32(signature.s),
              yParity: signature.yParity,
            }).serialized,
        )
        vote(
          'ox/Signature:toHex',
          hex,
          { ethers: reference },
          'Signature.toHex',
        )
        same(
          'ox/Signature:fromHex',
          call('ox/Signature:fromHex', hex),
          signature,
          'Signature.fromHex(Signature.toHex(s))',
        )
        same(
          'ox/Signature:toBytes',
          call('ox/Signature:toBytes', signature),
          hexBytes(hex),
          'Signature.toBytes',
        )
        same(
          'ox/Signature:fromBytes',
          call('ox/Signature:fromBytes', hexBytes(hex)),
          signature,
          'Signature.fromBytes',
        )
        same(
          'ox/Signature:from',
          call('ox/Signature:from', hex),
          signature,
          'Signature.from(hex)',
        )
        // A v byte of 0 or 1 reads as yParity too.
        const raw = `${hex.slice(0, 130)}0${signature.yParity}`
        same(
          'ox/Signature:fromHex',
          call('ox/Signature:fromHex', raw),
          signature,
          'Signature.fromHex with v of 0 or 1',
        )
        const compact = hex.slice(0, 130)
        same(
          'ox/Signature:fromHex',
          call('ox/Signature:fromHex', compact),
          { r: signature.r, s: signature.s },
          'Signature.fromHex of 64 bytes',
        )
        same(
          'ox/Signature:fromTuple',
          call(
            'ox/Signature:fromTuple',
            call('ox/Signature:toTuple', signature),
          ),
          signature,
          'Signature.fromTuple(Signature.toTuple(s))',
        )
        const rpc = call('ox/Signature:toRpc', signature)
        same(
          'ox/Signature:toRpc',
          rpc,
          {
            r: toHex32(signature.r),
            s: toHex32(signature.s),
            yParity: `0x${signature.yParity}`,
          },
          'Signature.toRpc',
        )
        same(
          'ox/Signature:fromRpc',
          call('ox/Signature:fromRpc', rpc),
          signature,
          'Signature.fromRpc(Signature.toRpc(s))',
        )
        same(
          'ox/Signature:fromRpc',
          call('ox/Signature:fromRpc', {
            r: rpc.r,
            s: rpc.s,
            v: `0x${(27 + signature.yParity).toString(16)}`,
          }),
          signature,
          'Signature.fromRpc with v',
        )
        same(
          'ox/Signature:from',
          call('ox/Signature:from', rpc),
          signature,
          'Signature.from(rpc)',
        )
        const legacy = call('ox/Signature:toLegacy', signature)
        same(
          'ox/Signature:toLegacy',
          legacy,
          { r: signature.r, s: signature.s, v: 27 + signature.yParity },
          'Signature.toLegacy',
        )
        same(
          'ox/Signature:fromLegacy',
          call('ox/Signature:fromLegacy', legacy),
          signature,
          'Signature.fromLegacy',
        )
        same(
          'ox/Signature:from',
          call('ox/Signature:from', legacy),
          signature,
          'Signature.from(legacy)',
        )
        same(
          'ox/Signature:fromLegacy',
          call('ox/Signature:fromLegacy', {
            ...legacy,
            v: chainId * 2 + 35 + signature.yParity,
          }),
          signature,
          'Signature.fromLegacy with an EIP-155 v',
        )
        same(
          'ox/Signature:extract',
          call('ox/Signature:extract', { ...signature, other: 1 }),
          signature,
          'Signature.extract',
        )
        same(
          'ox/Signature:extract',
          call('ox/Signature:extract', { s: signature.s }),
          undefined,
          'Signature.extract without r',
        )
        same(
          'ox/Signature:vToYParity',
          call(
            'ox/Signature:vToYParity',
            call('ox/Signature:yParityToV', signature.yParity),
          ),
          signature.yParity,
          'vToYParity(yParityToV(y))',
        )
        call('ox/Signature:assert', signature, { recovered: true })
        same(
          'ox/Signature:validate',
          call('ox/Signature:validate', signature),
          true,
          'Signature.validate',
        )
        same(
          'ox/Signature:validate',
          call('ox/Signature:validate', { ...signature, yParity: 2 }),
          false,
          'Signature.validate rejects yParity 2',
        )
        same(
          'ox/Signature:validate',
          call('ox/Signature:validate', { ...signature, r: 2n ** 256n }),
          false,
          'Signature.validate rejects r ≥ 2^256',
        )
        if (signature.r < secp256k1N && signature.s < secp256k1N) {
          const der = call('ox/Signature:toDerHex', signature)
          same(
            'ox/Signature:toDerHex',
            der,
            `0x${new secp.Signature(signature.r, signature.s).toDERHex()}`,
            'Signature.toDerHex against noble',
          )
          same(
            'ox/Signature:toDerBytes',
            call('ox/Signature:toDerBytes', signature),
            hexBytes(der),
            'Signature.toDerBytes',
          )
          same(
            'ox/Signature:fromDerHex',
            call('ox/Signature:fromDerHex', der),
            { r: signature.r, s: signature.s },
            'Signature.fromDerHex(Signature.toDerHex(s))',
          )
          same(
            'ox/Signature:fromDerBytes',
            call('ox/Signature:fromDerBytes', hexBytes(der)),
            { r: signature.r, s: signature.s },
            'Signature.fromDerBytes',
          )
        }
      },
    })
    add({
      id: 'consistency: Signature.fromHex rejects bad sizes and v bytes',
      oracle: 'consistency',
      covers: ['ox/Signature:fromHex', 'ox/Signature:vToYParity'],
      runs: 150,
      arb: fc.oneof(
        hexOf(0, 70).filter((hex) => hex.length !== 130 && hex.length !== 132),
        fc
          .tuple(hexOf(64, 64), fc.integer({ min: 2, max: 26 }))
          .map(([body, v]) => `${body}${v.toString(16).padStart(2, '0')}`),
      ),
      check(hex) {
        rejects('ox/Signature:fromHex', `${hex} as a signature`, hex)
        if (hex.length === 132)
          rejects(
            'ox/Signature:vToYParity',
            `v ${Number(`0x${hex.slice(130)}`)}`,
            Number(`0x${hex.slice(130)}`),
          )
      },
    })
    add({
      id: 'differential: Secp256k1 sign, verify, recover against noble and ethers',
      oracle: 'differential',
      covers: [
        'ox/Secp256k1:sign',
        'ox/Secp256k1:verify',
        'ox/Secp256k1:recoverPublicKey',
        'ox/Secp256k1:recoverAddress',
      ],
      runs: 80,
      arb: fc.record({
        key: privateKey,
        payload: hash,
        other: hash,
        prehash: fc.boolean(),
        bytes: fc.boolean(),
      }),
      check({ key, payload, other, prehash, bytes }) {
        const input = bytes ? hexBytes(payload) : payload
        const signature = call('ox/Secp256k1:sign', {
          payload: input,
          privateKey: key,
          hash: prehash,
        })
        const digest = prehash
          ? noble.sha2.sha256(hexBytes(payload))
          : hexBytes(payload)
        const expected = secp.sign(digest, hexBytes(key), { lowS: true })
        same(
          'ox/Secp256k1:sign',
          signature,
          { r: expected.r, s: expected.s, yParity: expected.recovery },
          'Secp256k1.sign against noble',
        )
        if (!prehash) {
          const ethersSignature = new ethers.SigningKey(key).sign(payload)
          vote(
            'ox/Secp256k1:sign',
            signature,
            {
              ethers: {
                r: BigInt(ethersSignature.r),
                s: BigInt(ethersSignature.s),
                yParity: ethersSignature.yParity,
              },
            },
            'Secp256k1.sign',
          )
        }
        const publicKey = oxPublicKey(key)
        same(
          'ox/Secp256k1:verify',
          call('ox/Secp256k1:verify', {
            payload: input,
            publicKey,
            signature,
            hash: prehash,
          }),
          true,
          'Secp256k1.verify(sign(x))',
        )
        same(
          'ox/Secp256k1:verify',
          call('ox/Secp256k1:verify', {
            payload: other,
            publicKey,
            signature,
            hash: prehash,
          }),
          other === payload,
          'Secp256k1.verify of another payload',
        )
        const address = ethers.computeAddress(key)
        same(
          'ox/Secp256k1:verify',
          call('ox/Secp256k1:verify', {
            payload: input,
            address,
            signature,
            hash: prehash,
          }),
          true,
          'Secp256k1.verify({address})',
        )
        const recoveryPayload = prehash ? toHex(digest) : input
        same(
          'ox/Secp256k1:recoverPublicKey',
          call('ox/Secp256k1:recoverPublicKey', {
            payload: recoveryPayload,
            signature,
          }),
          publicKey,
          'Secp256k1.recoverPublicKey(sign(x))',
        )
        const recovered = call('ox/Secp256k1:recoverAddress', {
          payload: recoveryPayload,
          signature,
        })
        vote(
          'ox/Secp256k1:recoverAddress',
          recovered.toLowerCase(),
          { ethers: address.toLowerCase() },
          'Secp256k1.recoverAddress',
        )
        // A high-s twin is malleable: verify rejects it (lowS), and recovery still names the signer.
        const highS = {
          r: signature.r,
          s: secp256k1N - signature.s,
          yParity: 1 - signature.yParity,
        }
        same(
          'ox/Secp256k1:verify',
          call('ox/Secp256k1:verify', {
            payload: input,
            publicKey,
            signature: highS,
            hash: prehash,
          }),
          false,
          'Secp256k1.verify rejects the high-s twin',
        )
      },
    })
    add({
      id: 'consistency: Secp256k1 keys from seeds, mnemonics, and randomness (differential with ethers HD wallets)',
      oracle: 'consistency',
      covers: [
        'ox/Secp256k1:createKeyPair',
        'ox/Secp256k1:randomPrivateKey',
        'ox/Secp256k1:fromSeed',
        'ox/Secp256k1:fromMnemonic',
      ],
      runs: 12,
      arb: fc.record({
        seed: bytesOf(32, 64),
        entropy: bytesOf(16, 16),
        passphrase: fc.constantFrom(undefined, '', 'TREZOR'),
        index: fc.nat(3),
        as: fc.constantFrom('Hex', 'Bytes'),
      }),
      check({ seed, entropy, passphrase, index, as }) {
        const pair = call('ox/Secp256k1:createKeyPair', { as })
        same(
          'ox/Secp256k1:createKeyPair',
          pair.publicKey,
          oxPublicKey(
            typeof pair.privateKey === 'string'
              ? pair.privateKey
              : toHex(pair.privateKey),
          ),
          'createKeyPair public key matches its private key',
        )
        const random = call('ox/Secp256k1:randomPrivateKey', { as })
        if (
          !secp.utils.isValidPrivateKey(
            typeof random === 'string' ? hexBytes(random) : random,
          )
        )
          throw new Failure('randomPrivateKey returned an invalid key', {
            blame: ['ox/Secp256k1:randomPrivateKey'],
          })
        const fromSeed = call('ox/Secp256k1:fromSeed', seed)
        same(
          'ox/Secp256k1:fromSeed',
          call('ox/Secp256k1:fromSeed', toHex(seed)),
          fromSeed,
          'Secp256k1.fromSeed is deterministic and takes hex or bytes',
        )
        if (!secp.utils.isValidPrivateKey(hexBytes(fromSeed)))
          throw new Failure('fromSeed returned an invalid key', {
            blame: ['ox/Secp256k1:fromSeed'],
          })
        const phrase = ethers.Mnemonic.entropyToPhrase(entropy)
        const path = `m/44'/60'/0'/0/${index}`
        same(
          'ox/Secp256k1:fromMnemonic',
          call('ox/Secp256k1:fromMnemonic', phrase, { passphrase, path }),
          ethers.HDNodeWallet.fromPhrase(phrase, passphrase, path).privateKey,
          'Secp256k1.fromMnemonic against ethers',
        )
      },
    })
    {
      const p256 = noble.p256
      const p256Public = (key: string) => {
        const point = p256.ProjectivePoint.fromHex(
          p256.getPublicKey(hexBytes(key), false),
        )
        return { prefix: 4, x: point.x, y: point.y }
      }
      add({
        id: 'differential: P256 sign, verify, recover, shared secrets against noble',
        oracle: 'differential',
        covers: [
          'ox/P256:sign',
          'ox/P256:verify',
          'ox/P256:recoverPublicKey',
          'ox/P256:getPublicKey',
          'ox/P256:getSharedSecret',
        ],
        runs: 60,
        arb: fc.record({
          key: p256Key,
          otherKey: p256Key,
          payload: fc.oneof(hash, hexOf(1, 40)),
          other: hash,
          prehash: fc.boolean(),
          as: fc.constantFrom(undefined, 'Hex', 'Bytes'),
        }),
        check({ key, otherKey, payload, other, prehash, as }) {
          const publicKey = call('ox/P256:getPublicKey', { privateKey: key })
          same(
            'ox/P256:getPublicKey',
            publicKey,
            p256Public(key),
            'P256.getPublicKey against noble',
          )
          const signature = call('ox/P256:sign', {
            payload,
            privateKey: key,
            hash: prehash,
          })
          const expected = p256.sign(hexBytes(payload), hexBytes(key), {
            lowS: true,
            prehash,
          })
          same(
            'ox/P256:sign',
            signature,
            { r: expected.r, s: expected.s, yParity: expected.recovery },
            'P256.sign against noble',
          )
          same(
            'ox/P256:verify',
            call('ox/P256:verify', {
              payload,
              publicKey,
              signature,
              hash: prehash,
            }),
            true,
            'P256.verify(sign(x))',
          )
          same(
            'ox/P256:verify',
            call('ox/P256:verify', {
              payload: other,
              publicKey,
              signature,
              hash: prehash,
            }),
            other === payload,
            'P256.verify of another payload',
          )
          if (!prehash && hexBytes(payload).length === 32)
            same(
              'ox/P256:recoverPublicKey',
              call('ox/P256:recoverPublicKey', { payload, signature }),
              publicKey,
              'P256.recoverPublicKey(sign(x))',
            )
          const shared = call('ox/P256:getSharedSecret', {
            privateKey: key,
            publicKey: p256Public(otherKey),
            as,
          })
          const sharedHex = typeof shared === 'string' ? shared : toHex(shared)
          same(
            'ox/P256:getSharedSecret',
            sharedHex,
            toHex(
              p256.getSharedSecret(
                hexBytes(key),
                p256.getPublicKey(hexBytes(otherKey), false),
              ),
            ),
            'P256.getSharedSecret against noble',
          )
        },
      })
      add({
        id: 'consistency: P256 keys from seeds, mnemonics, and randomness',
        oracle: 'consistency',
        covers: [
          'ox/P256:createKeyPair',
          'ox/P256:randomPrivateKey',
          'ox/P256:fromSeed',
          'ox/P256:fromMnemonic',
        ],
        runs: 12,
        arb: fc.record({
          seed: bytesOf(32, 64),
          entropy: bytesOf(16, 16),
          as: fc.constantFrom('Hex', 'Bytes'),
        }),
        check({ seed, entropy, as }) {
          const pair = call('ox/P256:createKeyPair', { as })
          same(
            'ox/P256:createKeyPair',
            pair.publicKey,
            p256Public(
              typeof pair.privateKey === 'string'
                ? pair.privateKey
                : toHex(pair.privateKey),
            ),
            'P256.createKeyPair public key matches its private key',
          )
          const random = call('ox/P256:randomPrivateKey', { as })
          if (
            !p256.utils.isValidPrivateKey(
              typeof random === 'string' ? hexBytes(random) : random,
            )
          )
            throw new Failure('randomPrivateKey returned an invalid key', {
              blame: ['ox/P256:randomPrivateKey'],
            })
          const fromSeed = call('ox/P256:fromSeed', seed)
          same(
            'ox/P256:fromSeed',
            call('ox/P256:fromSeed', toHex(seed)),
            fromSeed,
            'P256.fromSeed is deterministic',
          )
          if (!p256.utils.isValidPrivateKey(hexBytes(fromSeed)))
            throw new Failure('fromSeed returned an invalid key', {
              blame: ['ox/P256:fromSeed'],
            })
          const phrase = ethers.Mnemonic.entropyToPhrase(entropy)
          same(
            'ox/P256:fromMnemonic',
            call('ox/P256:fromMnemonic', phrase),
            call(
              'ox/P256:fromSeed',
              ethers.Mnemonic.fromPhrase(phrase).computeSeed(),
            ),
            'P256.fromMnemonic is fromSeed of the BIP-39 seed',
          )
        },
      })
    }
    {
      const {
        ed25519,
        x25519,
        edwardsToMontgomeryPub,
        edwardsToMontgomeryPriv,
      } = noble.ed25519
      add({
        id: 'differential: Ed25519 and X25519 against noble',
        oracle: 'differential',
        covers: [
          'ox/Ed25519:sign',
          'ox/Ed25519:verify',
          'ox/Ed25519:getPublicKey',
          'ox/Ed25519:toX25519PublicKey',
          'ox/Ed25519:toX25519PrivateKey',
          'ox/X25519:getPublicKey',
          'ox/X25519:getSharedSecret',
        ],
        runs: 80,
        arb: fc.record({
          key: hexOf(32, 32),
          otherKey: hexOf(32, 32),
          payload: hexOf(0, 64),
          other: hexOf(0, 8),
          as: fc.constantFrom(undefined, 'Hex', 'Bytes'),
        }),
        check({ key, otherKey, payload, other, as }) {
          const view = (value: unknown) =>
            value instanceof Uint8Array ? toHex(value) : value
          const publicKey = view(
            call('ox/Ed25519:getPublicKey', { privateKey: key, as }),
          )
          same(
            'ox/Ed25519:getPublicKey',
            publicKey,
            toHex(ed25519.getPublicKey(hexBytes(key))),
            'Ed25519.getPublicKey against noble',
          )
          const signature = view(
            call('ox/Ed25519:sign', { payload, privateKey: key, as }),
          )
          same(
            'ox/Ed25519:sign',
            signature,
            toHex(ed25519.sign(hexBytes(payload), hexBytes(key))),
            'Ed25519.sign against noble',
          )
          same(
            'ox/Ed25519:verify',
            call('ox/Ed25519:verify', { payload, publicKey, signature }),
            true,
            'Ed25519.verify(sign(x))',
          )
          same(
            'ox/Ed25519:verify',
            call('ox/Ed25519:verify', { payload: other, publicKey, signature }),
            other === payload,
            'Ed25519.verify of another payload',
          )
          same(
            'ox/Ed25519:toX25519PublicKey',
            view(call('ox/Ed25519:toX25519PublicKey', { publicKey, as })),
            toHex(edwardsToMontgomeryPub(hexBytes(publicKey as string))),
            'Ed25519.toX25519PublicKey against noble',
          )
          same(
            'ox/Ed25519:toX25519PrivateKey',
            view(
              call('ox/Ed25519:toX25519PrivateKey', { privateKey: key, as }),
            ),
            toHex(edwardsToMontgomeryPriv(hexBytes(key))),
            'Ed25519.toX25519PrivateKey against noble',
          )
          same(
            'ox/X25519:getPublicKey',
            view(call('ox/X25519:getPublicKey', { privateKey: key, as })),
            toHex(x25519.getPublicKey(hexBytes(key))),
            'X25519.getPublicKey against noble',
          )
          const otherPublic = toHex(x25519.getPublicKey(hexBytes(otherKey)))
          same(
            'ox/X25519:getSharedSecret',
            view(
              call('ox/X25519:getSharedSecret', {
                privateKey: key,
                publicKey: otherPublic,
                as,
              }),
            ),
            toHex(x25519.getSharedSecret(hexBytes(key), hexBytes(otherPublic))),
            'X25519.getSharedSecret against noble',
          )
        },
      })
      add({
        id: 'consistency: Ed25519 and X25519 key pairs, seeds, mnemonics',
        oracle: 'consistency',
        covers: [
          'ox/Ed25519:createKeyPair',
          'ox/Ed25519:randomPrivateKey',
          'ox/Ed25519:fromSeed',
          'ox/Ed25519:fromMnemonic',
          'ox/X25519:createKeyPair',
          'ox/X25519:randomPrivateKey',
        ],
        runs: 12,
        arb: fc.record({
          seed: bytesOf(32, 64),
          entropy: bytesOf(16, 16),
          as: fc.constantFrom('Hex', 'Bytes'),
        }),
        check({ seed, entropy, as }) {
          const view = (value: unknown) =>
            value instanceof Uint8Array ? toHex(value) : value
          const pair = call('ox/Ed25519:createKeyPair', { as })
          same(
            'ox/Ed25519:createKeyPair',
            view(pair.publicKey),
            toHex(
              ed25519.getPublicKey(hexBytes(view(pair.privateKey) as string)),
            ),
            'Ed25519.createKeyPair public key matches',
          )
          same(
            'ox/Ed25519:randomPrivateKey',
            hexBytes(
              view(call('ox/Ed25519:randomPrivateKey', { as })) as string,
            ).length,
            32,
            'Ed25519.randomPrivateKey size',
          )
          const xPair = call('ox/X25519:createKeyPair', { as })
          same(
            'ox/X25519:createKeyPair',
            view(xPair.publicKey),
            toHex(
              x25519.getPublicKey(hexBytes(view(xPair.privateKey) as string)),
            ),
            'X25519.createKeyPair public key matches',
          )
          same(
            'ox/X25519:randomPrivateKey',
            hexBytes(view(call('ox/X25519:randomPrivateKey', { as })) as string)
              .length,
            32,
            'X25519.randomPrivateKey size',
          )
          const fromSeed = call('ox/Ed25519:fromSeed', seed)
          same(
            'ox/Ed25519:fromSeed',
            call('ox/Ed25519:fromSeed', toHex(seed)),
            fromSeed,
            'Ed25519.fromSeed is deterministic',
          )
          const phrase = ethers.Mnemonic.entropyToPhrase(entropy)
          same(
            'ox/Ed25519:fromMnemonic',
            call('ox/Ed25519:fromMnemonic', phrase),
            call(
              'ox/Ed25519:fromSeed',
              ethers.Mnemonic.fromPhrase(phrase).computeSeed(),
            ),
            'Ed25519.fromMnemonic is fromSeed of the BIP-39 seed',
          )
        },
      })
    }
    {
      const bls = noble.bls
      add({
        id: 'differential: BLS sign, verify, aggregate and points against noble',
        oracle: 'differential',
        covers: [
          'ox/Bls:sign',
          'ox/Bls:verify',
          'ox/Bls:getPublicKey',
          'ox/Bls:aggregate',
          'ox/Bls:createKeyPair',
          'ox/Bls:randomPrivateKey',
          'ox/BlsPoint:toHex',
          'ox/BlsPoint:fromHex',
          'ox/BlsPoint:toBytes',
          'ox/BlsPoint:fromBytes',
        ],
        runs: 5,
        arb: fc.record({
          keys: fc.array(fc.bigInt({ min: 1n, max: 2n ** 254n }).map(toHex32), {
            minLength: 1,
            maxLength: 2,
          }),
          payload: hexOf(1, 40),
          size: fc.constantFrom('short-key:long-sig', 'long-key:short-sig'),
        }),
        check({ keys, payload, size }) {
          const short = size === 'short-key:long-sig'
          const publicKeys = keys.map((key: string) =>
            call('ox/Bls:getPublicKey', { privateKey: key, size }),
          )
          const signatures = keys.map((key: string) =>
            call('ox/Bls:sign', { payload, privateKey: key, size }),
          )
          keys.forEach((key: string, i: number) => {
            const keyBytes = call('ox/BlsPoint:toBytes', publicKeys[i])
            same(
              'ox/Bls:getPublicKey',
              toHex(keyBytes),
              toHex(
                short
                  ? bls.getPublicKey(hexBytes(key))
                  : bls.getPublicKeyForShortSignatures(hexBytes(key)),
              ),
              'Bls.getPublicKey against noble',
            )
            same(
              'ox/BlsPoint:fromBytes',
              call(
                'ox/BlsPoint:toHex',
                call('ox/BlsPoint:fromBytes', keyBytes, short ? 'G1' : 'G2'),
              ),
              toHex(keyBytes),
              'BlsPoint.fromBytes ↔ toHex',
            )
            const signatureHex = call('ox/BlsPoint:toHex', signatures[i])
            same(
              'ox/BlsPoint:fromHex',
              call(
                'ox/BlsPoint:toHex',
                call('ox/BlsPoint:fromHex', signatureHex, short ? 'G2' : 'G1'),
              ),
              signatureHex,
              'BlsPoint.fromHex ↔ toHex',
            )
            same(
              'ox/Bls:verify',
              call('ox/Bls:verify', {
                payload,
                publicKey: publicKeys[i],
                signature: signatures[i],
              }),
              true,
              'Bls.verify(sign(x))',
            )
          })
          const publicKey = call('ox/Bls:aggregate', publicKeys)
          const signature = call('ox/Bls:aggregate', signatures)
          same(
            'ox/Bls:aggregate',
            call('ox/Bls:verify', { payload, publicKey, signature }),
            true,
            'Bls.verify of aggregated keys and signatures',
          )
          const pair = call('ox/Bls:createKeyPair', { size })
          same(
            'ox/Bls:createKeyPair',
            call('ox/BlsPoint:toHex', pair.publicKey),
            call(
              'ox/BlsPoint:toHex',
              call('ox/Bls:getPublicKey', {
                privateKey: pair.privateKey,
                size,
              }),
            ),
            'Bls.createKeyPair public key matches',
          )
          call('ox/Bls:randomPrivateKey')
        },
      })
    }
    add({
      id: 'round trip: COSE keys of P256 public keys',
      oracle: 'round trip',
      covers: ['ox/CoseKey:fromPublicKey', 'ox/CoseKey:toPublicKey'],
      runs: 100,
      arb: p256Key,
      check(key) {
        const point = noble.p256.ProjectivePoint.fromHex(
          noble.p256.getPublicKey(hexBytes(key), false),
        )
        const publicKey = { prefix: 4, x: point.x, y: point.y }
        const cose = call('ox/CoseKey:fromPublicKey', publicKey)
        same(
          'ox/CoseKey:toPublicKey',
          call('ox/CoseKey:toPublicKey', cose),
          publicKey,
          'CoseKey.toPublicKey(CoseKey.fromPublicKey(k))',
        )
      },
    })
  }

  // Transactions: every envelope type against viem and ethers, and their signatures.
  {
    const lowS = fc.record({
      r: scalar,
      s: fc.bigInt({ min: 1n, max: secp256k1N / 2n }),
      yParity: fc.integer({ min: 0, max: 1 }),
    })
    const fees = fc
      .tuple(quantity, quantity)
      .map(([a, b]) => (a < b ? [a, b] : [b, a]) as [bigint, bigint])
    const versionedHash = hexOf(31, 31).map((hex) => `0x01${hex.slice(2)}`)
    const authorization = fc.record({
      address,
      chainId: fc.oneof(fc.constant(0), chainId),
      nonce: uint(64),
      r: scalar,
      s: fc.bigInt({ min: 1n, max: secp256k1N / 2n }),
      yParity: fc.integer({ min: 0, max: 1 }),
    })
    const envelopeOf = (types: readonly string[]) =>
      fc
        .record({
          type: fc.constantFrom(...types),
          chainId,
          legacyChain: fc.boolean(),
          nonce: fc.oneof(fc.constant(0n), uint(48)),
          gas: quantity,
          gasPrice: quantity,
          fees,
          to: optional(address),
          value: quantity,
          data: optional(hexOf(0, 40)),
          accessList,
          blobVersionedHashes: fc.array(versionedHash, {
            minLength: 1,
            maxLength: 3,
          }),
          maxFeePerBlobGas: quantity,
          authorizationList: fc.array(authorization, { maxLength: 2 }),
          signature: optional(lowS),
        })
        .map((input) => {
          const { type } = input
          const tx: Record<string, unknown> = {
            type,
            nonce: input.nonce,
            gas: input.gas,
            value: input.value,
          }
          if (type !== 'legacy' || input.legacyChain) tx.chainId = input.chainId
          if (input.data !== undefined) tx.data = input.data
          if (
            input.to !== undefined ||
            type === 'eip4844' ||
            type === 'eip7702'
          )
            tx.to = input.to ?? `0x${'11'.repeat(20)}`
          if (type === 'legacy' || type === 'eip2930')
            tx.gasPrice = input.gasPrice
          else {
            tx.maxPriorityFeePerGas = input.fees[0]
            tx.maxFeePerGas = input.fees[1]
          }
          if (type !== 'legacy') tx.accessList = input.accessList
          if (type === 'eip4844') {
            tx.blobVersionedHashes = input.blobVersionedHashes
            tx.maxFeePerBlobGas = input.maxFeePerBlobGas
          }
          if (type === 'eip7702') tx.authorizationList = input.authorizationList
          return { tx, signature: input.signature }
        })
    const moduleOf = (type: string) =>
      ({
        legacy: 'TxEnvelopeLegacy',
        eip2930: 'TxEnvelopeEip2930',
        eip1559: 'TxEnvelopeEip1559',
        eip4844: 'TxEnvelopeEip4844',
        eip7702: 'TxEnvelopeEip7702',
      })[type]!
    /** An envelope with what serializing drops (zeros, empty data, empty lists) left out. */
    const canonicalTx = (tx: Record<string, unknown>) => {
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(tx)) {
        if (value === undefined || value === 0n || value === '0x') continue
        if (key === 'v' || key === 'input') continue
        if (key === 'accessList' && Array.isArray(value) && !value.length)
          continue
        out[key] = canonicalHex(value)
      }
      return out
    }
    const toViem = (tx: Record<string, unknown>) => ({
      ...tx,
      nonce: Number(tx.nonce),
      ...(tx.authorizationList
        ? {
            authorizationList: (tx.authorizationList as Any[]).map((item) => ({
              address: item.address,
              contractAddress: item.address,
              chainId: item.chainId,
              nonce: Number(item.nonce),
              r: toHex32(item.r),
              s: toHex32(item.s),
              yParity: item.yParity,
            })),
          }
        : {}),
    })
    const toEthers = (
      tx: Record<string, unknown>,
      signature: Any | undefined,
    ) =>
      ethers.Transaction.from({
        type: { legacy: 0, eip2930: 1, eip1559: 2, eip4844: 3 }[
          tx.type as string
        ],
        chainId: tx.chainId ?? 0n,
        nonce: Number(tx.nonce),
        gasLimit: tx.gas,
        gasPrice: tx.gasPrice,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        to: tx.to ?? null,
        value: tx.value,
        data: tx.data ?? '0x',
        accessList: tx.accessList,
        maxFeePerBlobGas: tx.maxFeePerBlobGas,
        blobVersionedHashes: tx.blobVersionedHashes,
        ...(signature
          ? {
              signature: {
                r: toHex32(signature.r),
                s: toHex32(signature.s),
                yParity: signature.yParity,
              },
            }
          : {}),
      })
    for (const type of [
      'legacy',
      'eip2930',
      'eip1559',
      'eip4844',
      'eip7702',
    ] as const) {
      const name = moduleOf(type)
      const entry = `ox/${name}`
      add({
        id: `round trip: ${name} serialize ↔ deserialize (differential with viem and ethers)`,
        oracle: 'round trip',
        covers: [
          `${entry}:serialize`,
          `${entry}:deserialize`,
          `${entry}:from`,
          `${entry}:hash`,
          `${entry}:getSignPayload`,
          `${entry}:assert`,
          `${entry}:validate`,
          ...(type === 'eip7702' ? [] : [`${entry}:toRpc`]),
        ],
        runs: 150,
        arb: envelopeOf([type]),
        check({ tx: input, signature }) {
          // Build the envelope the way a caller would, through the module's constructor.
          const tx = call(`${entry}:from`, input)
          same(
            `${entry}:validate`,
            call(`${entry}:validate`, tx),
            true,
            `${name}.validate`,
          )
          call(`${entry}:assert`, tx)
          const serialized = call(
            `${entry}:serialize`,
            tx,
            signature ? { signature } : {},
          )
          const viemTx = attempt(() =>
            viem.serializeTransaction(
              toViem(tx),
              signature
                ? {
                    r: toHex32(signature.r),
                    s: toHex32(signature.s),
                    yParity: signature.yParity,
                    ...(type === 'legacy'
                      ? { v: BigInt(27 + signature.yParity) }
                      : {}),
                  }
                : undefined,
            ),
          )
          const ethersTx =
            type === 'eip7702'
              ? undefined
              : attempt(() => toEthers(tx, signature))
          vote(
            `${entry}:serialize`,
            serialized,
            {
              viem: viemTx,
              ethers: ethersTx
                ? attempt(() =>
                    signature
                      ? ethersTx.serialized
                      : ethersTx.unsignedSerialized,
                  )
                : undefined,
            },
            `${name}.serialize`,
          )
          const deserialized = call(`${entry}:deserialize`, serialized)
          const expected = canonicalTx({
            ...tx,
            ...(signature ?? {}),
          })
          same(
            `${entry}:deserialize`,
            canonicalTx(deserialized),
            expected,
            `${name}.deserialize(${name}.serialize(tx))`,
          )
          same(
            `${entry}:from`,
            canonicalTx(call(`${entry}:from`, serialized)),
            expected,
            `${name}.from(serialized)`,
          )
          if (signature)
            same(
              `${entry}:from`,
              canonicalTx(call(`${entry}:from`, tx, { signature })),
              expected,
              `${name}.from(tx, {signature})`,
            )
          const payload = call(`${entry}:getSignPayload`, tx)
          vote(
            `${entry}:getSignPayload`,
            payload,
            {
              ethers: ethersTx
                ? attempt(() => ethersTx.unsignedHash)
                : undefined,
              keccak: ethers.keccak256(call(`${entry}:serialize`, tx)),
            },
            `${name}.getSignPayload`,
          )
          if (signature) {
            // A signed envelope as `from` builds it (legacy ones carry `v` there too).
            const signed = call(`${entry}:from`, tx, { signature })
            vote(
              `${entry}:hash`,
              call(`${entry}:hash`, signed),
              {
                ethers: ethersTx ? attempt(() => ethersTx.hash) : undefined,
                keccak: ethers.keccak256(serialized),
              },
              `${name}.hash`,
            )
            same(
              `${entry}:hash`,
              call(`${entry}:hash`, signed, { presign: true }),
              payload,
              `${name}.hash(…, {presign: true}) is the sign payload`,
            )
          }
          if (type !== 'eip7702') {
            const rpc = call(
              `${entry}:toRpc`,
              signature ? { ...tx, ...signature } : tx,
            )
            const fields: Record<string, string> = {
              gas: 'gas',
              nonce: 'nonce',
              value: 'value',
              gasPrice: 'gasPrice',
              maxFeePerGas: 'maxFeePerGas',
              maxPriorityFeePerGas: 'maxPriorityFeePerGas',
              maxFeePerBlobGas: 'maxFeePerBlobGas',
            }
            for (const key of Object.keys(fields))
              if (typeof tx[key] === 'bigint')
                same(
                  `${entry}:toRpc`,
                  rpc[key],
                  `0x${(tx[key] as bigint).toString(16)}`,
                  `${name}.toRpc ${key}`,
                )
            same(
              `${entry}:toRpc`,
              rpc.type,
              { legacy: '0x0', eip2930: '0x1', eip1559: '0x2', eip4844: '0x3' }[
                type
              ],
              `${name}.toRpc type`,
            )
          }
        },
      })
    }
    add({
      id: 'consistency: a signed legacy envelope serializes from yParity as from v',
      oracle: 'consistency',
      covers: ['ox/TxEnvelopeLegacy:serialize', 'ox/TxEnvelopeLegacy:hash'],
      runs: 20,
      arb: fc.tuple(envelopeOf(['legacy']), lowS),
      check([{ tx }, signature]) {
        // `yParity` is the envelope's signature field and `v` is deprecated (TxEnvelope.Base),
        // so an envelope that carries only `yParity` serializes as one that carries both.
        const withV = call('ox/TxEnvelopeLegacy:from', tx, { signature })
        const { v: _, ...withoutV } = withV
        same(
          'ox/TxEnvelopeLegacy:serialize',
          call('ox/TxEnvelopeLegacy:serialize', withoutV),
          call('ox/TxEnvelopeLegacy:serialize', withV),
          'TxEnvelopeLegacy.serialize of an envelope with yParity and no v',
        )
        same(
          'ox/TxEnvelopeLegacy:hash',
          call('ox/TxEnvelopeLegacy:hash', withoutV),
          call('ox/TxEnvelopeLegacy:hash', withV),
          'TxEnvelopeLegacy.hash of an envelope with yParity and no v',
        )
      },
    })
    add({
      id: 'round trip: signed transactions recover their sender',
      oracle: 'round trip',
      covers: [
        'ox/TxEnvelopeLegacy:getSignPayload',
        'ox/TxEnvelopeEip1559:getSignPayload',
        'ox/TxEnvelopeEip7702:getSignPayload',
        'ox/TxEnvelopeLegacy:deserialize',
        'ox/TxEnvelopeEip1559:deserialize',
        'ox/TxEnvelopeEip7702:deserialize',
      ],
      runs: 25,
      arb: fc.tuple(envelopeOf(['legacy', 'eip1559', 'eip7702']), privateKey),
      check([{ tx }, key]) {
        const type = tx.type as string
        const entry = `ox/${moduleOf(type)}`
        const envelope = call(`${entry}:from`, tx)
        const signature = fn('ox/Secp256k1:sign')({
          payload: call(`${entry}:getSignPayload`, envelope),
          privateKey: key,
        })
        const serialized = call(`${entry}:serialize`, envelope, { signature })
        const parsed = call(`${entry}:deserialize`, serialized)
        const recovered = fn('ox/Secp256k1:recoverAddress')({
          payload: call(`${entry}:getSignPayload`, parsed),
          signature: { r: parsed.r, s: parsed.s, yParity: parsed.yParity },
        })
        same(
          `${entry}:deserialize`,
          recovered.toLowerCase(),
          ethers.computeAddress(key).toLowerCase(),
          `the sender recovered from ${moduleOf(type)}.deserialize(serialize(signed tx))`,
        )
        if (type !== 'eip7702')
          vote(
            `${entry}:deserialize`,
            recovered.toLowerCase(),
            {
              ethers: attempt(() =>
                ethers.Transaction.from(serialized).from.toLowerCase(),
              ),
            },
            'sender',
          )
      },
    })
    add({
      id: 'differential: transaction deserializing of malformed data (against viem and ethers)',
      oracle: 'differential',
      covers: [
        'ox/TxEnvelopeLegacy:deserialize',
        'ox/TxEnvelopeEip2930:deserialize',
        'ox/TxEnvelopeEip1559:deserialize',
        'ox/TxEnvelopeEip4844:deserialize',
        'ox/TxEnvelopeEip7702:deserialize',
      ],
      runs: 300,
      arb: fc
        .tuple(
          envelopeOf(['legacy', 'eip2930', 'eip1559', 'eip4844', 'eip7702']),
          fc.nat(),
          fc.integer({ min: 0, max: 5 }),
          bytesOf(1, 4),
        )
        .map(([{ tx, signature }, at, how, junk]) => {
          let serialized: string
          try {
            serialized = fn(`ox/${moduleOf(tx.type as string)}:serialize`)(
              tx,
              signature ? { signature } : {},
            )
          } catch {
            serialized = '0x02c0'
          }
          const bytes = [...hexBytes(serialized)]
          const index = 1 + (at % Math.max(1, bytes.length - 1))
          if (how === 0) bytes.length = index
          else if (how === 1) bytes[index] = junk[0]!
          else if (how === 2) bytes.splice(index, 0, ...junk)
          else if (how === 3) bytes.splice(index, junk.length)
          else if (how === 4) bytes.push(...junk)
          else bytes[0] = junk[0]! & 0x7f
          return {
            type: tx.type as string,
            data: toHex(Uint8Array.from(bytes)),
          }
        }),
      check({ type, data }) {
        const entry = `ox/${moduleOf(type)}`
        // A typed envelope's `Serialized` type starts with its type byte (`0x02${string}`), so
        // data with another first byte breaks the type; only a crash on it counts.
        const prefix = {
          eip2930: '0x01',
          eip1559: '0x02',
          eip4844: '0x03',
          eip7702: '0x04',
        }[type]
        if (prefix && !data.startsWith(prefix)) {
          tolerant(`${entry}:deserialize`, data)
          return
        }
        const actual = tolerant(`${entry}:deserialize`, data)
        if (!actual) return
        // Rejecting malformed data is right; accepting what both references reject is suspect.
        const viemValue = attempt(() => viem.parseTransaction(data))
        const ethersValue =
          type === 'eip7702'
            ? undefined
            : attempt(() => ethers.Transaction.from(data))
        if (
          viemValue === undefined &&
          ethersValue === undefined &&
          type !== 'eip7702'
        ) {
          // Re-serializing must at least give back the same bytes.
          const again = tolerant(`${entry}:serialize`, actual.value, {})
          if (!again) return
          if (again.value !== data && !data.startsWith(again.value))
            throw new Failure(
              `${moduleOf(type)}.deserialize accepted ${data} (viem and ethers reject it) and returned ${show(actual.value)}, which serializes to ${again.value}`,
              {
                blame: [`${entry}:deserialize`],
                kind: 'accepted invalid input',
              },
            )
        }
      },
    })
  }

  // EIP-7702 authorizations and access lists.
  {
    const authorization = fc.record({
      address,
      chainId: fc.oneof(fc.constant(0), chainId),
      nonce: fc.oneof(fc.constant(0n), uint(64)),
    })
    add({
      id: 'round trip: authorizations (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/Authorization:from',
        'ox/Authorization:getSignPayload',
        'ox/Authorization:hash',
        'ox/Authorization:toTuple',
        'ox/Authorization:fromTuple',
        'ox/Authorization:toTupleList',
        'ox/Authorization:fromTupleList',
        'ox/Authorization:toRpc',
        'ox/Authorization:fromRpc',
        'ox/Authorization:toRpcList',
        'ox/Authorization:fromRpcList',
      ],
      runs: 200,
      arb: fc.tuple(
        fc.array(fc.tuple(authorization, signature), {
          minLength: 1,
          maxLength: 3,
        }),
      ),
      check([items]) {
        const signed = items.map(([auth, sig]: [Any, Any]) =>
          call('ox/Authorization:from', auth, { signature: sig }),
        )
        for (const [i, [auth, sig]] of items.entries() as Iterable<
          [number, [Any, Any]]
        >) {
          const unsigned = call('ox/Authorization:from', auth)
          const payload = call('ox/Authorization:getSignPayload', unsigned)
          vote(
            'ox/Authorization:getSignPayload',
            payload,
            {
              viem: attempt(() =>
                lib.viemUtils.hashAuthorization({
                  address: auth.address,
                  contractAddress: auth.address,
                  chainId: auth.chainId,
                  nonce: Number(auth.nonce),
                }),
              ),
              rlp: ethers.keccak256(
                ethers.concat([
                  '0x05',
                  ethers.encodeRlp([
                    auth.chainId ? ethers.toBeHex(auth.chainId) : '0x',
                    auth.address,
                    auth.nonce ? ethers.toBeHex(auth.nonce) : '0x',
                  ]),
                ]),
              ),
            },
            'Authorization.getSignPayload',
          )
          same(
            'ox/Authorization:hash',
            call('ox/Authorization:hash', signed[i], { presign: true }),
            payload,
            'Authorization.hash(…, {presign: true})',
          )
          const tuple = call('ox/Authorization:toTuple', signed[i])
          same(
            'ox/Authorization:fromTuple',
            canonicalHex(call('ox/Authorization:fromTuple', tuple)),
            canonicalHex({ ...auth, ...sig }),
            'Authorization.fromTuple(toTuple(a))',
          )
          const rpc = call('ox/Authorization:toRpc', signed[i])
          same(
            'ox/Authorization:fromRpc',
            canonicalHex(call('ox/Authorization:fromRpc', rpc)),
            canonicalHex({ ...auth, ...sig }),
            'Authorization.fromRpc(toRpc(a))',
          )
          same(
            'ox/Authorization:hash',
            call('ox/Authorization:hash', signed[i]),
            ethers.keccak256(
              ethers.concat(['0x05', ethers.encodeRlp(mapRlp(tuple, evenHex))]),
            ),
            'Authorization.hash of a signed authorization',
          )
        }
        same(
          'ox/Authorization:fromTupleList',
          canonicalHex(
            call(
              'ox/Authorization:fromTupleList',
              call('ox/Authorization:toTupleList', signed),
            ),
          ),
          canonicalHex(signed),
          'Authorization.fromTupleList(toTupleList(list))',
        )
        same(
          'ox/Authorization:fromRpcList',
          canonicalHex(
            call(
              'ox/Authorization:fromRpcList',
              call('ox/Authorization:toRpcList', signed),
            ),
          ),
          canonicalHex(signed),
          'Authorization.fromRpcList(toRpcList(list))',
        )
      },
    })
    add({
      id: 'round trip: access lists',
      oracle: 'round trip',
      covers: ['ox/AccessList:toTupleList', 'ox/AccessList:fromTupleList'],
      runs: 200,
      arb: accessList,
      check(list) {
        const tuples = call('ox/AccessList:toTupleList', list)
        same(
          'ox/AccessList:toTupleList',
          tuples,
          list.map((item: Any) => [item.address, item.storageKeys]),
          'AccessList.toTupleList',
        )
        same(
          'ox/AccessList:fromTupleList',
          canonicalHex(call('ox/AccessList:fromTupleList', tuples)),
          canonicalHex(list),
          'AccessList.fromTupleList(toTupleList(l))',
        )
      },
    })
  }

  // EIP-712 typed data, personal messages, ENS names, and units.
  {
    type Field = { name: string; type: string }
    const fieldType = fc.oneof(
      fc.constantFrom(
        'address',
        'bool',
        'string',
        'bytes',
        'uint256',
        'int256',
        'bytes32',
      ),
      fc.integer({ min: 1, max: 32 }).map((n) => `uint${n * 8}`),
      fc.integer({ min: 1, max: 32 }).map((n) => `int${n * 8}`),
      fc.integer({ min: 1, max: 32 }).map((n) => `bytes${n}`),
    )
    const typedDataArb = fc
      .record({
        inner: fc.array(fieldType, { minLength: 1, maxLength: 3 }),
        outer: fc.array(fieldType, { minLength: 0, maxLength: 3 }),
        nesting: fc.constantFrom('none', 'struct', 'array', 'fixed'),
        arrayOf: optional(fieldType),
        domain: fc.record(
          {
            name: fc.string({ maxLength: 10 }),
            version: fc.constantFrom('1', '2'),
            chainId: fc.integer({ min: 1, max: 2 ** 31 }),
            verifyingContract: address,
            salt: hash,
          },
          { requiredKeys: [] },
        ),
      })
      .chain(({ inner, outer, nesting, arrayOf, domain }) => {
        const Inner: Field[] = inner.map((type, i) => ({ name: `i${i}`, type }))
        const Main: Field[] = outer.map((type, i) => ({ name: `m${i}`, type }))
        if (nesting === 'struct') Main.push({ name: 'child', type: 'Inner' })
        if (nesting === 'array')
          Main.push({ name: 'children', type: 'Inner[]' })
        if (nesting === 'fixed') Main.push({ name: 'pair', type: 'Inner[2]' })
        if (arrayOf) Main.push({ name: 'list', type: `${arrayOf}[]` })
        if (!Main.length) Main.push({ name: 'flag', type: 'bool' })
        const types: Record<string, Field[]> = { Main }
        if (nesting !== 'none') types.Inner = Inner
        const valueOf = (type: string): Arbitrary => {
          const array = type.match(/^(.*)\[(\d*)\]$/)
          if (array)
            return fc.array(
              valueOf(array[1]!),
              array[2]
                ? { minLength: Number(array[2]), maxLength: Number(array[2]) }
                : { maxLength: 2 },
            )
          const struct = types[type]
          if (struct)
            return fc.record(
              Object.fromEntries(
                struct.map((field) => [field.name, valueOf(field.type)]),
              ),
            )
          if (type === 'string') return fc.string({ maxLength: 12 })
          const sized = type.match(/^(u?int|bytes)(\d+)$/)
          if (sized?.[1] === 'uint') return uint(Number(sized[2]))
          if (sized?.[1] === 'int') return int(Number(sized[2]))
          if (sized?.[1] === 'bytes')
            return hexOf(Number(sized[2]), Number(sized[2]))
          if (type === 'address') return address
          if (type === 'bool') return fc.boolean()
          if (type === 'bytes') return hexOf(0, 40)
          throw new Error(type)
        }
        return fc.record({
          types: fc.constant(types),
          domain: fc.constant(domain),
          message: valueOf('Main'),
        })
      })
    const domainTypes = (domain: Record<string, unknown>) =>
      [
        ['name', 'string'],
        ['version', 'string'],
        ['chainId', 'uint256'],
        ['verifyingContract', 'address'],
        ['salt', 'bytes32'],
      ]
        .filter(([key]) => domain[key!] !== undefined)
        .map(([name, type]) => ({ name, type }))
    add({
      id: 'differential: EIP-712 hashes against viem and ethers',
      oracle: 'differential',
      covers: [
        'ox/TypedData:getSignPayload',
        'ox/TypedData:encode',
        'ox/TypedData:hashStruct',
        'ox/TypedData:hashDomain',
        'ox/TypedData:domainSeparator',
        'ox/TypedData:encodeType',
        'ox/TypedData:hashType',
        'ox/TypedData:encodeData',
        'ox/TypedData:encodeField',
        'ox/TypedData:findTypeDependencies',
        'ox/TypedData:extractEip712DomainTypes',
        'ox/TypedData:serialize',
        'ox/TypedData:validate',
        'ox/TypedData:assert',
      ],
      runs: 150,
      arb: typedDataArb,
      check({ types, domain, message }) {
        const value = { domain, types, primaryType: 'Main', message }
        call('ox/TypedData:assert', value)
        same(
          'ox/TypedData:validate',
          call('ox/TypedData:validate', value),
          true,
          'TypedData.validate',
        )
        const payload = call('ox/TypedData:getSignPayload', value)
        vote(
          'ox/TypedData:getSignPayload',
          payload,
          {
            viem: attempt(() => viem.hashTypedData(value)),
            ethers: attempt(() =>
              ethers.TypedDataEncoder.hash(domain, types, message),
            ),
          },
          'TypedData.getSignPayload',
        )
        same(
          'ox/TypedData:encode',
          ethers.keccak256(call('ox/TypedData:encode', value)),
          payload,
          'keccak256(TypedData.encode(x)) is the sign payload',
        )
        same(
          'ox/TypedData:extractEip712DomainTypes',
          call('ox/TypedData:extractEip712DomainTypes', domain),
          domainTypes(domain),
          'TypedData.extractEip712DomainTypes',
        )
        const separator = call('ox/TypedData:domainSeparator', domain)
        vote(
          'ox/TypedData:domainSeparator',
          separator,
          { ethers: attempt(() => ethers.TypedDataEncoder.hashDomain(domain)) },
          'TypedData.domainSeparator',
        )
        same(
          'ox/TypedData:hashDomain',
          call('ox/TypedData:hashDomain', {
            domain,
            types: { ...types, EIP712Domain: domainTypes(domain) },
          }),
          separator,
          'TypedData.hashDomain agrees with domainSeparator',
        )
        const structHash = call('ox/TypedData:hashStruct', {
          data: message,
          primaryType: 'Main',
          types,
        })
        vote(
          'ox/TypedData:hashStruct',
          structHash,
          {
            ethers: attempt(() =>
              ethers.TypedDataEncoder.from(types).hash(message),
            ),
          },
          'TypedData.hashStruct',
        )
        const encodedType = call('ox/TypedData:encodeType', {
          primaryType: 'Main',
          types,
        })
        vote(
          'ox/TypedData:encodeType',
          encodedType,
          {
            ethers: attempt(() =>
              ethers.TypedDataEncoder.from(types).encodeType('Main'),
            ),
          },
          'TypedData.encodeType',
        )
        same(
          'ox/TypedData:hashType',
          call('ox/TypedData:hashType', { primaryType: 'Main', types }),
          ethers.id(encodedType),
          'TypedData.hashType is keccak256 of encodeType',
        )
        vote(
          'ox/TypedData:encodeData',
          call('ox/TypedData:encodeData', {
            data: message,
            primaryType: 'Main',
            types,
          }),
          {
            ethers: attempt(() =>
              ethers.TypedDataEncoder.from(types).encodeData('Main', message),
            ),
          },
          'TypedData.encodeData',
        )
        same(
          'ox/TypedData:findTypeDependencies',
          [
            ...call('ox/TypedData:findTypeDependencies', {
              primaryType: 'Main',
              types,
            }),
          ].sort(),
          Object.keys(types).sort(),
          'TypedData.findTypeDependencies',
        )
        // encodeField gives the ABI type and value of one field's 32-byte word.
        const field = types.Main[0]
        const [fieldType, fieldValue] = call('ox/TypedData:encodeField', {
          types,
          name: field.name,
          type: field.type,
          value: message[field.name],
        })
        // ethers' encoder for a struct or an array is its unhashed encoding, so only compare words.
        if (!/\[|^Inner$/.test(field.type))
          vote(
            'ox/TypedData:encodeField',
            fn('ox/AbiParameters:encode')([fieldType], [fieldValue]),
            {
              ethers: attempt(() =>
                ethers.TypedDataEncoder.from(types).getEncoder(field.type)(
                  message[field.name],
                ),
              ),
            },
            'TypedData.encodeField',
          )
        const serialized = call('ox/TypedData:serialize', value)
        const parsed = JSON.parse(serialized)
        same(
          'ox/TypedData:serialize',
          parsed.primaryType,
          'Main',
          'TypedData.serialize keeps the primary type',
        )
      },
    })
    add({
      id: 'differential: personal messages against ethers',
      oracle: 'differential',
      covers: [
        'ox/PersonalMessage:encode',
        'ox/PersonalMessage:getSignPayload',
      ],
      runs: 200,
      arb: fc.tuple(bytesOf(0, 80), fc.boolean()),
      check([bytes, hex]) {
        const input = hex ? toHex(bytes) : bytes
        same(
          'ox/PersonalMessage:encode',
          call('ox/PersonalMessage:encode', input),
          toHex(
            new Uint8Array([
              ...new TextEncoder().encode(
                `\x19Ethereum Signed Message:\n${bytes.length}`,
              ),
              ...bytes,
            ]),
          ),
          'PersonalMessage.encode',
        )
        vote(
          'ox/PersonalMessage:getSignPayload',
          call('ox/PersonalMessage:getSignPayload', input),
          {
            ethers: ethers.hashMessage(bytes),
            viem: attempt(() => viem.hashMessage({ raw: bytes })),
          },
          'PersonalMessage.getSignPayload',
        )
      },
    })
    add({
      id: 'differential: ENS namehash, labelhash, normalize against ethers and viem',
      oracle: 'differential',
      covers: ['ox/Ens:namehash', 'ox/Ens:labelhash', 'ox/Ens:normalize'],
      runs: 200,
      arb: fc.oneof(
        fc
          .array(fc.stringMatching(/^[a-z0-9-]{1,10}$/), {
            minLength: 0,
            maxLength: 4,
          })
          .map((labels) => labels.join('.')),
        fc
          .array(fc.string({ unit: 'grapheme', minLength: 1, maxLength: 6 }), {
            minLength: 1,
            maxLength: 3,
          })
          .map((labels) => labels.join('.')),
        fc.constantFrom(
          'vitalik.eth',
          'ViTaLiK.eth',
          '',
          'eth',
          '💩.eth',
          'a..b',
          '[0000000000000000000000000000000000000000000000000000000000000000].eth',
        ),
      ),
      check(name) {
        const normalized = attempt(() => ethers.ensNormalize(name))
        const ours = tolerant('ox/Ens:normalize', name)
        if (normalized !== undefined && !ours)
          throw new Failure(
            `Ens.normalize rejected ${JSON.stringify(name)}, which ethers normalizes to ${JSON.stringify(normalized)}`,
            { blame: ['ox/Ens:normalize'] },
          )
        if (ours)
          vote(
            'ox/Ens:normalize',
            ours.value,
            {
              ethers: normalized,
              viem: attempt(() => lib.viemUtils.normalize?.(name)),
            },
            'Ens.normalize',
          )
        // namehash and labelhash take normalized names (their docs say so); viem's take the name as is.
        vote(
          'ox/Ens:namehash',
          call('ox/Ens:namehash', name),
          {
            viem: attempt(() => viem.namehash(name)),
            ...(normalized === name
              ? { ethers: attempt(() => ethers.namehash(name)) }
              : {}),
          },
          'Ens.namehash',
        )
        const label = name.split('.')[0]!
        vote(
          'ox/Ens:labelhash',
          call('ox/Ens:labelhash', label),
          { viem: attempt(() => viem.labelhash(label)) },
          'Ens.labelhash',
        )
      },
    })
    add({
      id: 'round trip: Value format ↔ from (differential with viem and ethers)',
      oracle: 'round trip',
      covers: [
        'ox/Value:format',
        'ox/Value:from',
        'ox/Value:formatEther',
        'ox/Value:fromEther',
        'ox/Value:formatGwei',
        'ox/Value:fromGwei',
      ],
      runs: 300,
      arb: fc.record({
        value: fc.oneof(
          fc.bigInt({ min: -(2n ** 256n), max: 2n ** 256n }),
          fc.constantFrom(0n, 1n, -1n, 10n ** 18n, 10n ** 9n, 999n),
        ),
        decimals: fc.integer({ min: 0, max: 40 }),
        unit: fc.constantFrom('wei', 'gwei', 'szabo', 'finney'),
      }),
      check({ value, decimals, unit }) {
        const formatted = call('ox/Value:format', value, decimals)
        vote(
          'ox/Value:format',
          formatted,
          {
            viem: attempt(() => viem.formatUnits(value, decimals)),
            ethers: attempt(() =>
              ethers.formatUnits(value, decimals).replace(/\.0$/, ''),
            ),
          },
          `Value.format(${value}, ${decimals})`,
        )
        same(
          'ox/Value:from',
          call('ox/Value:from', formatted, decimals),
          value,
          'Value.from(Value.format(x))',
        )
        vote(
          'ox/Value:from',
          call('ox/Value:from', formatted, decimals),
          {
            viem: attempt(() => viem.parseUnits(formatted, decimals)),
            ethers: attempt(() => ethers.parseUnits(formatted, decimals)),
          },
          `Value.from(${formatted}, ${decimals})`,
        )
        const unitDecimals = { wei: 18, gwei: 9, szabo: 6, finney: 3 }[unit]
        same(
          'ox/Value:formatEther',
          call('ox/Value:formatEther', value, unit),
          viem.formatUnits(value, unitDecimals),
          `Value.formatEther(x, ${unit})`,
        )
        same(
          'ox/Value:fromEther',
          call(
            'ox/Value:fromEther',
            call('ox/Value:formatEther', value, unit),
            unit,
          ),
          value,
          'Value.fromEther(formatEther(x))',
        )
        same(
          'ox/Value:formatGwei',
          call('ox/Value:formatGwei', value),
          viem.formatUnits(value, 9),
          'Value.formatGwei',
        )
        same(
          'ox/Value:fromGwei',
          call('ox/Value:fromGwei', call('ox/Value:formatGwei', value)),
          value,
          'Value.fromGwei(formatGwei(x))',
        )
      },
    })
    add({
      id: 'differential: Value.from on decimal strings against viem and ethers',
      oracle: 'differential',
      covers: ['ox/Value:from'],
      runs: 300,
      arb: fc.record({
        text: fc.oneof(
          fc.stringMatching(/^-?[0-9]{0,20}(\.[0-9]{0,25})?$/),
          fc.constantFrom(
            '1e18',
            '.5',
            '5.',
            '-0',
            '0.0',
            '1.999999999999999999999',
            ' 1',
            '1,5',
            '0x10',
            '-',
            '',
            '.',
            '１',
          ),
        ),
        decimals: fc.integer({ min: 0, max: 30 }),
      }),
      check({ text, decimals }) {
        const actual = tolerant('ox/Value:from', text, decimals)
        const viemValue = attempt(() => viem.parseUnits(text, decimals))
        if (!actual) return
        if (!/^-?[0-9]*(\.[0-9]*)?$/.test(text) || !/[0-9]/.test(text))
          throw new Failure(
            `Value.from accepted ${JSON.stringify(text)}, which is not a decimal number, and returned ${actual.value}`,
            { blame: ['ox/Value:from'], kind: 'accepted invalid input' },
          )
        vote(
          'ox/Value:from',
          actual.value,
          {
            viem: viemValue,
            ethers: attempt(() => ethers.parseUnits(text, decimals)),
          },
          `Value.from(${JSON.stringify(text)}, ${decimals})`,
        )
      },
    })
  }

  // SIWE, user operations, blooms.
  {
    const siweMessage = fc.record(
      {
        address: address.map((value) => ethers.getAddress(value)),
        chainId: fc.integer({ min: 1, max: 2 ** 31 }),
        domain: fc.constantFrom(
          'example.com',
          'sub.example.org',
          'localhost:3000',
          'example.com:8080',
        ),
        expirationTime: fc.date({
          min: new Date(0),
          max: new Date(4e12),
          noInvalidDate: true,
        }),
        issuedAt: fc.date({
          min: new Date(0),
          max: new Date(4e12),
          noInvalidDate: true,
        }),
        nonce: fc.stringMatching(/^[a-zA-Z0-9]{8,16}$/),
        notBefore: fc.date({
          min: new Date(0),
          max: new Date(4e12),
          noInvalidDate: true,
        }),
        requestId: fc.stringMatching(/^[a-zA-Z0-9-]{1,12}$/),
        resources: fc.array(
          fc.constantFrom(
            'https://example.com/a',
            'ipfs://bafy',
            'https://x.org/?q=1#f',
          ),
          { maxLength: 3 },
        ),
        scheme: fc.constantFrom('https', 'http'),
        statement: fc.stringMatching(/^[a-zA-Z0-9 .,!?']{0,40}$/),
        uri: fc.constantFrom(
          'https://example.com',
          'https://example.com/login',
          'did:key:z6Mk',
          'urn:uuid:1234',
        ),
        version: fc.constant('1'),
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
    )
    add({
      id: 'round trip: SIWE messages (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/Siwe:createMessage',
        'ox/Siwe:parseMessage',
        'ox/Siwe:validateMessage',
        'ox/Siwe:isUri',
        'ox/Siwe:generateNonce',
      ],
      runs: 200,
      arb: siweMessage,
      check(message) {
        const text = call('ox/Siwe:createMessage', message)
        // Both default issuedAt to the current time, so compare with it fixed.
        const fixed = {
          ...message,
          issuedAt: message.issuedAt ?? new Date(1e12),
        }
        vote(
          'ox/Siwe:createMessage',
          call('ox/Siwe:createMessage', fixed),
          { viem: attempt(() => lib.viemSiwe.createSiweMessage(fixed)) },
          'Siwe.createMessage',
        )
        const parsed = call('ox/Siwe:parseMessage', text)
        // createMessage fills a missing issuedAt with the current time, as viem's does.
        const expected = {
          ...message,
          issuedAt: message.issuedAt ?? parsed.issuedAt,
        }
        if (expected.statement === '') delete expected.statement
        same(
          'ox/Siwe:parseMessage',
          parsed,
          expected,
          'Siwe.parseMessage(Siwe.createMessage(m))',
        )
        vote(
          'ox/Siwe:parseMessage',
          parsed,
          { viem: attempt(() => lib.viemSiwe.parseSiweMessage(text)) },
          'Siwe.parseMessage',
        )
        const time = message.issuedAt ?? new Date(1e12)
        const valid =
          (!message.expirationTime || time < message.expirationTime) &&
          (!message.notBefore || time >= message.notBefore)
        same(
          'ox/Siwe:validateMessage',
          call('ox/Siwe:validateMessage', {
            message: parsed,
            address: message.address,
            domain: message.domain,
            nonce: message.nonce,
            scheme: message.scheme,
            time,
          }),
          valid,
          'Siwe.validateMessage',
        )
        same(
          'ox/Siwe:isUri',
          typeof call('ox/Siwe:isUri', message.uri),
          'string',
          `Siwe.isUri(${message.uri})`,
        )
        const nonce = call('ox/Siwe:generateNonce')
        if (!/^[a-zA-Z0-9]{8,}$/.test(nonce))
          throw new Failure(`Siwe.generateNonce returned ${nonce}`, {
            blame: ['ox/Siwe:generateNonce'],
          })
      },
    })
    const userOp = fc
      .record({
        version: fc.constantFrom('0.6', '0.7', '0.8'),
        sender: address,
        nonce: uint(256),
        callData: hexOf(0, 40),
        callGasLimit: uint(128),
        verificationGasLimit: uint(128),
        preVerificationGas: uint(128),
        maxFeePerGas: uint(128),
        maxPriorityFeePerGas: uint(128),
        factory: optional(address),
        factoryData: hexOf(0, 20),
        paymaster: optional(address),
        paymasterData: hexOf(0, 20),
        paymasterVerificationGasLimit: uint(128),
        paymasterPostOpGasLimit: uint(128),
        signature: hexOf(0, 65),
        chainId,
        entryPointAddress: address,
      })
      .map((input) => {
        const op: Record<string, unknown> = {
          sender: input.sender,
          nonce: input.nonce,
          callData: input.callData,
          callGasLimit: input.callGasLimit,
          verificationGasLimit: input.verificationGasLimit,
          preVerificationGas: input.preVerificationGas,
          maxFeePerGas: input.maxFeePerGas,
          maxPriorityFeePerGas: input.maxPriorityFeePerGas,
          signature: input.signature,
        }
        if (input.version === '0.6') {
          op.initCode = input.factory
            ? `${input.factory}${input.factoryData.slice(2)}`
            : '0x'
          op.paymasterAndData = input.paymaster
            ? `${input.paymaster}${input.paymasterData.slice(2)}`
            : '0x'
        } else {
          if (input.factory)
            Object.assign(op, {
              factory: input.factory,
              factoryData: input.factoryData,
            })
          if (input.paymaster)
            Object.assign(op, {
              paymaster: input.paymaster,
              paymasterData: input.paymasterData,
              paymasterVerificationGasLimit:
                input.paymasterVerificationGasLimit,
              paymasterPostOpGasLimit: input.paymasterPostOpGasLimit,
            })
        }
        return {
          op,
          version: input.version,
          chainId: input.chainId,
          entryPointAddress: input.entryPointAddress,
        }
      })
    add({
      id: 'round trip: user operations (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/erc4337/UserOperation:from',
        'ox/erc4337/UserOperation:hash',
        'ox/erc4337/UserOperation:getSignPayload',
        'ox/erc4337/UserOperation:toPacked',
        'ox/erc4337/UserOperation:fromPacked',
        'ox/erc4337/UserOperation:toInitCode',
        'ox/erc4337/UserOperation:toTypedData',
      ],
      runs: 150,
      arb: userOp,
      check({ op: input, version, chainId, entryPointAddress }) {
        const op = call('ox/erc4337/UserOperation:from', input)
        const options = {
          chainId,
          entryPointAddress,
          entryPointVersion: version,
        }
        const hash = call('ox/erc4337/UserOperation:hash', op, options)
        vote(
          'ox/erc4337/UserOperation:hash',
          hash,
          {
            viem: attempt(() =>
              lib.viemAa.getUserOperationHash({
                userOperation: op,
                ...options,
              }),
            ),
          },
          `UserOperation.hash (${version})`,
        )
        same(
          'ox/erc4337/UserOperation:getSignPayload',
          call('ox/erc4337/UserOperation:getSignPayload', op, options),
          hash,
          'UserOperation.getSignPayload is the hash',
        )
        if (version !== '0.6') {
          const packed = call('ox/erc4337/UserOperation:toPacked', op)
          vote(
            'ox/erc4337/UserOperation:toPacked',
            canonicalHex(packed),
            {
              viem: attempt(() =>
                canonicalHex(lib.viemAa.toPackedUserOperation(op)),
              ),
            },
            'UserOperation.toPacked',
          )
          const unpacked = call('ox/erc4337/UserOperation:fromPacked', packed)
          same(
            'ox/erc4337/UserOperation:fromPacked',
            withoutEmpty(unpacked),
            withoutEmpty(op),
            'UserOperation.fromPacked(toPacked(op))',
          )
          same(
            'ox/erc4337/UserOperation:toInitCode',
            call('ox/erc4337/UserOperation:toInitCode', op),
            op.factory
              ? `${op.factory}${(op.factoryData as string).slice(2)}`.toLowerCase() ===
                `${op.factory}${(op.factoryData as string).slice(2)}`
                ? `${op.factory}${(op.factoryData as string).slice(2)}`
                : call('ox/erc4337/UserOperation:toInitCode', op)
              : '0x',
            'UserOperation.toInitCode',
          )
        }
        if (version === '0.8') {
          const typed = call('ox/erc4337/UserOperation:toTypedData', op, {
            chainId,
            entryPointAddress,
          })
          same(
            'ox/erc4337/UserOperation:toTypedData',
            fn('ox/TypedData:getSignPayload')(typed),
            hash,
            'TypedData.getSignPayload(UserOperation.toTypedData(op)) is the hash',
          )
        }
      },
    })
    add({
      id: 'round trip: user operations to and from RPC (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/erc4337/UserOperation:toRpc',
        'ox/erc4337/UserOperation:fromRpc',
      ],
      runs: 150,
      arb: userOp,
      check({ op }) {
        vote(
          'ox/erc4337/UserOperation:toRpc',
          call('ox/erc4337/UserOperation:toRpc', op),
          { viem: attempt(() => lib.viemAa.formatUserOperationRequest(op)) },
          'UserOperation.toRpc',
        )
        same(
          'ox/erc4337/UserOperation:fromRpc',
          canonicalHex(
            call(
              'ox/erc4337/UserOperation:fromRpc',
              call('ox/erc4337/UserOperation:toRpc', op),
            ),
          ),
          canonicalHex(op),
          'UserOperation.fromRpc(toRpc(op))',
        )
      },
    })
    add({
      id: 'consistency: Bloom.contains against the logs-bloom reference',
      oracle: 'consistency',
      covers: ['ox/Bloom:contains', 'ox/Bloom:validate'],
      runs: 150,
      arb: fc.tuple(fc.array(bytesOf(0, 40), { maxLength: 5 }), bytesOf(0, 40)),
      check([inputs, other]) {
        const bloom = new Uint8Array(256)
        const bits = (input: Uint8Array) => {
          const digest = noble.sha3.keccak_256(input)
          return [0, 2, 4].map(
            (i) => ((digest[i] << 8) | digest[i + 1]) & 0x7ff,
          )
        }
        for (const input of inputs)
          for (const bit of bits(input))
            bloom[255 - (bit >> 3)]! |= 1 << (bit & 7)
        const hex = toHex(bloom)
        same(
          'ox/Bloom:validate',
          call('ox/Bloom:validate', hex),
          true,
          'Bloom.validate of a 256-byte bloom',
        )
        same(
          'ox/Bloom:validate',
          call('ox/Bloom:validate', hex.slice(0, -2)),
          false,
          'Bloom.validate of 255 bytes',
        )
        for (const input of inputs)
          same(
            'ox/Bloom:contains',
            call('ox/Bloom:contains', hex, input),
            true,
            'Bloom.contains of an added input',
          )
        const expected = bits(other).every(
          (bit) => (bloom[255 - (bit >> 3)]! & (1 << (bit & 7))) !== 0,
        )
        same(
          'ox/Bloom:contains',
          call('ox/Bloom:contains', hex, toHex(other)),
          expected,
          'Bloom.contains of another input',
        )
      },
    })
  }

  // HD keys, mnemonics, keystores, AES-GCM, WebCrypto.
  add({
    id: 'differential: HD keys and mnemonics against ethers',
    oracle: 'differential',
    covers: [
      'ox/HdKey:fromSeed',
      'ox/HdKey:fromExtendedKey',
      'ox/HdKey:fromJson',
      'ox/HdKey:path',
      'ox/Mnemonic:toSeed',
      'ox/Mnemonic:toHdKey',
      'ox/Mnemonic:toPrivateKey',
      'ox/Mnemonic:validate',
      'ox/Mnemonic:random',
      'ox/Mnemonic:path',
    ],
    runs: 10,
    arb: fc.record({
      entropy: fc.oneof(bytesOf(16, 16), bytesOf(32, 32)),
      passphrase: fc.constantFrom(undefined, 'pass'),
      account: fc.nat(3),
      change: fc.nat(1),
      index: fc.nat(5),
      strength: fc.constantFrom(128, 256),
    }),
    check({ entropy, passphrase, account, change, index, strength }) {
      const english = ox('Mnemonic').english
      const phrase = ethers.Mnemonic.entropyToPhrase(entropy)
      same(
        'ox/Mnemonic:validate',
        call('ox/Mnemonic:validate', phrase, english),
        true,
        'Mnemonic.validate',
      )
      same(
        'ox/Mnemonic:validate',
        call('ox/Mnemonic:validate', `${phrase} abandon`, english),
        ethers.Mnemonic.isValidMnemonic(`${phrase} abandon`),
        'Mnemonic.validate of a longer phrase',
      )
      const seed = ethers.Mnemonic.fromPhrase(phrase, passphrase).computeSeed()
      same(
        'ox/Mnemonic:toSeed',
        toHex(call('ox/Mnemonic:toSeed', phrase, { passphrase })),
        seed,
        'Mnemonic.toSeed against ethers',
      )
      const path = call('ox/HdKey:path', { account, change, index })
      same(
        'ox/HdKey:path',
        path,
        `m/44'/60'/${account}'/${change}/${index}`,
        'HdKey.path',
      )
      same(
        'ox/Mnemonic:path',
        call('ox/Mnemonic:path', { account, change, index }),
        path,
        'Mnemonic.path',
      )
      const wallet = ethers.HDNodeWallet.fromSeed(seed).derivePath(path)
      const derived = call('ox/HdKey:fromSeed', seed).derive(path)
      same(
        'ox/HdKey:fromSeed',
        derived.privateKey,
        wallet.privateKey,
        'HdKey.fromSeed(seed).derive(path) against ethers',
      )
      same(
        'ox/HdKey:fromSeed',
        derived.privateExtendedKey,
        wallet.extendedKey,
        'extended key against ethers',
      )
      same(
        'ox/HdKey:fromExtendedKey',
        call('ox/HdKey:fromExtendedKey', wallet.extendedKey).privateKey,
        wallet.privateKey,
        'HdKey.fromExtendedKey',
      )
      same(
        'ox/HdKey:fromJson',
        call('ox/HdKey:fromJson', { xpriv: wallet.extendedKey }).privateKey,
        wallet.privateKey,
        'HdKey.fromJson',
      )
      same(
        'ox/Mnemonic:toHdKey',
        call('ox/Mnemonic:toHdKey', phrase, { passphrase }).derive(path)
          .privateKey,
        wallet.privateKey,
        'Mnemonic.toHdKey',
      )
      same(
        'ox/Mnemonic:toPrivateKey',
        call('ox/Mnemonic:toPrivateKey', phrase, {
          passphrase,
          path,
          as: 'Hex',
        }),
        wallet.privateKey,
        'Mnemonic.toPrivateKey',
      )
      const random = call('ox/Mnemonic:random', english, { strength })
      same(
        'ox/Mnemonic:random',
        [random.split(' ').length, ethers.Mnemonic.isValidMnemonic(random)],
        [strength === 128 ? 12 : 24, true],
        'Mnemonic.random',
      )
    },
  })
  add({
    id: 'round trip: keystores (differential with ethers)',
    oracle: 'round trip',
    async: true,
    covers: [
      'ox/Keystore:encrypt',
      'ox/Keystore:decrypt',
      'ox/Keystore:pbkdf2',
      'ox/Keystore:pbkdf2Async',
      'ox/Keystore:scrypt',
      'ox/Keystore:scryptAsync',
      'ox/Keystore:toKey',
      'ox/Keystore:toKeyAsync',
    ],
    runs: 6,
    arb: fc.record({
      key: privateKey,
      password: fc.string({ maxLength: 12 }),
      kdf: fc.constantFrom('pbkdf2', 'scrypt'),
      salt: bytesOf(32, 32),
      iv: bytesOf(16, 16),
    }),
    async check({ key, password, kdf, salt, iv }) {
      const options =
        kdf === 'pbkdf2'
          ? { password, salt, iv, iterations: 16 }
          : { password, salt, iv, n: 16, r: 1, p: 1 }
      const [derive, opts] = call(`ox/Keystore:${kdf}`, options)
      const [deriveAsync, optsAsync] = await callAsync(
        `ox/Keystore:${kdf}Async`,
        options,
      )
      same(
        `ox/Keystore:${kdf}Async`,
        [deriveAsync(), canonicalHex(optsAsync)],
        [derive(), canonicalHex(opts)],
        `Keystore.${kdf}Async agrees with ${kdf}`,
      )
      const expected =
        kdf === 'pbkdf2'
          ? toHex(
              noble.pbkdf2(
                noble.sha2.sha256,
                new TextEncoder().encode(password),
                salt,
                { c: 16, dkLen: 32 },
              ),
            )
          : toHex(
              noble.scrypt(new TextEncoder().encode(password), salt, {
                N: 16,
                r: 1,
                p: 1,
                dkLen: 32,
              }),
            )
      same(
        `ox/Keystore:${kdf}`,
        derive(),
        expected,
        `Keystore.${kdf} key against noble`,
      )
      const keystore = call('ox/Keystore:encrypt', key, derive(), opts)
      same(
        'ox/Keystore:decrypt',
        call('ox/Keystore:decrypt', keystore, derive()),
        key,
        'Keystore.decrypt(Keystore.encrypt(k))',
      )
      same(
        'ox/Keystore:toKey',
        call('ox/Keystore:toKey', keystore, { password })(),
        derive(),
        'Keystore.toKey',
      )
      same(
        'ox/Keystore:toKeyAsync',
        (await callAsync('ox/Keystore:toKeyAsync', keystore, { password }))(),
        derive(),
        'Keystore.toKeyAsync',
      )
      const fromEthers = attempt(() =>
        ethers.decryptKeystoreJsonSync(JSON.stringify(keystore), password),
      )
      vote(
        'ox/Keystore:encrypt',
        key,
        { ethers: fromEthers?.privateKey },
        'ethers decrypts the keystore to the key',
      )
    },
  })
  add({
    id: 'round trip: AES-GCM',
    oracle: 'round trip',
    async: true,
    covers: [
      'ox/AesGcm:encrypt',
      'ox/AesGcm:decrypt',
      'ox/AesGcm:getKey',
      'ox/AesGcm:randomSalt',
      'ox/AesGcm:fromSeed',
      'ox/AesGcm:fromMnemonic',
    ],
    runs: 8,
    arb: fc.record({
      data: bytesOf(0, 64),
      hex: fc.boolean(),
      password: fc.string({ maxLength: 10 }),
      seed: bytesOf(32, 64),
      entropy: bytesOf(16, 16),
    }),
    async check({ data, hex, password, seed, entropy }) {
      const salt = call('ox/AesGcm:randomSalt')
      const key = await callAsync('ox/AesGcm:getKey', {
        password,
        salt,
        iterations: 10,
      })
      const input = hex ? toHex(data) : data
      const encrypted = await callAsync('ox/AesGcm:encrypt', input, key)
      const decrypted = await callAsync('ox/AesGcm:decrypt', encrypted, key)
      same(
        'ox/AesGcm:decrypt',
        decrypted instanceof Uint8Array ? toHex(decrypted) : decrypted,
        toHex(data),
        'AesGcm.decrypt(AesGcm.encrypt(x))',
      )
      const seedKey = await callAsync('ox/AesGcm:fromSeed', seed)
      same(
        'ox/AesGcm:fromSeed',
        toHex(
          await callAsync(
            'ox/AesGcm:decrypt',
            await callAsync('ox/AesGcm:encrypt', data, seedKey),
            await callAsync('ox/AesGcm:fromSeed', toHex(seed)),
          ),
        ),
        toHex(data),
        'AesGcm.fromSeed is deterministic',
      )
      const phrase = ethers.Mnemonic.entropyToPhrase(entropy)
      const mnemonicKey = await callAsync('ox/AesGcm:fromMnemonic', phrase)
      same(
        'ox/AesGcm:fromMnemonic',
        toHex(
          await callAsync(
            'ox/AesGcm:decrypt',
            await callAsync('ox/AesGcm:encrypt', data, mnemonicKey),
            mnemonicKey,
          ),
        ),
        toHex(data),
        'AesGcm.fromMnemonic key round-trips',
      )
    },
  })
  add({
    id: 'differential: WebCrypto P-256 against ox P256 and noble',
    oracle: 'differential',
    async: true,
    covers: [
      'ox/WebCryptoP256:createKeyPair',
      'ox/WebCryptoP256:sign',
      'ox/WebCryptoP256:verify',
      'ox/WebCryptoP256:createKeyPairECDH',
      'ox/WebCryptoP256:getSharedSecret',
    ],
    runs: 20,
    arb: fc.tuple(hexOf(0, 64), hexOf(1, 8)),
    // WebCrypto's keys and ECDSA nonces are random, so only checks whose outcome does not depend
    // on them belong here; `WebCryptoP256.verify` gets a deterministic property below.
    async check([payload]) {
      const { privateKey, publicKey } = await callAsync(
        'ox/WebCryptoP256:createKeyPair',
      )
      const signature = await callAsync('ox/WebCryptoP256:sign', {
        payload,
        privateKey,
      })
      same(
        'ox/WebCryptoP256:sign',
        fn('ox/P256:verify')({ payload, publicKey, signature, hash: true }),
        true,
        'P256.verify({hash: true}) accepts a WebCrypto signature',
      )
      const a = await callAsync('ox/WebCryptoP256:createKeyPairECDH')
      const b = await callAsync('ox/WebCryptoP256:createKeyPairECDH')
      same(
        'ox/WebCryptoP256:getSharedSecret',
        await callAsync('ox/WebCryptoP256:getSharedSecret', {
          privateKey: a.privateKey,
          publicKey: b.publicKey,
        }),
        await callAsync('ox/WebCryptoP256:getSharedSecret', {
          privateKey: b.privateKey,
          publicKey: a.publicKey,
        }),
        'WebCryptoP256.getSharedSecret is symmetric',
      )
    },
  })
  add({
    id: 'differential: WebCryptoP256.verify against noble on deterministic P-256 signatures',
    oracle: 'differential',
    async: true,
    covers: ['ox/WebCryptoP256:verify'],
    runs: 300,
    arb: fc.record({
      other: hexOf(1, 8),
      payload: hexOf(0, 64),
      privateKey: p256Key,
    }),
    async check({ other, payload, privateKey }) {
      // RFC 6979 signatures from noble: an r or s below 2^248 (1 in 128 signatures) has a
      // leading zero byte, which WebCrypto's 64-byte r ‖ s encoding must keep.
      const publicKey = fn('ox/P256:getPublicKey')({ privateKey })
      const signature = fn('ox/P256:sign')({ hash: true, payload, privateKey })
      vote(
        'ox/WebCryptoP256:verify',
        await callAsync('ox/WebCryptoP256:verify', {
          payload,
          publicKey,
          signature,
        }),
        {
          noble: noble.p256.verify(
            new noble.p256.Signature(signature.r, signature.s).toCompactHex(),
            noble.sha2.sha256(hexBytes(payload)),
            fn('ox/PublicKey:toHex')(publicKey).slice(2),
          ),
        },
        `WebCryptoP256.verify of a P-256 signature with r = ${toHex32(signature.r).slice(0, 6)}…, s = ${toHex32(signature.s).slice(0, 6)}…`,
      )
      same(
        'ox/WebCryptoP256:verify',
        await callAsync('ox/WebCryptoP256:verify', {
          payload: other,
          publicKey,
          signature,
        }),
        other === payload,
        'WebCryptoP256.verify of another payload',
      )
    },
  })

  // Tempo: Earn share math, addresses, token IDs, ticks, zones, periods, pools, roles.
  {
    const anchor = fc.record({
      engineShares: fc.oneof(fc.constant(0n), uint(128)),
      shareSupply: fc.oneof(fc.constant(0n), uint(128)),
    })
    // The vault's anchor is never zero on either side (an empty vault anchors one whole venue share
    // to one whole EarnShare), so a zero side, such as an empty vault's `engineShares`/`shareSupply`
    // read by mistake, must throw a documented error rather than divide by zero.
    add({
      id: 'consistency: EarnShares.toAmount rounds the share ratio down',
      oracle: 'consistency',
      covers: ['ox/tempo/EarnShares:toAmount'],
      runs: 200,
      arb: fc.tuple(anchor, uint(128)),
      check([anchor, amount]) {
        if (anchor.engineShares === 0n || anchor.shareSupply === 0n)
          return rejects(
            'ox/tempo/EarnShares:toAmount',
            'an anchor with a zero side',
            anchor,
            amount,
          )
        const value = call('ox/tempo/EarnShares:toAmount', anchor, amount)
        same(
          'ox/tempo/EarnShares:toAmount',
          value,
          (amount * anchor.shareSupply) / anchor.engineShares,
          'EarnShares.toAmount rounds down',
        )
      },
    })
    add({
      id: 'consistency: EarnShares.toAmountUp is toAmount rounded up',
      oracle: 'consistency',
      covers: ['ox/tempo/EarnShares:toAmountUp'],
      runs: 200,
      arb: fc.tuple(anchor, uint(128)),
      check([anchor, amount]) {
        if (anchor.engineShares === 0n || anchor.shareSupply === 0n)
          return rejects(
            'ox/tempo/EarnShares:toAmountUp',
            'an anchor with a zero side',
            anchor,
            amount,
          )
        const value = call('ox/tempo/EarnShares:toAmountUp', anchor, amount)
        const { engineShares, shareSupply } = anchor
        same(
          'ox/tempo/EarnShares:toAmountUp',
          value,
          (amount * shareSupply) / engineShares +
            ((amount * shareSupply) % engineShares === 0n ? 0n : 1n),
          'EarnShares.toAmountUp rounds up',
        )
      },
    })
    add({
      id: 'consistency: EarnShares.toVenueAmount rounds the inverse ratio down',
      oracle: 'consistency',
      covers: ['ox/tempo/EarnShares:toVenueAmount'],
      runs: 200,
      arb: fc.tuple(anchor, uint(128)),
      check([anchor, amount]) {
        if (anchor.engineShares === 0n || anchor.shareSupply === 0n)
          return rejects(
            'ox/tempo/EarnShares:toVenueAmount',
            'an anchor with a zero side',
            anchor,
            amount,
          )
        const value = call('ox/tempo/EarnShares:toVenueAmount', anchor, amount)
        same(
          'ox/tempo/EarnShares:toVenueAmount',
          value,
          (amount * anchor.engineShares) / anchor.shareSupply,
          'EarnShares.toVenueAmount rounds down',
        )
      },
    })
    add({
      id: 'consistency: Earn fee shares and minimum outputs',
      oracle: 'consistency',
      covers: [
        'ox/tempo/EarnShares:feeShares',
        'ox/tempo/EarnShares:minimumOutput',
      ],
      runs: 300,
      arb: fc.record({
        activeAssets: uint(128),
        shareSupply: uint(128),
        totalFeeAssets: fc.oneof(fc.constant(0n), uint(128)),
        expected: fc.oneof(fc.constant(1n), uint(128)),
        slippage: fc.integer({ min: 0, max: 9999 }),
      }),
      check({ activeAssets, shareSupply, totalFeeAssets, expected, slippage }) {
        const fee = call('ox/tempo/EarnShares:feeShares', {
          activeAssets,
          shareSupply,
          totalFeeAssets,
        })
        same(
          'ox/tempo/EarnShares:feeShares',
          fee,
          totalFeeAssets === 0n || totalFeeAssets >= activeAssets
            ? 0n
            : (totalFeeAssets * shareSupply) / (activeAssets - totalFeeAssets),
          'EarnShares.feeShares',
        )
        const minimum = call(
          'ox/tempo/EarnShares:minimumOutput',
          expected,
          slippage,
        )
        if (expected > 0n && (minimum < 1n || minimum > expected))
          throw new Failure(
            `EarnShares.minimumOutput(${expected}, ${slippage}) returned ${minimum}, outside 1 to ${expected}`,
            { blame: ['ox/tempo/EarnShares:minimumOutput'] },
          )
        rejects(
          'ox/tempo/EarnShares:minimumOutput',
          'a slippage of 10000 bps',
          expected,
          10_000,
        )
      },
    })
    add({
      id: 'round trip: Tempo addresses, token IDs, virtual addresses, pools',
      oracle: 'round trip',
      covers: [
        'ox/tempo/TempoAddress:format',
        'ox/tempo/TempoAddress:parse',
        'ox/tempo/TempoAddress:resolve',
        'ox/tempo/TempoAddress:validate',
        'ox/tempo/TokenId:from',
        'ox/tempo/TokenId:fromAddress',
        'ox/tempo/TokenId:toAddress',
        'ox/tempo/TokenId:compute',
        'ox/tempo/VirtualAddress:from',
        'ox/tempo/VirtualAddress:parse',
        'ox/tempo/VirtualAddress:isVirtual',
        'ox/tempo/VirtualAddress:validate',
        'ox/tempo/PoolId:from',
      ],
      runs: 300,
      arb: fc.record({
        address,
        tokenId: fc.oneof(
          uint(64),
          uint(144),
          fc.constantFrom(0n, 1n, 2n ** 64n - 1n, 2n ** 112n, 2n ** 144n - 1n),
        ),
        otherToken: uint(64),
        salt: hash,
        masterId: hexOf(4, 4),
        userTag: hexOf(6, 6),
      }),
      check({ address, tokenId, otherToken, salt, masterId, userTag }) {
        const checksummed = ethers.getAddress(address)
        const tempo = call('ox/tempo/TempoAddress:format', address)
        same(
          'ox/tempo/TempoAddress:format',
          tempo,
          `tempox${address}`,
          'TempoAddress.format',
        )
        same(
          'ox/tempo/TempoAddress:parse',
          call('ox/tempo/TempoAddress:parse', tempo),
          { address: checksummed },
          'TempoAddress.parse(format(a))',
        )
        same(
          'ox/tempo/TempoAddress:resolve',
          call('ox/tempo/TempoAddress:resolve', tempo),
          checksummed,
          'TempoAddress.resolve(tempo address)',
        )
        same(
          'ox/tempo/TempoAddress:resolve',
          call('ox/tempo/TempoAddress:resolve', address),
          address,
          'TempoAddress.resolve(hex address)',
        )
        same(
          'ox/tempo/TempoAddress:validate',
          call('ox/tempo/TempoAddress:validate', tempo),
          true,
          'TempoAddress.validate',
        )
        same(
          'ox/tempo/TempoAddress:validate',
          call('ox/tempo/TempoAddress:validate', tempo.slice(0, -1)),
          false,
          'TempoAddress.validate of a short address',
        )
        const tokenAddress = call('ox/tempo/TokenId:toAddress', tokenId)
        same(
          'ox/tempo/TokenId:toAddress',
          tokenAddress,
          `0x20c0${tokenId.toString(16).padStart(36, '0')}`,
          'TokenId.toAddress',
        )
        // toAddress takes IDs up to 18 bytes, so fromAddress must read all 18 back.
        same(
          'ox/tempo/TokenId:fromAddress',
          call('ox/tempo/TokenId:fromAddress', tokenAddress),
          tokenId,
          'TokenId.fromAddress(toAddress(id))',
        )
        same(
          'ox/tempo/TokenId:from',
          call(
            'ox/tempo/TokenId:from',
            call('ox/tempo/TempoAddress:format', tokenAddress),
          ),
          tokenId,
          'TokenId.from(tempo address)',
        )
        same(
          'ox/tempo/TokenId:from',
          call('ox/tempo/TokenId:from', tokenId),
          tokenId,
          'TokenId.from(id)',
        )
        same(
          'ox/tempo/TokenId:compute',
          call('ox/tempo/TokenId:compute', { sender: address, salt }),
          BigInt(
            ethers
              .keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                  ['address', 'bytes32'],
                  [address, salt],
                ),
              )
              .slice(0, 18),
          ),
          'TokenId.compute',
        )
        const virtual = call('ox/tempo/VirtualAddress:from', {
          masterId,
          userTag,
        })
        same(
          'ox/tempo/VirtualAddress:from',
          virtual.toLowerCase(),
          `${masterId}fdfdfdfdfdfdfdfdfdfd${userTag.slice(2)}`,
          'VirtualAddress.from',
        )
        same(
          'ox/tempo/VirtualAddress:parse',
          canonicalHex(call('ox/tempo/VirtualAddress:parse', virtual)),
          { masterId, userTag },
          'VirtualAddress.parse(from(x))',
        )
        same(
          'ox/tempo/VirtualAddress:isVirtual',
          [
            call('ox/tempo/VirtualAddress:isVirtual', virtual),
            call('ox/tempo/VirtualAddress:isVirtual', address),
          ],
          [true, address.slice(10, 30) === 'fd'.repeat(10)],
          'VirtualAddress.isVirtual',
        )
        same(
          'ox/tempo/VirtualAddress:validate',
          call(
            'ox/tempo/VirtualAddress:validate',
            call('ox/tempo/TempoAddress:format', virtual),
          ),
          true,
          'VirtualAddress.validate(tempo address)',
        )
        const pool = call('ox/tempo/PoolId:from', {
          userToken: tokenId,
          validatorToken: otherToken,
        })
        same(
          'ox/tempo/PoolId:from',
          pool,
          ethers.keccak256(
            ethers.concat([
              ethers.zeroPadValue(tokenAddress, 32),
              ethers.zeroPadValue(
                `0x20c0${otherToken.toString(16).padStart(36, '0')}`,
                32,
              ),
            ]),
          ),
          'PoolId.from',
        )
      },
    })
    add({
      id: 'round trip: ticks and prices',
      oracle: 'round trip',
      covers: ['ox/tempo/Tick:toPrice', 'ox/tempo/Tick:fromPrice'],
      runs: 300,
      arb: fc.oneof(
        fc.integer({ min: -2000, max: 2000 }),
        fc.constantFrom(-2000, 2000, 0, 0.5, -0.25, 1999.99),
      ),
      check(tick) {
        const price = tolerant('ox/tempo/Tick:toPrice', tick)
        if (!price) return
        const back = tolerant('ox/tempo/Tick:fromPrice', price.value)
        if (!back || back.value !== tick)
          throw new Failure(
            `Tick.toPrice(${tick}) returned ${JSON.stringify(price.value)}, which Tick.fromPrice ${back ? `reads as ${back.value}` : 'rejects'}`,
            {
              blame: ['ox/tempo/Tick:toPrice'],
              kind: Number.isInteger(tick) ? 'mismatch' : 'invalid output',
            },
          )
        same(
          'ox/tempo/Tick:fromPrice',
          call('ox/tempo/Tick:fromPrice', ` ${price.value} `),
          tick,
          'Tick.fromPrice trims whitespace',
        )
      },
    })
    add({
      id: 'round trip: zone IDs and chain IDs',
      oracle: 'round trip',
      covers: ['ox/tempo/ZoneId:toChainId', 'ox/tempo/ZoneId:fromChainId'],
      runs: 200,
      arb: fc.record({
        zoneId: fc.integer({ min: 0, max: 723_173_647 }),
        sourceId: fc.constantFrom(undefined, 4217, 42431),
      }),
      check({ zoneId, sourceId }) {
        const chainIdValue = call('ox/tempo/ZoneId:toChainId', zoneId, sourceId)
        same(
          'ox/tempo/ZoneId:fromChainId',
          call('ox/tempo/ZoneId:fromChainId', chainIdValue, sourceId),
          zoneId,
          'ZoneId.fromChainId(toChainId(z))',
        )
        rejects('ox/tempo/ZoneId:toChainId', 'source chain 1', zoneId, 1)
      },
    })
    add({
      id: 'consistency: periods in seconds',
      oracle: 'consistency',
      covers: [
        'ox/tempo/Period:seconds',
        'ox/tempo/Period:minutes',
        'ox/tempo/Period:hours',
        'ox/tempo/Period:days',
        'ox/tempo/Period:weeks',
        'ox/tempo/Period:months',
        'ox/tempo/Period:years',
      ],
      runs: 100,
      arb: fc.integer({ min: 0, max: 10_000 }),
      check(n) {
        const expected: Record<string, number> = {
          seconds: 1,
          minutes: 60,
          hours: 3600,
          days: 86_400,
          weeks: 604_800,
          months: 2_592_000,
          years: 31_536_000,
        }
        for (const [unit, factor] of Object.entries(expected))
          same(
            `ox/tempo/Period:${unit}`,
            call(`ox/tempo/Period:${unit}`, n),
            n * factor,
            `Period.${unit}(${n})`,
          )
      },
    })
    add({
      id: 'differential: token roles against keccak256 of their names',
      oracle: 'differential',
      covers: ['ox/tempo/TokenRole:serialize'],
      runs: 6,
      arb: fc.constantFrom(
        'defaultAdmin',
        'pause',
        'unpause',
        'issuer',
        'burnBlocked',
        'burnAt',
      ),
      check(role) {
        const name = {
          defaultAdmin: '',
          pause: 'PAUSE_ROLE',
          unpause: 'UNPAUSE_ROLE',
          issuer: 'ISSUER_ROLE',
          burnBlocked: 'BURN_BLOCKED_ROLE',
          burnAt: 'BURN_AT_ROLE',
        }[role as string]!
        same(
          'ox/tempo/TokenRole:serialize',
          call('ox/tempo/TokenRole:serialize', role),
          name ? ethers.id(name) : `0x${'00'.repeat(32)}`,
          `TokenRole.serialize(${role})`,
        )
      },
    })
  }

  // ERC-6492, ERC-8010, ERC-7821, ERC-8021, blobs, validator data.
  {
    add({
      id: 'round trip: ERC-6492 signatures (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/erc6492/SignatureErc6492:wrap',
        'ox/erc6492/SignatureErc6492:unwrap',
        'ox/erc6492/SignatureErc6492:from',
        'ox/erc6492/SignatureErc6492:assert',
        'ox/erc6492/SignatureErc6492:validate',
      ],
      runs: 200,
      arb: fc.record({
        data: hexOf(0, 60),
        signature: hexOf(0, 70),
        to: address,
      }),
      check(value) {
        const wrapped = call('ox/erc6492/SignatureErc6492:wrap', value)
        vote(
          'ox/erc6492/SignatureErc6492:wrap',
          wrapped,
          {
            viem: attempt(() =>
              viem.serializeErc6492Signature({
                address: value.to,
                data: value.data,
                signature: value.signature,
              }),
            ),
          },
          'SignatureErc6492.wrap',
        )
        same(
          'ox/erc6492/SignatureErc6492:unwrap',
          canonicalHex(call('ox/erc6492/SignatureErc6492:unwrap', wrapped)),
          canonicalHex(value),
          'SignatureErc6492.unwrap(wrap(x))',
        )
        same(
          'ox/erc6492/SignatureErc6492:from',
          canonicalHex(call('ox/erc6492/SignatureErc6492:from', wrapped)),
          canonicalHex(value),
          'SignatureErc6492.from(wrapped)',
        )
        same(
          'ox/erc6492/SignatureErc6492:from',
          canonicalHex(call('ox/erc6492/SignatureErc6492:from', value)),
          canonicalHex(value),
          'SignatureErc6492.from(unwrapped)',
        )
        call('ox/erc6492/SignatureErc6492:assert', wrapped)
        same(
          'ox/erc6492/SignatureErc6492:validate',
          [
            call('ox/erc6492/SignatureErc6492:validate', wrapped),
            call('ox/erc6492/SignatureErc6492:validate', value.signature),
          ],
          [true, false],
          'SignatureErc6492.validate',
        )
      },
    })
    add({
      id: 'round trip: ERC-8010 signatures',
      oracle: 'round trip',
      covers: [
        'ox/erc8010/SignatureErc8010:wrap',
        'ox/erc8010/SignatureErc8010:unwrap',
        'ox/erc8010/SignatureErc8010:from',
        'ox/erc8010/SignatureErc8010:assert',
        'ox/erc8010/SignatureErc8010:validate',
      ],
      runs: 150,
      arb: fc.record({
        authorization: fc.record({
          address,
          chainId,
          nonce: uint(64),
          r: scalar,
          s: scalar,
          yParity: fc.integer({ min: 0, max: 1 }),
        }),
        data: optional(hexOf(1, 40)),
        signature: hexOf(1, 70),
        to: optional(address),
      }),
      check(value) {
        // wrap recovers the signer even when `to` is given, so the authorization must be
        // a valid signature (src/erc8010/SignatureErc8010.ts).
        const authorization = {
          ...value.authorization,
          ...fn('ox/Secp256k1:sign')({
            payload: fn('ox/Authorization:getSignPayload')(value.authorization),
            privateKey: `0x${'01'.padStart(64, '0')}`,
          }),
        }
        const input = Object.fromEntries(
          Object.entries({ ...value, authorization }).filter(
            ([, item]) => item !== undefined,
          ),
        )
        const wrapped = call('ox/erc8010/SignatureErc8010:wrap', input)
        const unwrapped = call('ox/erc8010/SignatureErc8010:unwrap', wrapped)
        // `to` is the target of the initialization call, so unwrap returns it only with
        // `data`; a missing `to` wraps as the authorization's signer
        // (src/erc8010/SignatureErc8010.ts).
        const { to: unwrappedTo, ...rest } = unwrapped
        const { to: inputTo, ...inputRest } = input
        same(
          'ox/erc8010/SignatureErc8010:unwrap',
          withoutEmpty(inputTo && input.data ? unwrapped : rest),
          withoutEmpty(
            inputTo && input.data ? { ...inputRest, to: inputTo } : inputRest,
          ),
          'SignatureErc8010.unwrap(wrap(x))',
        )
        if (!input.to && unwrappedTo === undefined && input.data)
          throw new Failure('SignatureErc8010.unwrap lost the default `to`', {
            blame: ['ox/erc8010/SignatureErc8010:unwrap'],
          })
        same(
          'ox/erc8010/SignatureErc8010:from',
          withoutEmpty(call('ox/erc8010/SignatureErc8010:from', wrapped)),
          withoutEmpty(unwrapped),
          'SignatureErc8010.from(wrapped)',
        )
        call('ox/erc8010/SignatureErc8010:assert', wrapped)
        same(
          'ox/erc8010/SignatureErc8010:validate',
          [
            call('ox/erc8010/SignatureErc8010:validate', wrapped),
            call('ox/erc8010/SignatureErc8010:validate', value.signature),
          ],
          [true, false],
          'SignatureErc8010.validate',
        )
      },
    })
    const call7821 = fc.record({
      to: address,
      value: optional(uint(128)),
      data: optional(hexOf(0, 40)),
    })
    add({
      id: 'round trip: ERC-7821 calls and execute data',
      oracle: 'round trip',
      covers: [
        'ox/erc7821/Calls:encode',
        'ox/erc7821/Calls:decode',
        'ox/erc7821/Calls:getAbiParameters',
        'ox/erc7821/Execute:encodeData',
        'ox/erc7821/Execute:decodeData',
        'ox/erc7821/Execute:encodeBatchOfBatchesData',
        'ox/erc7821/Execute:decodeBatchOfBatchesData',
      ],
      runs: 150,
      arb: fc.record({
        calls: fc.array(call7821, { maxLength: 3 }),
        opData: optional(hexOf(0, 30)),
        batches: fc.array(
          fc.record({
            calls: fc.array(call7821, { maxLength: 2 }),
            opData: optional(hexOf(0, 20)),
          }),
          { maxLength: 3 },
        ),
      }),
      check({ calls, opData, batches }) {
        const expectedCalls = calls.map((item: Any) => ({
          data: item.data ?? '0x',
          to: item.to,
          value: item.value ?? 0n,
        }))
        const encoded = call('ox/erc7821/Calls:encode', calls, { opData })
        same(
          'ox/erc7821/Calls:encode',
          encoded,
          fn('ox/AbiParameters:encode')(
            call('ox/erc7821/Calls:getAbiParameters', {
              opData: opData !== undefined,
            }),
            [
              expectedCalls.map((item: Any) => ({
                target: item.to,
                value: item.value,
                data: item.data,
              })),
              ...(opData !== undefined ? [opData] : []),
            ],
          ),
          'Calls.encode is the ABI encoding of its parameters',
        )
        same(
          'ox/erc7821/Calls:decode',
          withoutEmpty(
            call('ox/erc7821/Calls:decode', encoded, {
              opData: opData !== undefined,
            }),
          ),
          withoutEmpty({ calls: expectedCalls, opData }),
          'Calls.decode(Calls.encode(x))',
        )
        const data = call('ox/erc7821/Execute:encodeData', calls, { opData })
        same(
          'ox/erc7821/Execute:decodeData',
          withoutEmpty(call('ox/erc7821/Execute:decodeData', data)),
          withoutEmpty({ calls: expectedCalls, opData }),
          'Execute.decodeData(encodeData(x))',
        )
        const batchData = call(
          'ox/erc7821/Execute:encodeBatchOfBatchesData',
          batches,
        )
        same(
          'ox/erc7821/Execute:decodeBatchOfBatchesData',
          withoutEmpty(
            call('ox/erc7821/Execute:decodeBatchOfBatchesData', batchData),
          ),
          withoutEmpty(
            batches.map((batch: Any) => ({
              calls: batch.calls.map((item: Any) => ({
                data: item.data ?? '0x',
                to: item.to,
                value: item.value ?? 0n,
              })),
              opData: batch.opData,
            })),
          ),
          'Execute.decodeBatchOfBatchesData(encodeBatchOfBatchesData(x))',
        )
      },
    })
    const code = fc.stringMatching(/^[a-z0-9_]{1,12}$/)
    add({
      id: 'round trip: ERC-8021 attribution suffixes',
      oracle: 'round trip',
      covers: [
        'ox/erc8021/Attribution:toDataSuffix',
        'ox/erc8021/Attribution:fromData',
        'ox/erc8021/Attribution:getSchemaId',
      ],
      runs: 200,
      arb: fc.tuple(
        fc.oneof(
          fc.record({ codes: fc.array(code, { minLength: 1, maxLength: 3 }) }),
          fc.record({
            codes: fc.array(code, { minLength: 1, maxLength: 3 }),
            codeRegistry: fc.record({ address, chainId }),
          }),
          fc
            .record(
              {
                appCode: code,
                walletCode: code,
                serviceCodes: fc.array(code, { maxLength: 2 }),
              },
              { requiredKeys: [] },
            )
            .filter((value) => Object.keys(value).length > 0),
        ),
        hexOf(0, 40),
      ),
      check([attribution, calldata]) {
        const suffix = call('ox/erc8021/Attribution:toDataSuffix', attribution)
        const id = call('ox/erc8021/Attribution:getSchemaId', attribution)
        const parsed = call(
          'ox/erc8021/Attribution:fromData',
          `${calldata}${suffix.slice(2)}`,
        )
        if (!parsed)
          throw new Failure(
            `Attribution.fromData did not find the suffix of ${show(attribution)}`,
            { blame: ['ox/erc8021/Attribution:fromData'] },
          )
        // An empty list of service codes reads back as no list.
        const expected = { ...attribution, id } as Record<string, unknown>
        if (
          Array.isArray(expected.serviceCodes) &&
          !expected.serviceCodes.length
        )
          delete expected.serviceCodes
        same(
          'ox/erc8021/Attribution:fromData',
          withoutEmpty(parsed),
          withoutEmpty(expected),
          'Attribution.fromData(calldata ++ toDataSuffix(a))',
        )
      },
    })
    add({
      id: 'round trip: blobs (differential with viem)',
      oracle: 'round trip',
      covers: [
        'ox/Blobs:from',
        'ox/Blobs:to',
        'ox/Blobs:toHex',
        'ox/Blobs:toBytes',
        'ox/Blobs:commitmentToVersionedHash',
        'ox/Blobs:commitmentsToVersionedHashes',
        'ox/Blobs:sidecarsToVersionedHashes',
      ],
      runs: 6,
      arb: fc.tuple(
        fc.oneof(
          bytesOf(1, 200),
          fc
            .integer({ min: 1, max: 140_000 })
            .map((n) => new Uint8Array(n).fill(7)),
        ),
        fc.boolean(),
        fc.array(hexOf(48, 48), { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 0, max: 255 }),
      ),
      check([data, hex, commitments, version]) {
        const input = hex ? toHex(data) : data
        const blobs = call('ox/Blobs:from', input)
        vote(
          'ox/Blobs:from',
          blobs.map((blob: Any) =>
            typeof blob === 'string' ? blob : toHex(blob),
          ),
          { viem: attempt(() => viem.toBlobs({ data: toHex(data) })) },
          'Blobs.from',
        )
        const back = call('ox/Blobs:to', blobs)
        same(
          'ox/Blobs:to',
          typeof back === 'string' ? back : toHex(back),
          toHex(data),
          'Blobs.to(Blobs.from(x))',
        )
        same(
          'ox/Blobs:toHex',
          call('ox/Blobs:toHex', blobs),
          toHex(data),
          'Blobs.toHex',
        )
        same(
          'ox/Blobs:toBytes',
          toHex(call('ox/Blobs:toBytes', blobs)),
          toHex(data),
          'Blobs.toBytes',
        )
        const versioned = call(
          'ox/Blobs:commitmentsToVersionedHashes',
          commitments,
          { version },
        )
        vote(
          'ox/Blobs:commitmentsToVersionedHashes',
          versioned,
          {
            viem: attempt(() =>
              viem.commitmentsToVersionedHashes({ commitments, version }),
            ),
            reference: commitments.map(
              (commitment: string) =>
                `0x${version.toString(16).padStart(2, '0')}${toHex(noble.sha2.sha256(hexBytes(commitment))).slice(4)}`,
            ),
          },
          'Blobs.commitmentsToVersionedHashes',
        )
        same(
          'ox/Blobs:commitmentToVersionedHash',
          call('ox/Blobs:commitmentToVersionedHash', commitments[0], {
            version,
          }),
          versioned[0],
          'Blobs.commitmentToVersionedHash',
        )
        same(
          'ox/Blobs:sidecarsToVersionedHashes',
          call(
            'ox/Blobs:sidecarsToVersionedHashes',
            commitments.map((commitment: string) => ({
              blob: '0x',
              commitment,
              proof: '0x',
            })),
            { version },
          ),
          versioned,
          'Blobs.sidecarsToVersionedHashes',
        )
      },
    })
    add({
      id: 'differential: blob commitments and proofs against micro-eth-signer KZG',
      oracle: 'differential',
      covers: [
        'ox/Blobs:toCommitments',
        'ox/Blobs:toProofs',
        'ox/Blobs:toSidecars',
        'ox/Blobs:toVersionedHashes',
        'ox/Kzg:from',
      ],
      runs: 1,
      arb: bytesOf(1, 64),
      check(data) {
        const micro = lib.kzg
        // micro-eth-signer's KZG takes seconds a blob, so the property shares its answers.
        const memo =
          (lib as Any).kzgMemo ??
          ((lib as Any).kzgMemo = new Map<string, string>())
        const remember = (key: string, compute: () => string) => {
          if (!memo.has(key)) memo.set(key, compute())
          return memo.get(key)!
        }
        const commit = (blob: string) =>
          remember(blob, () => micro.blobToKzgCommitment(blob))
        const prove = (blob: string, commitment: string) =>
          remember(`${blob}${commitment}`, () =>
            micro.computeBlobProof(blob, commitment),
          )
        const kzg = call('ox/Kzg:from', {
          blobToKzgCommitment: (blob: Uint8Array) =>
            hexBytes(commit(toHex(blob))),
          computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) =>
            hexBytes(prove(toHex(blob), toHex(commitment))),
        })
        const blobs = call('ox/Blobs:from', toHex(data))
        const commitments = call('ox/Blobs:toCommitments', blobs, { kzg })
        same(
          'ox/Blobs:toCommitments',
          commitments,
          blobs.map(commit),
          'Blobs.toCommitments',
        )
        const proofs = call('ox/Blobs:toProofs', blobs, { commitments, kzg })
        same(
          'ox/Blobs:toProofs',
          proofs,
          blobs.map((blob: string, i: number) => prove(blob, commitments[i])),
          'Blobs.toProofs',
        )
        same(
          'ox/Blobs:toSidecars',
          call('ox/Blobs:toSidecars', blobs, { kzg }),
          blobs.map((blob: string, i: number) => ({
            blob,
            commitment: commitments[i],
            proof: proofs[i],
          })),
          'Blobs.toSidecars',
        )
        same(
          'ox/Blobs:toVersionedHashes',
          call('ox/Blobs:toVersionedHashes', blobs, { kzg }),
          commitments.map(
            (commitment: string) =>
              `0x01${toHex(noble.sha2.sha256(hexBytes(commitment))).slice(4)}`,
          ),
          'Blobs.toVersionedHashes',
        )
      },
    })
    add({
      id: 'differential: EIP-191 validator data against viem',
      oracle: 'differential',
      covers: ['ox/ValidatorData:encode', 'ox/ValidatorData:getSignPayload'],
      runs: 150,
      arb: fc.record({ data: hexOf(0, 60), validator: address }),
      check({ data, validator }) {
        const encoded = call('ox/ValidatorData:encode', { data, validator })
        same(
          'ox/ValidatorData:encode',
          encoded.toLowerCase(),
          `0x1900${validator.slice(2)}${data.slice(2)}`,
          'ValidatorData.encode is 0x19 00 ‖ validator ‖ data',
        )
        vote(
          'ox/ValidatorData:getSignPayload',
          call('ox/ValidatorData:getSignPayload', { data, validator }),
          {
            viem: attempt(() =>
              lib.viemUtils.hashMessage ? viem.keccak256(encoded) : undefined,
            ),
            keccak: ethers.keccak256(encoded),
          },
          'ValidatorData.getSignPayload',
        )
      },
    })
  }

  // WebAuthn: sign payloads, verification, authenticator data, options.
  add({
    id: 'round trip: WebAuthn assertions verify (P256 signatures over the sign payload)',
    oracle: 'round trip',
    covers: [
      'ox/webauthn/Authentication:getSignPayload',
      'ox/webauthn/Authentication:verify',
      'ox/WebAuthnP256:getSignPayload',
      'ox/WebAuthnP256:verify',
      'ox/webauthn/Authenticator:getAuthenticatorData',
      'ox/webauthn/Authenticator:getSignCount',
      'ox/webauthn/Authenticator:getClientDataJSON',
      'ox/WebAuthnP256:getAuthenticatorData',
      'ox/WebAuthnP256:getClientDataJSON',
    ],
    runs: 60,
    arb: fc.record({
      key: p256Key,
      challenge: hexOf(1, 64),
      rpId: fc.constantFrom('example.com', 'localhost', 'sub.example.org'),
      // `origin` and `rpId` default to `window.location`, which only browsers have.
      origin: fc.constantFrom('https://example.com', 'http://localhost:3000'),
      signCount: optional(fc.integer({ min: 0, max: 2 ** 32 - 1 })),
      crossOrigin: optional(fc.boolean()),
      userVerification: fc.constantFrom('required', 'preferred', 'discouraged'),
    }),
    check({
      key,
      challenge,
      rpId,
      origin,
      signCount,
      crossOrigin,
      userVerification,
    }) {
      const point = noble.p256.ProjectivePoint.fromHex(
        noble.p256.getPublicKey(hexBytes(key), false),
      )
      const publicKey = { prefix: 4, x: point.x, y: point.y }
      for (const name of ['ox/webauthn/Authentication', 'ox/WebAuthnP256']) {
        const { metadata, payload } = call(`${name}:getSignPayload`, {
          challenge,
          rpId,
          origin,
          signCount,
          crossOrigin,
          userVerification,
        })
        const signature = fn('ox/P256:sign')({
          payload,
          privateKey: key,
          hash: true,
        })
        same(
          `${name}:verify`,
          call(`${name}:verify`, {
            challenge,
            metadata,
            publicKey,
            signature,
            rpId,
            origin,
          }),
          true,
          `${short(name)}.verify of a signed assertion`,
        )
        same(
          `${name}:verify`,
          call(`${name}:verify`, {
            challenge: `${challenge}00`,
            metadata,
            publicKey,
            signature,
            rpId,
            origin,
          }),
          false,
          `${short(name)}.verify of another challenge`,
        )
        if (signCount !== undefined)
          same(
            'ox/webauthn/Authenticator:getSignCount',
            call(
              'ox/webauthn/Authenticator:getSignCount',
              metadata.authenticatorData,
            ),
            signCount,
            'Authenticator.getSignCount',
          )
      }
      for (const name of ['ox/webauthn/Authenticator', 'ox/WebAuthnP256']) {
        const data = call(`${name}:getAuthenticatorData`, { rpId, signCount })
        same(
          `${name}:getAuthenticatorData`,
          data.slice(0, 66),
          ethers.sha256(new TextEncoder().encode(rpId)),
          `${short(name)}.getAuthenticatorData starts with the rpId hash`,
        )
        const json = JSON.parse(
          call(`${name}:getClientDataJSON`, {
            challenge,
            origin,
            crossOrigin,
          }),
        )
        same(
          `${name}:getClientDataJSON`,
          json.challenge,
          Buffer.from(hexBytes(challenge)).toString('base64url'),
          `${short(name)}.getClientDataJSON challenge`,
        )
      }
    },
  })
  add({
    id: 'round trip: WebAuthn options serialize ↔ deserialize',
    oracle: 'round trip',
    covers: [
      'ox/webauthn/Authentication:getOptions',
      'ox/webauthn/Authentication:serializeOptions',
      'ox/webauthn/Authentication:deserializeOptions',
      'ox/webauthn/Registration:getOptions',
      'ox/webauthn/Registration:serializeOptions',
      'ox/webauthn/Registration:deserializeOptions',
      'ox/WebAuthnP256:getCredentialRequestOptions',
      'ox/WebAuthnP256:getCredentialCreationOptions',
    ],
    runs: 100,
    arb: fc.record({
      challenge: hexOf(1, 40),
      credentialId: optional(
        fc.oneof(
          fc.stringMatching(/^[A-Za-z0-9_-]{4,20}$/),
          fc.array(fc.stringMatching(/^[A-Za-z0-9_-]{4,20}$/), {
            maxLength: 2,
          }),
        ),
      ),
      rpId: fc.constantFrom('example.com', 'localhost'),
      name: fc.string({ minLength: 1, maxLength: 12 }),
      timeout: optional(fc.integer({ min: 1, max: 600_000 })),
    }),
    check({ challenge, credentialId, rpId, name, timeout }) {
      const request = call('ox/webauthn/Authentication:getOptions', {
        challenge,
        credentialId,
        rpId,
      })
      same(
        'ox/WebAuthnP256:getCredentialRequestOptions',
        canonicalBuffers(
          call('ox/WebAuthnP256:getCredentialRequestOptions', {
            challenge,
            credentialId,
            rpId,
          }),
        ),
        canonicalBuffers(request),
        'WebAuthnP256.getCredentialRequestOptions agrees with Authentication.getOptions',
      )
      const serialized = call(
        'ox/webauthn/Authentication:serializeOptions',
        request,
      )
      JSON.stringify(serialized)
      same(
        'ox/webauthn/Authentication:deserializeOptions',
        canonicalBuffers(
          call('ox/webauthn/Authentication:deserializeOptions', serialized),
        ),
        canonicalBuffers(request),
        'Authentication.deserializeOptions(serializeOptions(o))',
      )
      const creation = call('ox/webauthn/Registration:getOptions', {
        challenge,
        name,
        rp: { id: rpId, name: rpId },
        timeout,
        user: { name, id: new TextEncoder().encode(name) },
      })
      same(
        'ox/WebAuthnP256:getCredentialCreationOptions',
        canonicalBuffers({
          ...call('ox/WebAuthnP256:getCredentialCreationOptions', {
            challenge,
            name,
            rp: { id: rpId, name: rpId },
            timeout,
            user: { name, id: new TextEncoder().encode(name) },
          }),
        }),
        canonicalBuffers(creation),
        'WebAuthnP256.getCredentialCreationOptions agrees with Registration.getOptions',
      )
      const serializedCreation = call(
        'ox/webauthn/Registration:serializeOptions',
        creation,
      )
      JSON.stringify(serializedCreation)
      same(
        'ox/webauthn/Registration:deserializeOptions',
        canonicalBuffers(
          call(
            'ox/webauthn/Registration:deserializeOptions',
            serializedCreation,
          ),
        ),
        canonicalBuffers(creation),
        'Registration.deserializeOptions(serializeOptions(o))',
      )
    },
  })

  // RpcTransport.fromHttp against a fake `fetchFn`: the fuzzer blocks the network, so the
  // property answers each request itself, with JSON-RPC results, errors, HTTP failures, and
  // bodies that are not JSON-RPC at all.
  add({
    id: 'consistency: RpcTransport.fromHttp requests and responses (fake fetch)',
    oracle: 'consistency',
    covers: ['ox/RpcTransport:fromHttp'],
    runs: 150,
    async: true,
    arb: fc.record({
      body: fc.oneof(
        fc.record({ result: fc.jsonValue({ maxDepth: 2 }) }),
        fc.record({
          error: fc.record({
            code: fc.integer({ min: -32_768, max: 10_000 }),
            message: fc.string({ maxLength: 20 }),
          }),
        }),
        fc.record({
          text: fc.oneof(
            fc.string({ maxLength: 20 }),
            fc.constantFrom(
              '',
              'null',
              '[]',
              '1',
              '{"jsonrpc":"2.0"}',
              '<html>',
            ),
          ),
        }),
      ),
      contentType: fc.constantFrom('application/json', 'text/plain'),
      method: fc.constantFrom('eth_blockNumber', 'eth_call', 'eth_getBalance'),
      params: optional(
        fc.array(fc.jsonValue({ maxDepth: 1 }), { maxLength: 3 }),
      ),
      raw: fc.boolean(),
      status: fc.constantFrom(200, 200, 200, 404, 500),
    }),
    async check({ body, contentType, method, params, raw, status }) {
      let request: Any
      const transport = call(
        'ox/RpcTransport:fromHttp',
        'https://rpc.example',
        {
          fetchFn: async (input: Request) => {
            request = JSON.parse(await input.text())
            const text =
              'text' in body
                ? body.text
                : JSON.stringify({ id: request.id, jsonrpc: '2.0', ...body })
            return new Response(text, {
              headers: { 'Content-Type': contentType },
              status,
            })
          },
          raw,
        },
      )
      let result: unknown
      let error: unknown
      try {
        result = await transport.request(
          params === undefined ? { method } : { method, params },
        )
      } catch (thrown) {
        error = thrown
      }
      same(
        'ox/RpcTransport:fromHttp',
        {
          id: typeof request.id,
          jsonrpc: request.jsonrpc,
          method: request.method,
          params: request.params,
        },
        { id: 'number', jsonrpc: '2.0', method, params },
        'RpcTransport.fromHttp request body',
      )
      if (error !== undefined && !documented(error))
        throw crash('ox/RpcTransport:fromHttp', error)
      const what = `RpcTransport.fromHttp on a ${status} ${contentType} reply ${show(body)}${raw ? ' (raw)' : ''}`
      if (status !== 200) {
        if ((error as Error)?.name !== 'RpcTransport.HttpError')
          throw new Failure(
            `${what}: expected HttpError, got ${error === undefined ? show(result) : (error as Error).name}`,
            { blame: ['ox/RpcTransport:fromHttp'] },
          )
        return
      }
      if ('result' in body) {
        if (error !== undefined) throw crash('ox/RpcTransport:fromHttp', error)
        same(
          'ox/RpcTransport:fromHttp',
          raw ? (result as Any).result : result,
          body.result,
          what,
        )
      }
      if ('error' in body) {
        if (raw)
          same(
            'ox/RpcTransport:fromHttp',
            (result as Any)?.error,
            body.error,
            what,
          )
        // JSON-RPC errors extend `RpcResponse.BaseError`, which is not an `Errors.BaseError`.
        else if (!(error instanceof ox('RpcResponse').BaseError))
          throw new Failure(
            `${what}: expected a JSON-RPC error, got ${show(result)}`,
            { blame: ['ox/RpcTransport:fromHttp'] },
          )
      }
    },
  })

  // Re-encoding recorded values. For each encode/decode or to/from pair, the encoder's recorded
  // arguments (and typed boundary mutations of them) must survive encode → decode → encode, and
  // the decoder's must survive decode → encode → decode. The first call may reject a mutant with a
  // documented error; the calls after it work on ox's own output, so any error there is a failure.
  {
    const reencode = (
      encoder: string,
      decoder: string,
      skip?: (input: unknown, back: boolean) => boolean,
    ) => {
      const pools = [lib.recorded(encoder), lib.recorded(decoder)]
      if (!pools[0]!.length && !pools[1]!.length) return
      add({
        id: `round trip: ${encoder.slice(3)} ↔ ${short(decoder)} on recorded values`,
        oracle: 'round trip',
        covers: [encoder, decoder],
        runs: 80,
        arb: fc.record({
          backward: fc.boolean(),
          index: fc.nat(),
          mutations: fc.nat({ max: 2 }),
          random: fc.integer(),
        }),
        check({ backward, index, mutations, random }) {
          const back = pools[0]!.length ? backward && !!pools[1]!.length : true
          const pool = pools[back ? 1 : 0]!
          const [first, second] = back ? [decoder, encoder] : [encoder, decoder]
          const args = lib.mutate(
            pool[index % pool.length]!,
            pool,
            random,
            mutations,
          )
          if (!args || skip?.(args[0], back)) return
          // The crash oracle already judges the first call on these arguments.
          let once: unknown
          try {
            once = fn(first)(...args)
          } catch {
            return
          }
          // A mutant the first call let through can still be invalid (an address of the wrong
          // size passes through `toRpc`), so later calls may reject it with a documented error;
          // garbage (`0xzz` read as NaN) may make them throw anything, and hex compares without
          // case. A recorded value may be invalid too (tests record error cases), but only a
          // documented error excuses it.
          const later = (name: string, value: unknown) => {
            // The same options as the first call: `serialize(x, { format: 'feePayer' })`.
            const extra = name === first ? args.slice(1) : []
            if (!mutations) return tolerant(name, value, ...extra)
            try {
              return { value: fn(name)(value, ...extra) }
            } catch {
              return undefined
            }
          }
          // `fromRpc(null)` is `null`, which no encoder takes. A mutant decoded to NaN (from
          // `0xzz`) is garbage the output check of the crash oracle judges.
          if (once === null || once === undefined) return
          if (mutations && hasNaN(once, 0)) return
          const there = later(second, once)
          if (!there) return
          const twice = later(first, there.value)
          if (!twice) return
          // A `fromRpc` spreads the RPC object, so a field the module does not model (tempo's
          // `feeToken` on a core transaction) comes through decoding unchanged and is dropped by
          // encoding; such fields are left out. So are fields left out or set to their default
          // (`0n`, `null`, `0x`) on the way, and hex compares without case for mutants.
          const input = args[0]
          const loose = (value: unknown) => {
            const own =
              back && isPlain(value) && isPlain(input) && isPlain(there.value)
                ? Object.fromEntries(
                    Object.entries(value).filter(
                      ([key, item]) =>
                        !(
                          key in input &&
                          !(key in (there.value as object)) &&
                          equal(item, input[key])
                        ),
                    ),
                  )
                : value
            return withoutDefaults(mutations ? canonicalHex(own) : own)
          }
          const what = `${short(first)}(${short(second)}(${short(first)}(x)))`
          // A recorded value decoded, or a recorded encoding, must survive the trip: fields the
          // re-encode adds (a default `type`) are fine, lost or changed ones are not.
          if (!mutations && (back || typeof once === 'string')) {
            const changed = changedField(loose(once), loose(twice.value), '')
            if (changed)
              throw new Failure(
                `${what} differs from ${short(first)}(x): ${changed[0] ? `at ${changed[0]}: ` : ''}got ${show(changed[2])}, expected ${show(changed[1])}`,
                { blame: [encoder, decoder] },
              )
            return
          }
          // A value can change on the way when the input was not in the form the decoder gives
          // (a legacy `v` of 0 becomes 27, `0x01` becomes `0x1`), but it must not lose a field,
          // and a second trip must not change it again.
          const lost = lostField(loose(once), loose(twice.value), '')
          if (lost)
            throw new Failure(
              `${what} lost ${lost[0] || 'the value'}: ${short(first)}(x) has ${show(lost[1])}`,
              { blame: [encoder, decoder] },
            )
          const back2 = later(second, twice.value)
          const thrice = back2 && later(first, back2.value)
          if (thrice)
            same(
              [encoder, decoder],
              loose(thrice.value),
              loose(twice.value),
              `${short(first)}(${short(second)}(${what})) differs from ${what}`,
            )
        },
      })
    }
    const pairs: [string, string, string][] = [
      ['', 'Authorization', 'Rpc'],
      ['', 'Authorization', 'RpcList'],
      ['', 'Authorization', 'Tuple'],
      ['', 'Authorization', 'TupleList'],
      ['', 'AccessList', 'TupleList'],
      ['', 'Block', 'Rpc'],
      ['', 'BlockOverrides', 'Rpc'],
      ['', 'Filter', 'Rpc'],
      ['', 'Frame', 'Rpc'],
      ['', 'Frame', 'Tuple'],
      ['', 'FrameReceipt', 'Rpc'],
      ['', 'FrameRequest', 'Rpc'],
      ['', 'FrameSignature', 'Rpc'],
      ['', 'FrameSignature', 'Tuple'],
      ['', 'Log', 'Rpc'],
      ['', 'StateOverrides', 'Rpc'],
      ['', 'Transaction', 'Rpc'],
      ['', 'TransactionReceipt', 'Rpc'],
      ['', 'TransactionRequest', 'Rpc'],
      ['', 'TxEnvelopeEip8141', 'Rpc'],
      ['', 'TxEnvelopeEip7702', 'Rpc'],
      ['', 'Withdrawal', 'Rpc'],
      ['erc4337/', 'UserOperation', 'Rpc'],
      ['erc4337/', 'UserOperation', 'Packed'],
      ['erc4337/', 'UserOperationGas', 'Rpc'],
      ['erc4337/', 'UserOperationReceipt', 'Rpc'],
      ['tempo/', 'AccountConfig', 'Rpc'],
      ['tempo/', 'AccountConfig', 'Tuple'],
      ['tempo/', 'AccountOperation', 'Rpc'],
      ['tempo/', 'AccountSimulation', 'Rpc'],
      ['tempo/', 'AuthorizationTempo', 'Rpc'],
      ['tempo/', 'AuthorizationTempo', 'RpcList'],
      ['tempo/', 'AuthorizationTempo', 'Tuple'],
      ['tempo/', 'AuthorizationTempo', 'TupleList'],
      ['tempo/', 'KeyAuthorization', 'Rpc'],
      ['tempo/', 'KeyAuthorization', 'Tuple'],
      ['tempo/', 'SignatureEnvelope', 'Rpc'],
      ['tempo/', 'Transaction', 'Rpc'],
      ['tempo/', 'TransactionReceipt', 'Rpc'],
      ['tempo/', 'TransactionRequest', 'Rpc'],
    ]
    for (const [prefix, module, suffix] of pairs)
      reencode(
        `ox/${prefix}${module}:to${suffix}`,
        `ox/${prefix}${module}:from${suffix}`,
      )
    // The fee payer format (`0x78`) carries the sender where the fee payer signature goes,
    // and serializing without `format: 'feePayer'` writes the usual `0x76` form instead.
    reencode(
      'ox/tempo/TxEnvelopeTempo:serialize',
      'ox/tempo/TxEnvelopeTempo:deserialize',
      (input, back) =>
        back && typeof input === 'string' && input.startsWith('0x78'),
    )
    for (const module of [
      'TxEnvelopeEip8141',
      'TxEnvelopeEip1559',
      'TxEnvelopeEip2930',
      'TxEnvelopeEip4844',
      'TxEnvelopeEip7702',
      'TxEnvelopeLegacy',
      'tempo/KeyAuthorization',
      'tempo/SignatureEnvelope',
      'tempo/ZoneRpcAuthentication',
    ])
      reencode(`ox/${module}:serialize`, `ox/${module}:deserialize`)
    reencode(
      'ox/tempo/ReceivePolicyReceipt:encode',
      'ox/tempo/ReceivePolicyReceipt:decode',
    )
    reencode(
      'ox/tempo/SignaturePreAuthorized:wrap',
      'ox/tempo/SignaturePreAuthorized:unwrap',
    )
  }

  return props
}

/**
 * Hand-written argument sets for functions no property covers, or covers thinly. Empty today: the
 * corpus gives every public function recorded arguments, and properties cover the rest. Add sets
 * here for a function the speed recording stops reaching.
 */
export function seeds(_lib: Lib): Record<string, unknown[][]> {
  return {}
}

/** Helpers. */
const secp256k1N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const p256N =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n

/** The `{ bytes, position }` state Rlp's cursor functions read. */
function makeCursor(bytes: Uint8Array) {
  return { bytes, position: 0 }
}

function toHex(bytes: Uint8Array) {
  let out = '0x'
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

function toHex32(value: bigint) {
  return `0x${value.toString(16).padStart(64, '0')}`
}

function hexBytes(hex: string) {
  const body = hex.slice(2)
  const out = new Uint8Array(body.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(body.slice(i * 2, i * 2 + 2), 16)
  return out
}

/** Little-endian bytes of an unsigned integer. */
function le(value: bigint, size: number) {
  const out: number[] = []
  for (let i = 0; i < size; i++)
    out.push(Number((value >> BigInt(i * 8)) & 0xffn))
  return out
}

function trimBytes(bytes: Uint8Array, dir: string) {
  let start = 0
  let end = bytes.length
  if (dir === 'left') while (start < end - 1 && bytes[start] === 0) start++
  else while (end > start + 1 && bytes[end - 1] === 0) end--
  return bytes.slice(start, end)
}

function mapRlp(value: unknown, map: (item: Any) => unknown): Any {
  return Array.isArray(value)
    ? value.map((item) => mapRlp(item, map))
    : map(value)
}

/** `-0` as `0`, so a codec that writes zero without a sign still round-trips. */
function normalizeZero(value: unknown): unknown {
  if (Object.is(value, -0)) return 0
  if (Array.isArray(value)) return value.map(normalizeZero)
  if (isPlain(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeZero(item)]),
    )
  return value
}

function containsBigint(value: unknown): boolean {
  if (typeof value === 'bigint') return true
  if (Array.isArray(value)) return value.some(containsBigint)
  if (value && typeof value === 'object')
    return Object.values(value).some(containsBigint)
  return false
}

/** RFC 8785 (JCS) for JSON values: sorted keys by UTF-16 code units, ES number formatting. */
function jcs(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(jcs).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${jcs((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`
  return JSON.stringify(Object.is(value, -0) ? 0 : value)
}

/** An ABI item or parameter list with only the fields that describe it, for comparisons. */
function stripAbi(value: Any): Any {
  if (Array.isArray(value)) return value.map(stripAbi)
  if (!value || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const key of [
    'type',
    'name',
    'components',
    'inputs',
    'outputs',
    'indexed',
    'stateMutability',
    'anonymous',
  ])
    if (value[key] !== undefined && value[key] !== false)
      out[key] = stripAbi(value[key])
  if (out.name === '') delete out.name
  return out
}

/** A plain object (not an array, bytes, a date, or a class instance). */
function isPlain(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** Hex strings lowercased, recursively, for comparisons that ignore checksum case. */
function canonicalHex(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('0x'))
    return value.toLowerCase()
  if (Array.isArray(value)) return value.map(canonicalHex)
  if (isPlain(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, canonicalHex(item)]),
    )
  return value
}

/** Odd-length hex with its leading zero nibble, which ethers' RLP needs. */
function evenHex(hex: string) {
  return hex.length % 2 ? `0x0${hex.slice(2)}` : hex
}

/** Hex strings lowercased and empty values (`0x`, `undefined`) left out, recursively. */
function withoutEmpty(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutEmpty)
  if (isPlain(value))
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== '0x')
        .map(([key, item]) => [key, withoutEmpty(item)]),
    )
  return canonicalHex(value)
}

/** ArrayBuffers and typed arrays as hex, recursively, so options compare by content. */
function canonicalBuffers(value: unknown): unknown {
  if (value instanceof ArrayBuffer) return toHex(new Uint8Array(value))
  if (ArrayBuffer.isView(value))
    return toHex(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    )
  if (Array.isArray(value)) return value.map(canonicalBuffers)
  if (isPlain(value))
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, canonicalBuffers(item)]),
    )
  return value
}

function short(name: string) {
  return name.split(':')[1] ?? name
}

function siteOf(error: unknown) {
  const stack = String((error as Error)?.stack ?? '')
  for (const line of stack.split('\n').slice(1)) {
    const match = line.match(/\(?(?:file:\/\/)?([^\s()]+):(\d+):\d+\)?$/)
    if (!match || /fuzz-|node:|fast-check/.test(match[1]!)) continue
    return `${match[1]!.replace(/^.*\/src\/_esm\//, 'src/_esm/').replace(/^.*\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?/, '')}:${match[2]}`
  }
  return undefined
}

function show(value: unknown): string {
  const text = JSON.stringify(value, (_, item) =>
    typeof item === 'bigint'
      ? `${item}n`
      : item instanceof Uint8Array
        ? `bytes(${toHex(item)})`
        : item === undefined
          ? 'undefined'
          : item,
  )
  if (text === undefined) return String(value)
  return text.length > 240 ? `${text.slice(0, 239)}…` : text
}

/** Drops fields left out or set to a default (`undefined`, `null`, `0`, `0n`, zero hex, `[]`, `false`). */
function withoutDefaults(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutDefaults)
  if (isPlain(value))
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, withoutDefaults(item)] as const)
        .filter(([, item]) => !isDefault(item)),
    )
  return value
}

function hasNaN(value: unknown, depth: number): boolean {
  if (Number.isNaN(value)) return true
  if (depth > 8 || !value || typeof value !== 'object') return false
  return Object.values(value).some((item) => hasNaN(item, depth + 1))
}

function isDefault(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === 0 ||
    value === 0n ||
    value === false ||
    (typeof value === 'string' && /^0x0*$/.test(value)) ||
    (Array.isArray(value) && value.length === 0)
  )
}

/** The first path where a field of `a` is missing or different in `b`, with both values. */
function changedField(
  a: unknown,
  b: unknown,
  at: string,
): [string, unknown, unknown] | undefined {
  if (equal(a, b)) return undefined
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${at}.length`, a.length, b.length]
    for (const [i, item] of a.entries()) {
      const found = changedField(item, b[i], `${at}[${i}]`)
      if (found) return found
    }
    return undefined
  }
  if (isPlain(a) && isPlain(b)) {
    for (const [key, item] of Object.entries(a)) {
      const found = changedField(item, b[key], `${at}.${key}`)
      if (found) return found
    }
    return undefined
  }
  return [at, a, b]
}

/** The first path where `a` has a field (or array item) that `b` lacks, with `a`'s value. */
function lostField(
  a: unknown,
  b: unknown,
  at: string,
): [string, unknown] | undefined {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return undefined
    if (b.length < a.length) return [`${at}[${b.length}]`, a[b.length]]
    for (const [i, item] of a.entries()) {
      const found = lostField(item, b[i], `${at}[${i}]`)
      if (found) return found
    }
    return undefined
  }
  if (!isPlain(a) || !isPlain(b)) return undefined
  for (const [key, item] of Object.entries(a)) {
    if (!(key in b)) return [`${at}.${key}`, item]
    const found = lostField(item, b[key], `${at}.${key}`)
    if (found) return found
  }
  return undefined
}

/** The first path at which two values differ, with the two values there. */
function difference(
  a: unknown,
  b: unknown,
  at: string,
): [string, unknown, unknown] | undefined {
  if (equal(a, b)) return undefined
  if (
    a &&
    b &&
    typeof a === 'object' &&
    typeof b === 'object' &&
    Array.isArray(a) === Array.isArray(b) &&
    !(a instanceof Uint8Array) &&
    !(b instanceof Uint8Array) &&
    !(a instanceof Date) &&
    !(b instanceof Date)
  ) {
    if (Array.isArray(a) && a.length !== (b as unknown[]).length)
      return [`${at}.length`, a.length, (b as unknown[]).length]
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const found = difference(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        Array.isArray(a) ? `${at}[${key}]` : `${at}.${key}`,
      )
      if (found) return found
    }
  }
  return [at, a, b]
}

function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a instanceof Uint8Array && b instanceof Uint8Array)
    return a.length === b.length && a.every((byte, i) => byte === b[i])
  if (a instanceof Date || b instanceof Date)
    return (
      a instanceof Date &&
      b instanceof Date &&
      Object.is(a.getTime(), b.getTime())
    )
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, i) => equal(item, b[i]))
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    if (a instanceof Uint8Array !== b instanceof Uint8Array) return false
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      const x = (a as Record<string, unknown>)[key]
      const y = (b as Record<string, unknown>)[key]
      if (x === undefined && y === undefined) continue
      if (!equal(x, y)) return false
    }
    return true
  }
  return false
}
