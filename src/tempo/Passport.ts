import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Poseidon from './internal/poseidon.js'
import * as ZkSignature from './ZkSignature.js'

/**
 * Scheme identifier of ICAO TD3 passports with RSA Active Authentication.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142)
 */
export const scheme = 2

/** Depth of a document signer tree, `DSC_TREE_DEPTH`. */
export const treeDepth = 16

/** The fields of a passport's machine readable zone that scheme `0x02` hashes. */
export type Mrz = {
  /** Date of birth, `YYMMDD`. */
  birthDate: string
  /** Document number, 9 characters with `<` fillers. */
  documentNumber: string
  /** Issuing state's MRZ code, 3 characters with `<` fillers, such as `D<<`. */
  issuingState: string
}

/** A document signer tree's root, and a leaf's index and Merkle siblings in it. */
export type Path = {
  /** Index of the leaf in the sorted tree. */
  index: number
  /** Sibling hashes from the leaf up to the root. */
  path: readonly Hex.Hex[]
  /** The tree's root, its `key_hash`. */
  root: Hex.Hex
}

/** The [owner binding](https://docs.tempo.xyz/protocol/tips/tip-1142#owner-bindings) typed data for an account. */
export type BindingTypedData = {
  domain: { chainId: number | bigint; name: 'Tempo Passport'; version: '1' }
  message: { account: Address.Address }
  primaryType: 'PassportOwner'
  types: {
    PassportOwner: readonly [{ name: 'account'; type: 'address' }]
  }
}

// `61 5B 5F 1F 58`: the EF.DG1 template and MRZ tags for an 88-character TD3 MRZ.
const dg1Prefix = '0x615b5f1f58'

/**
 * Reads the fields scheme `0x02` hashes from a passport's EF.DG1.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const mrz = Passport.fromDg1('0x615b5f1f58...')
 * // @log: { birthDate: '740812', documentNumber: 'L898902C3', issuingState: 'UTO' }
 * ```
 *
 * @param dg1 - EF.DG1, as read from the chip.
 * @returns The issuing state, document number, and date of birth.
 */
export function fromDg1(dg1: Hex.Hex | Bytes.Bytes): Mrz {
  const bytes = Bytes.from(dg1)
  if (bytes.length !== 93 || Hex.fromBytes(bytes.slice(0, 5)) !== dg1Prefix)
    throw new InvalidDataGroupError({ reason: 'not a TD3 EF.DG1' })
  const mrz = Bytes.toString(bytes.slice(5))
  if (mrz[0] !== 'P')
    throw new InvalidDataGroupError({ reason: 'not a passport' })
  return {
    birthDate: mrz.slice(57, 63),
    documentNumber: mrz.slice(44, 53),
    issuingState: mrz.slice(2, 5),
  }
}

export declare namespace fromDg1 {
  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidDataGroupError
    | Errors.GlobalErrorType
}

/**
 * Computes the address seed of a passport:
 * `Poseidon(2, hash_bytes(document_number, 9), hash_bytes(birth_date, 6), salt)`.
 *
 * With the issuer and publisher, the address seed fixes the passport's address.
 * The salt keeps the address from revealing the document number and date of birth.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const addressSeed = Passport.getAddressSeed({
 *   birthDate: '740812',
 *   documentNumber: 'L898902C3',
 *   salt: '0x01d2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60'
 * })
 * ```
 *
 * @param options - The passport's document number and date of birth, and its salt.
 * @returns The address seed, as a 32-byte field element.
 */
export function getAddressSeed(options: getAddressSeed.Options): Hex.Hex {
  const { birthDate, documentNumber, salt } = options
  return fromField(
    Poseidon.hash([
      2n,
      hashField('documentNumber', documentNumber, 9),
      hashField('birthDate', birthDate, 6),
      toField(salt, 'salt'),
    ]),
  )
}

export declare namespace getAddressSeed {
  type Options = Pick<Mrz, 'birthDate' | 'documentNumber'> & {
    /** The passport's salt, as a field element. */
    salt: Hex.Hex
  }

  type ErrorType =
    | InvalidFieldElementError
    | InvalidFieldLengthError
    | Errors.GlobalErrorType
}

/**
 * Returns the typed data of an [owner binding](https://docs.tempo.xyz/protocol/tips/tip-1142#owner-bindings):
 * `PassportOwner(address account)`.
 *
 * A passport signs its binding once, as a message signature, to show it holds its
 * chip and owns the account.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 * import { Passport } from 'ox/tempo'
 *
 * const typedData = Passport.getBindingTypedData({
 *   account: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217
 * })
 * const payload = TypedData.getSignPayload(typedData)
 * ```
 *
 * @param options - The account and chain the binding names.
 * @returns The typed data.
 */
