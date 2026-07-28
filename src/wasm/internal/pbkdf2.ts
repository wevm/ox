import { pbkdf2Sha256ScratchSize } from './hashes.wasm.js'
import { MemoryError, type Module } from './instantiate.js'

/** WASM exports used by the PBKDF2-HMAC-SHA256 loader. @internal */
export type Exports = {
  pbkdf2_sha256(
    password: number,
    passwordLength: number,
    salt: number,
    saltLength: number,
    iterations: number,
    out: number,
    outLength: number,
    scratch: number,
  ): void
  zero(ptr: number, length: number): void
}

const maximumUint32 = 0xffff_ffff
const wasm32Size = 0x1_0000_0000

/** Calls PBKDF2-HMAC-SHA256 and clears its complete linear-memory region. */
export function pbkdf2Sha256(
  module: Module<Exports>,
  password: Uint8Array,
  salt: Uint8Array,
  options: { c: number; dkLen: number },
): Uint8Array {
  const { c, dkLen } = options
  assertPositiveUint32(c, 'c')
  assertPositiveUint32(dkLen, 'dkLen')

  const passwordLength = password.length
  const saltLength = salt.length
  if (saltLength > maximumUint32 - 4)
    throw new RangeError(
      `"salt" length must be <= ${maximumUint32 - 4}, got ${saltLength}`,
    )

  const passwordPtr = module.heapBase
  const saltPtr = passwordPtr + passwordLength
  const outPtr = saltPtr + saltLength + 4
  const scratchPtr = align4(outPtr + dkLen)
  const end = scratchPtr + pbkdf2Sha256ScratchSize
  if (!Number.isSafeInteger(end) || end > wasm32Size)
    throw new MemoryError({
      bytes: end,
      cause: new RangeError('PBKDF2 workspace exceeds wasm32 memory.'),
    })

  module.reserve(end - passwordPtr)
  const view = module.view()
  try {
    view.set(password, passwordPtr)
    view.set(salt, saltPtr)
    module.exports.pbkdf2_sha256(
      passwordPtr,
      passwordLength,
      saltPtr,
      saltLength,
      c,
      outPtr,
      dkLen,
      scratchPtr,
    )
    return module.view().slice(outPtr, outPtr + dkLen)
  } finally {
    // This includes the password, salt and counter, staged output, alignment
    // padding, and every byte of PBKDF2/HMAC working state.
    module.exports.zero(passwordPtr, end - passwordPtr)
  }
}

function align4(value: number) {
  return Math.ceil(value / 4) * 4
}

function assertPositiveUint32(value: number, name: string) {
  if (typeof value !== 'number')
    throw new TypeError(`"${name}" expected number, got ${typeof value}`)
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`"${name}" expected integer >= 0, got ${value}`)
  if (value < 1) throw new Error(`"${name}" must be >= 1`)
  if (value > maximumUint32)
    throw new RangeError(`"${name}" must be <= ${maximumUint32}, got ${value}`)
}
