import {
  scryptMaxMemory,
  scryptScratchSize,
  wasmBase64,
} from './scrypt.wasm.js'
import * as internal from './instantiate.js'

/** Exports supplied by the standalone scrypt artifact. @internal */
export type Exports = {
  scrypt(
    password: number,
    passwordLength: number,
    salt: number,
    saltLength: number,
    N: number,
    r: number,
    p: number,
    out: number,
    outLength: number,
    B: number,
    V: number,
    tmp: number,
    scratch: number,
  ): void
  zero(ptr: number, length: number): void
}

const maximumWorkspace = 1024 ** 3 + 1024
const pow32 = 2 ** 32
const active = new WeakSet<internal.Module<Exports>>()

const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports>(wasmBase64),
)

/** Returns the one memoized scrypt instance shared by its providers. */
export function load() {
  return instantiate()
}

/** Derives a key through a loaded scrypt module. @internal */
export function derive(
  module: internal.Module<Exports>,
  password: Uint8Array,
  salt: Uint8Array,
  options: { N: number; dkLen: number; p: number; r: number },
): Uint8Array {
  const { N, dkLen, p, r } = options
  assertNumber(N, 'N')
  assertNumber(r, 'r')
  assertNumber(p, 'p')
  assertNumber(dkLen, 'dkLen')

  const blockSize = 128 * r
  if (N <= 1 || (N & (N - 1)) !== 0 || N > pow32)
    throw new Error('"N" expected a power of 2, and 2^1 <= N <= 2^32')
  if (p < 1 || p > ((pow32 - 1) * 32) / blockSize)
    throw new Error('"p" expected integer 1..((2^32 - 1) * 32) / (128 * r)')
  if (dkLen < 1 || dkLen > (pow32 - 1) * 32)
    throw new Error('"dkLen" expected integer 1..(2^32 - 1) * 32')

  const workspace = blockSize * (N + p + 1)
  if (workspace > maximumWorkspace)
    throw new Error(
      `"maxmem" limit was hit: memUsed(128*r*(N+p+1))=${workspace}, maxmem=${maximumWorkspace}`,
    )
  if (blockSize === 0) throw new Error('"dkLen" must be >= 1')

  const passwordPtr = module.heapBase
  const saltPtr = passwordPtr + password.length
  const outPtr = saltPtr + salt.length + 4
  const bPtr = align4(outPtr + dkLen)
  const bLength = blockSize * p
  const vPtr = align4(bPtr + bLength + 4)
  const vLength = blockSize * N
  const tmpPtr = vPtr + vLength
  const scratchPtr = align4(tmpPtr + blockSize)
  const end = scratchPtr + scryptScratchSize
  if (!Number.isSafeInteger(end) || end > scryptMaxMemory)
    throw new internal.MemoryError({
      bytes: end,
      cause: new RangeError('Scrypt workspace exceeds the WASM memory limit.'),
    })

  if (active.has(module))
    throw new Error('The scrypt WASM instance is already deriving a key.')
  active.add(module)

  const size = end - passwordPtr
  let reserved = false
  try {
    module.reserve(size)
    reserved = true
    const view = module.view()
    view.set(password, passwordPtr)
    view.set(salt, saltPtr)
    module.exports.scrypt(
      passwordPtr,
      password.length,
      saltPtr,
      salt.length,
      N,
      r,
      p,
      outPtr,
      dkLen,
      bPtr,
      vPtr,
      tmpPtr,
      scratchPtr,
    )
    return module.view().slice(outPtr, outPtr + dkLen)
  } finally {
    try {
      if (reserved) module.exports.zero(passwordPtr, size)
    } finally {
      active.delete(module)
    }
  }
}

function align4(value: number) {
  return Math.ceil(value / 4) * 4
}

function assertNumber(value: number, name: string) {
  if (typeof value !== 'number')
    throw new TypeError(`"${name}" expected number, got ${typeof value}`)
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`"${name}" expected integer >= 0, got ${value}`)
}