export function getBindingTypedData(
  options: getBindingTypedData.Options,
): BindingTypedData {
  const { account, chainId } = options
  Address.assert(account, { strict: false })
  return {
    domain: { chainId, name: 'Tempo Passport', version: '1' },
    message: { account },
    primaryType: 'PassportOwner',
    types: { PassportOwner: [{ name: 'account', type: 'address' }] },
  }
}

export declare namespace getBindingTypedData {
  type Options = {
    /** The configurable account the passport owns. */
    account: Address.Address
    /** The chain the account is on. */
    chainId: number | bigint
  }

  type ErrorType = Address.assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the 8-byte Active Authentication challenge (`RND.IFD`) to send the chip:
 * `be8(Poseidon(commit_a, commit_b, blinding) mod 2^64)`.
 *
 * The challenge commits to an access key and expiry, for an owner approval, or to
 * a message, for a message signature. A new blinding value for each signature keeps
 * it from revealing what it commits to.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 * import { Passport } from 'ox/tempo'
 *
 * const payload = TypedData.getSignPayload(
 *   Passport.getBindingTypedData({
 *     account: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *     chainId: 4217
 *   })
 * )
 *
 * const challenge = Passport.getChallenge({
 *   blinding: Passport.randomBlinding(),
 *   payload
 * })
 * ```
 *
 * @param options - The access key and expiry, or the message payload, and the blinding value.
 * @returns The challenge, as 8 bytes.
 */
export function getChallenge(options: getChallenge.Options): Hex.Hex {
  const { blinding } = options
  const hash = Poseidon.hash([
    ...getCommits(options),
    toField(blinding, 'blinding'),
  ])
  return Hex.fromNumber(hash % 2n ** 64n, { size: 8 })
}

export declare namespace getChallenge {
  type Options = Form & {
    /** A new random field element for each signature. See {@link ox#Passport.(randomBlinding:function)}. */
    blinding: Hex.Hex
  }

  type ErrorType =
    | Address.assert.ErrorType
    | InvalidFieldElementError
    | InvalidFieldLengthError
    | InvalidTimestampError
    | Errors.GlobalErrorType
}

/**
 * Computes a proof's public input:
 * `Poseidon(2, issuer, key_hash, address_seed, commit_a, commit_b, issued_at)`.
 *
 * A prover returns this value with its proof. Checking it against the statement
 * confirms the proof is for the expected passport, root, and commitment.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const publicInput = Passport.getPublicInput({
 *   addressSeed: '0x...',
 *   issuedAt: 1760000000,
 *   issuer: Passport.hashIssuer('UTO'),
 *   keyHash: '0x...',
 *   payload: '0x...'
 * })
 * ```
 *
 * @param options - The statement the proof attests to.
 * @returns The public input, as a 32-byte field element.
 */
export function getPublicInput(options: getPublicInput.Options): Hex.Hex {
  const { addressSeed, issuedAt, issuer, keyHash } = options
  return fromField(
    Poseidon.hash([
      BigInt(scheme),
      toField(issuer, 'issuer'),
      toField(keyHash, 'keyHash'),
      toField(addressSeed, 'addressSeed'),
      ...getCommits(options),
      toTimestamp(issuedAt, 'issuedAt'),
    ]),
  )
}

export declare namespace getPublicInput {
  type Options = Form & {
    /** The passport's address seed. See {@link ox#Passport.(getAddressSeed:function)}. */
    addressSeed: Hex.Hex
    /** When the chip signed, in seconds. The chip does not attest it. */
    issuedAt: number
    /** The issuer hash. See {@link ox#Passport.(hashIssuer:function)}. */
    issuer: Hex.Hex
    /** The document signer tree's root. See {@link ox#Passport.(getPath:function)}. */
    keyHash: Hex.Hex
  }

  type ErrorType =
    | Address.assert.ErrorType
    | InvalidFieldElementError
    | InvalidFieldLengthError
    | InvalidTimestampError
    | Errors.GlobalErrorType
}

/**
 * Computes a document signer tree's root, and a leaf's index and Merkle siblings in it.
 *
 * The tree has depth `DSC_TREE_DEPTH`. Its leaves are the distinct leaf values in
 * ascending order, padded with zeros, and each node is `Poseidon(left, right)`.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#document-signer-trees)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const leaf = Passport.hashLeaf('0x...')
 * const { index, path, root } = Passport.getPath({
 *   leaf,
 *   leaves: [leaf, Passport.hashLeaf('0x...')]
 * })
 * ```
 *
 * @param options - The leaf, and every leaf of its issuing state's tree.
 * @returns The root, and the leaf's index and siblings.
 */
export function getPath(options: getPath.Options): Path {
  const { leaf, leaves } = options
  const levels = buildTree(leaves)
  const value = toField(leaf, 'leaf')
  let index = levels[0]!.indexOf(value)
  if (index === -1) throw new LeafNotFoundError({ leaf })
  const result = { index, root: fromField(levels[treeDepth]![0]!) }
  const path: Hex.Hex[] = []
  for (let depth = 0; depth < treeDepth; depth++) {
    path.push(fromField(levels[depth]![index ^ 1] ?? zeros[depth]!))
    index >>= 1
  }
  return { ...result, path }
}

export declare namespace getPath {
  type Options = {
    /** The leaf. See {@link ox#Passport.(hashLeaf:function)}. */
    leaf: Hex.Hex
    /** Every leaf of the issuing state's tree, in any order. */
    leaves: readonly Hex.Hex[]
  }

