import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Parsers for the vendored hash test vectors.
 *
 * See `README.md` in this directory for where each file comes from and why.
 */

const dir = import.meta.dirname

function read(file: string) {
  return fs.readFileSync(path.join(dir, file), 'utf8')
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index++)
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  return bytes
}

/** BLAKE3 team's official portable test vectors. */
export const blake3 = (() => {
  const parsed = JSON.parse(read('blake3.json')) as {
    cases: { hash: string; input_len: number }[]
  }
  return parsed.cases.map(({ hash, input_len }) => ({
    digest: fromHex(hash.slice(0, 64)),
    message: new Uint8Array(input_len).map((_, index) => index % 251),
  }))
})()

/**
 * Parses the `Len` / `Msg` / `MD` shape shared by the NIST CAVP response files
 * and the files pyca reformatted to match them.
 *
 * `Len` is in **bits**, and a zero-length message is written as `Msg = 00`
 * rather than as an empty string -- so `Len` is what decides how much of `Msg`
 * is real. Getting that wrong turns the empty-input case into a one-byte case,
 * which still passes against a matching bug in the implementation under test.
 */
function parseMsgDigest(file: string) {
  const vectors: { digest: Uint8Array; message: Uint8Array }[] = []
  let length: number | undefined
  let message: Uint8Array | undefined

  for (const line of read(file).split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') continue

    const [key, value] = trimmed.split(' = ')
    if (!key || value === undefined) continue

    if (key === 'Len') length = Number(value)
    else if (key === 'Msg') message = fromHex(value)
    else if (key === 'MD') {
      if (length === undefined || message === undefined)
        throw new Error(`Incomplete vector in ${file}: ${trimmed}`)
      vectors.push({
        digest: fromHex(value),
        message: message.slice(0, length / 8),
      })
      length = undefined
      message = undefined
    }
  }

  if (!vectors.length) throw new Error(`No vectors parsed from ${file}`)
  return vectors
}

/** Parses the `Len` / `Key` / `Msg` / `MD` shape used by the HMAC files. */
function parseHmac(file: string) {
  const vectors: {
    digest: Uint8Array
    key: Uint8Array
    message: Uint8Array
  }[] = []
  let key: Uint8Array | undefined
  let message: Uint8Array | undefined

  for (const line of read(file).split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') continue

    const [name, value] = trimmed.split(' = ')
    if (!name || value === undefined) continue

    // `Len` here is the message length in bits, but every RFC 4231 message is
    // byte-aligned and written in full, so it carries no information.
    if (name === 'Key') key = fromHex(value)
    else if (name === 'Msg') message = fromHex(value)
    else if (name === 'MD') {
      if (key === undefined || message === undefined)
        throw new Error(`Incomplete vector in ${file}: ${trimmed}`)
      vectors.push({ digest: fromHex(value), key, message })
      key = undefined
      message = undefined
    }
  }

  if (!vectors.length) throw new Error(`No vectors parsed from ${file}`)
  return vectors
}

/** Parses OpenSSL's `Digest` / `Input` / `Output` EVP shape. */
function parseEvp(file: string, digestName: string) {
  const vectors: { digest: Uint8Array; message: Uint8Array }[] = []
  let matched = false
  let message: Uint8Array | undefined

  for (const line of read(file).split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') continue

    const [name, value] = trimmed.split(' = ')
    if (!name || value === undefined) continue

    if (name === 'Digest') matched = value === digestName
    else if (!matched) continue
    // OpenSSL writes the empty input as `""` and everything else as bare hex.
    else if (name === 'Input')
      message = value === '""' ? new Uint8Array(0) : fromHex(value)
    else if (name === 'Output') {
      if (message === undefined)
        throw new Error(`Incomplete vector in ${file}: ${trimmed}`)
      vectors.push({ digest: fromHex(value), message })
      message = undefined
    }
  }

  if (!vectors.length)
    throw new Error(`No \`${digestName}\` vectors parsed from ${file}`)
  return vectors
}

