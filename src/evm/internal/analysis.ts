import * as Hex from '../../core/Hex.js'

/** Static facts about a bytecode, computed once per code. */
export type Analysis = {
  /** One byte per code byte; 1 marks a `JUMPDEST` outside push data. */
  jumpdests: Uint8Array
}

export function analyze(code: Uint8Array): Analysis {
  const jumpdests = new Uint8Array(code.length)
  for (let i = 0; i < code.length; i++) {
    const op = code[i] as number
    if (op === 0x5b) jumpdests[i] = 1
    else if (op >= 0x60 && op <= 0x7f) i += op - 0x5f
  }
  return { jumpdests }
}

// Analysis is a pure function of the bytecode and costs about as much as
// executing it once, so repeated runs of the same code — the common shape for
// simulation and estimation — should not pay it again. Only `Hex` inputs cache:
// the string key is immutable and cheap to compare, whereas a caller can mutate
// a `Uint8Array` between runs, so an identity cache would serve jumpdests for
// bytes that are no longer there.
const byHex = new Map<Hex.Hex, { bytes: Uint8Array; analysis: Analysis }>()
const maxHexEntries = 64

/** Returns the bytes and analysis for a bytecode, caching `Hex` inputs. */
export function analyzed(bytecode: Hex.Hex | Uint8Array): {
  bytes: Uint8Array
  analysis: Analysis
} {
  if (typeof bytecode !== 'string')
    return { analysis: analyze(bytecode), bytes: bytecode }
  const cached = byHex.get(bytecode)
  if (cached) return cached
  const bytes = Hex.toBytes(bytecode)
  const entry = { analysis: analyze(bytes), bytes }
  if (byHex.size >= maxHexEntries)
    byHex.delete(byHex.keys().next().value as Hex.Hex)
  byHex.set(bytecode, entry)
  return entry
}