  type ErrorType =
    | getRoot.ErrorType
    | LeafNotFoundError
    | Errors.GlobalErrorType
}

/**
 * Computes a document signer tree's root, its `key_hash`.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#document-signer-trees)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const root = Passport.getRoot({
 *   leaves: [Passport.hashLeaf('0x...')]
 * })
 * ```
 *
 * @param options - Every leaf of the issuing state's tree.
 * @returns The root, as a 32-byte field element.
 */
export function getRoot(options: getRoot.Options): Hex.Hex {
  return fromField(buildTree(options.leaves)[treeDepth]![0]!)
}

export declare namespace getRoot {
  type Options = {
    /** Every leaf of the issuing state's tree, in any order. */
    leaves: readonly Hex.Hex[]
  }

  type ErrorType =
    | InvalidFieldElementError
    | TreeTooLargeError
    | Errors.GlobalErrorType
}

/**
 * Computes the issuer hash of an issuing state: `hash_bytes(issuing_state, 3)`.
 *
 * The issuing state is its MRZ code, fillers included, so Germany is `D<<`.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const issuer = Passport.hashIssuer('UTO')
 * ```
 *
 * @param issuingState - The issuing state's 3-character MRZ code.
 * @returns The issuer hash, as a 32-byte field element.
 */
export function hashIssuer(issuingState: string): Hex.Hex {
  return fromField(hashField('issuingState', issuingState, 3))
}

export declare namespace hashIssuer {
  type ErrorType = InvalidFieldLengthError | Errors.GlobalErrorType
}

/**
 * Computes a document signer's leaf: `Poseidon(2, hash_bytes(n as 256 big-endian bytes, 256))`.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const leaf = Passport.hashLeaf('0x...')
 * ```
 *
 * @param modulus - The document signer's 2048-bit RSA modulus, as 256 big-endian bytes.
 * @returns The leaf, as a 32-byte field element.
 */
export function hashLeaf(modulus: Hex.Hex | Bytes.Bytes): Hex.Hex {
  const bytes = Bytes.from(modulus)
  if (bytes.length !== 256 || (bytes[0]! & 0x80) === 0)
    throw new UnsupportedKeyError({ reason: 'modulus is not 2048 bits' })
  return fromField(Poseidon.hash([2n, hashBytes(bytes, 256)]))
}

export declare namespace hashLeaf {
  type ErrorType =
    | Bytes.from.ErrorType
    | UnsupportedKeyError
    | Errors.GlobalErrorType
}

/**
 * Generates a random blinding value for {@link ox#Passport.(getChallenge:function)}.
 *
 * 31 random bytes always lie below the BN254 scalar field modulus.
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const blinding = Passport.randomBlinding()
 * ```
 *
 * @returns A random field element, as 32 bytes.
 */
export function randomBlinding(): Hex.Hex {
  return Hex.padLeft(Hex.fromBytes(Bytes.random(31)), 32)
}

/** What a challenge commits to: an access key and expiry, or a message payload. */
type Form =
  | {
      /** Address of the access key an owner approval commits to. */
      accessKeyAddress: Address.Address
      /** When the owner approval expires, in seconds. */
      validUntil: number
      payload?: undefined
    }
  | {
      /** The 32-byte digest of the message, such as an EIP-712 sign payload. */
      payload: Hex.Hex
      accessKeyAddress?: undefined
      validUntil?: undefined
    }

// Zero subtree hashes by depth, for padding.
const zeros = (() => {
  const values = [0n]
  for (let depth = 0; depth < treeDepth; depth++)
    values.push(Poseidon.hash([values[depth]!, values[depth]!]))
  return values
})()

// Hashes only the nodes above real leaves; padding uses the zero subtree hashes.
function buildTree(leaves: readonly Hex.Hex[]): bigint[][] {
  const values = [...new Set(leaves.map((leaf) => toField(leaf, 'leaf')))].sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  )
  if (values.length > 2 ** treeDepth)
    throw new TreeTooLargeError({ size: values.length })
  const levels = [values]
  for (let depth = 0; depth < treeDepth; depth++) {
    const level = levels[depth]!
    const next: bigint[] = []
    for (let i = 0; i < level.length; i += 2)
      next.push(Poseidon.hash([level[i]!, level[i + 1] ?? zeros[depth]!]))
    levels.push(next.length ? next : [zeros[depth + 1]!])
  }
  return levels
}