/**
 * Parses XKCP's Keccak-f[1600] intermediate values.
 *
 * Each example gives the input state, the state after each of the 24 rounds
 * (the `After iota:` blocks), and the final state. States are 25 lanes written
 * as big-endian-looking 64-bit hex words, five per line -- but a Keccak lane is
 * little-endian in the byte-oriented state, which is why the byte dumps in the
 * same file read as the reverse of the words.
 */
function parseKeccakPermutation() {
  const text = read('KeccakF-1600-IntermediateValues.txt')
  const lines = text.split('\n')

  const roundConstants: bigint[] = []
  for (const line of lines) {
    const match = /^RC\[\d+\]\[0\]\[0\] = ([0-9A-F]{16})$/.exec(line.trim())
    if (match) roundConstants.push(BigInt(`0x${match[1]}`))
  }

  const rhoOffsets: number[] = []
  for (const line of lines) {
    const match = /^RhoOffset\[\d+\]\[\d+\] =\s+(\d+)$/.exec(line.trim())
    if (match) rhoOffsets.push(Number(match[1]))
  }

  /** Reads the 5 lines of lane words that follow `index`. */
  function readState(index: number) {
    const lanes: bigint[] = []
    for (let line = index; line < index + 5; line++)
      for (const word of lines[line]!.trim().split(/\s+/))
        lanes.push(BigInt(`0x${word}`))
    if (lanes.length !== 25)
      throw new Error(`Expected 25 lanes at line ${index}, got ${lanes.length}`)
    return lanes
  }

  const examples: { input: bigint[]; output: bigint[]; rounds: bigint[][] }[] =
    []
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index]!.startsWith('+++ Example')) continue

    let input: bigint[] | undefined
    const rounds: bigint[][] = []
    let output: bigint[] | undefined

    for (let line = index + 1; line < lines.length; line++) {
      if (lines[line]!.startsWith('+++ Example')) break
      if (lines[line]!.startsWith('Same, with lanes as 64-bit words:'))
        input ??= readState(line + 1)
      else if (lines[line]!.startsWith('After iota:'))
        rounds.push(readState(line + 1))
      else if (lines[line]!.startsWith('State after permutation:'))
        // The final state is written as a byte dump, but the last `After iota:`
        // block is the same state as lane words -- so use that.
        output = rounds.at(-1)
    }

    if (!input || !output || rounds.length !== 24)
      throw new Error(
        `Malformed permutation example at line ${index}: ${rounds.length} rounds`,
      )
    examples.push({ input, output, rounds })
  }

  if (examples.length !== 2)
    throw new Error(`Expected 2 permutation examples, got ${examples.length}`)

  return { examples, rhoOffsets, roundConstants }
}

/** NIST CAVP SHA-256, short and long messages. */
export const sha256 = [
  ...parseMsgDigest('SHA256ShortMsg.rsp'),
  ...parseMsgDigest('SHA256LongMsg.rsp'),
]

/** RFC 4231 HMAC-SHA-256. */
export const hmacSha256 = parseHmac('rfc-4231-sha256.txt')

/** RIPEMD-160 homepage reference vectors. */
export const ripemd160 = parseMsgDigest('ripemd160.txt')

/**
 * The RIPEMD-160 homepage's million-`a` case, which the vendored file omits.
 *
 * It is the only published RIPEMD-160 vector long enough to exercise the
 * multi-block path, so it is worth carrying separately.
 */
export const ripemd160MillionA = {
  digest: fromHex('52783243c1697bdbe16d37f97f68f08325dc1528'),
  message: new Uint8Array(1_000_000).fill(0x61),
}

/** OpenSSL's Keccak-256 digests. */
export const keccak256 = parseEvp('keccak256-openssl.txt', 'KECCAK-256')

/** XKCP's Keccak-f[1600] reference values. */
export const keccakPermutation = parseKeccakPermutation()