function getCommits(form: Form): [bigint, bigint] {
  if (form.payload !== undefined) {
    if (!Hex.validate(form.payload) || Hex.size(form.payload) !== 32)
      throw new InvalidFieldLengthError({
        expected: 32,
        name: 'payload',
        size: Hex.validate(form.payload) ? Hex.size(form.payload) : 0,
      })
    return [
      Hex.toBigInt(form.payload) % Poseidon.fieldModulus,
      ZkSignature.messageTag,
    ]
  }
  Address.assert(form.accessKeyAddress, { strict: false })
  return [
    Hex.toBigInt(form.accessKeyAddress),
    toTimestamp(form.validUntil, 'validUntil'),
  ]
}

// `hash_bytes(b, max_len)`: the length, then 31-byte big-endian chunks of `b`, zero-padded.
function hashBytes(bytes: Bytes.Bytes, maxLength: number): bigint {
  const chunks: bigint[] = []
  for (let offset = 0; offset < maxLength; offset += 31) {
    const chunk = Bytes.padRight(bytes.slice(offset, offset + 31), 31)
    chunks.push(Bytes.toBigInt(chunk))
  }
  return Poseidon.hash([BigInt(bytes.length), ...chunks])
}

// MRZ fields have fixed widths, so each must be exactly `length` characters.
function hashField(name: string, value: string, length: number): bigint {
  const bytes = Bytes.fromString(value)
  if (bytes.length !== length)
    throw new InvalidFieldLengthError({
      expected: length,
      name,
      size: bytes.length,
    })
  return hashBytes(bytes, length)
}

function fromField(value: bigint): Hex.Hex {
  return Hex.fromNumber(value, { size: 32 })
}

function toField(value: Hex.Hex, name: string): bigint {
  const field = Hex.toBigInt(value)
  if (field >= Poseidon.fieldModulus)
    throw new InvalidFieldElementError({ name, value })
  return field
}

function toTimestamp(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new InvalidTimestampError({ name, value })
  return BigInt(value)
}

/** Thrown when a data group is not one scheme `0x02` accepts. */
export class InvalidDataGroupError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidDataGroupError'
  constructor({ reason }: { reason: string }) {
    super(`The data group is invalid: ${reason}.`)
  }
}

/** Thrown when a value is not a BN254 scalar field element. */
export class InvalidFieldElementError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidFieldElementError'
  constructor({ name, value }: { name: string; value: string }) {
    super(
      `\`${name}\` (\`${value}\`) is not an element of the BN254 scalar field.`,
    )
  }
}

/** Thrown when a fixed-width field has the wrong length. */
export class InvalidFieldLengthError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidFieldLengthError'
  constructor({
    expected,
    name,
    size,
  }: {
    expected: number
    name: string
    size: number
  }) {
    super(`\`${name}\` is ${size} bytes; expected ${expected}.`)
  }
}

/** Thrown when a timestamp is not a whole, non-negative number of seconds. */
export class InvalidTimestampError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidTimestampError'
  constructor({ name, value }: { name: string; value: number }) {
    super(`\`${name}\` (\`${value}\`) is not a timestamp in seconds.`)
  }
}

/** Thrown when a leaf is not in the tree. */
export class LeafNotFoundError extends Errors.BaseError {
  override readonly name = 'Passport.LeafNotFoundError'
  constructor({ leaf }: { leaf: Hex.Hex }) {
    super(`The leaf \`${leaf}\` is not in the tree.`)
  }
}

/** Thrown when a tree has more leaves than its depth allows. */
export class TreeTooLargeError extends Errors.BaseError {
  override readonly name = 'Passport.TreeTooLargeError'
  constructor({ size }: { size: number }) {
    super(
      `The tree has ${size} leaves; a depth-${treeDepth} tree holds at most ${2 ** treeDepth}.`,
    )
  }
}

/** Thrown when a document signer key is outside what scheme `0x02` can prove for. */
export class UnsupportedKeyError extends Errors.BaseError {
  override readonly name = 'Passport.UnsupportedKeyError'
  constructor({ reason }: { reason: string }) {
    super(`The key is unsupported: ${reason}.`)
  }
}
