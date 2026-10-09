import { sha1 } from '@noble/hashes/legacy'
import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as Der from './internal/der.js'
import * as Poseidon from './internal/poseidon.js'
import * as Rsa from './internal/rsa.js'
import * as ZkSignature from './ZkSignature.js'

/**
 * Scheme identifier of ICAO TD3 passports with RSA Active Authentication.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142)
 */
export const scheme = 2

/** Depth of a document signer tree, `DSC_TREE_DEPTH`. */
export const treeDepth = 16

/** Largest LDS security object scheme `0x02` can prove for, `MAX_ECONTENT_LEN`, in bytes. */
export const maxEContentSize = 576

/** Largest signed attributes scheme `0x02` can prove for, `MAX_SIGNED_ATTRS_LEN`, in bytes. */
export const maxSignedAttributesSize = 192

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

/** An RSA public key. */
export type PublicKey = {
  /** The public exponent. */
  exponent: bigint
  /** The modulus, as big-endian bytes without a sign byte. */
  modulus: Hex.Hex
}

/**
 * The parts of an EF.SOD (the document security object) that passive authentication and
 * scheme `0x02` use. See {@link ox#Passport.(fromSod:function)}.
 */
export type Sod = {
  /** The document signer certificate (DSC) that signed the SOD, DER-encoded. */
  certificate: Hex.Hex
  /** OID of the hash algorithm of the data group hashes, such as `2.16.840.1.101.3.4.2.1` (SHA-256). */
  dataGroupHashAlgorithm: string
  /** The data group hashes in the LDS security object, by data group number. */
  dataGroupHashes: Readonly<Record<number, Hex.Hex>>
  /** OID of the signer's digest algorithm, which hashes `eContent` and the signed attributes. */
  digestAlgorithm: string
  /** The LDS security object, the content the document signer signed. */
  eContent: Hex.Hex
  /** The value of the signed messageDigest attribute, the digest of `eContent`. */
  messageDigest: Hex.Hex
  /** The document signer's public key, from its certificate. */
  publicKey: PublicKey
  /** The document signer's signature over `signedAttributes`. */
  signature: Hex.Hex
  /** OID of the signature algorithm, such as `1.2.840.113549.1.1.11` (sha256WithRSAEncryption). */
  signatureAlgorithm: string
  /** The signed attributes as signed: DER, with the `SET OF` tag `31` (RFC 5652 section 5.4). */
  signedAttributes: Hex.Hex
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

// `DG15_PREFIX` and `DG15_SUFFIX`: an RSA SubjectPublicKeyInfo with a 1024-bit modulus and exponent 65537.
const dg15Prefix =
  '0x6f81a230819f300d06092a864886f70d010101050003818d0030818902818100'
const dg15Suffix = '0x0203010001'
const dg15Size = 165

// The messageDigest attribute up to its value: `30 2F 06 09 <id-messageDigest> 31 22 04 20`.
const messageDigestPrefix = Bytes.fromHex(
  '0x302f06092a864886f70d01090431220420',
)

const oids = {
  ldsSecurityObject: '2.23.136.1.1.1',
  messageDigest: '1.2.840.113549.1.9.4',
  rsaEncryption: '1.2.840.113549.1.1.1',
  sha256: '2.16.840.1.101.3.4.2.1',
  sha256WithRsaEncryption: '1.2.840.113549.1.1.11',
  signedData: '1.2.840.113549.1.7.2',
  subjectKeyIdentifier: '2.5.29.14',
} as const

/**
 * Asserts that a parsed EF.SOD uses the suite scheme `0x02` proves for: SHA-256 data group hashes
 * and digests, an RSASSA-PKCS1-v1_5 signature from a document signer with a 2048-bit modulus and
 * exponent 65537, and an LDS security object and signed attributes within `MAX_ECONTENT_LEN` and
 * `MAX_SIGNED_ATTRS_LEN`.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#assumptions)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const sod = Passport.fromSod('0x77...')
 * Passport.assertSod(sod)
 * ```
 *
 * @param sod - The parsed EF.SOD. See {@link ox#Passport.(fromSod:function)}.
 */
export function assertSod(sod: Sod): void {
  const {
    dataGroupHashAlgorithm,
    digestAlgorithm,
    eContent,
    publicKey,
    signatureAlgorithm,
    signedAttributes,
  } = sod
  if (dataGroupHashAlgorithm !== oids.sha256)
    throw new UnsupportedSodError({
      reason: 'data group hashes are not SHA-256',
    })
  if (digestAlgorithm !== oids.sha256)
    throw new UnsupportedSodError({ reason: 'the digest is not SHA-256' })
  if (
    signatureAlgorithm !== oids.sha256WithRsaEncryption &&
    signatureAlgorithm !== oids.rsaEncryption
  )
    throw new UnsupportedSodError({
      reason: `signature algorithm \`${signatureAlgorithm}\` is not RSASSA-PKCS1-v1_5`,
    })
  assertDscKey(publicKey)
  if (Hex.size(eContent) > maxEContentSize)
    throw new UnsupportedSodError({
      reason: `the LDS security object is ${Hex.size(eContent)} bytes; at most ${maxEContentSize} are supported`,
    })
  if (Hex.size(signedAttributes) > maxSignedAttributesSize)
    throw new UnsupportedSodError({
      reason: `the signed attributes are ${Hex.size(signedAttributes)} bytes; at most ${maxSignedAttributesSize} are supported`,
    })
}

export declare namespace assertSod {
  type ErrorType =
    | UnsupportedKeyError
    | UnsupportedSodError
    | Errors.GlobalErrorType
}

/**
 * Reads the RSA public key of an X.509 certificate, such as a document signer certificate.
 *
 * Publishers read each listed document signer's modulus to compute its leaf. See
 * {@link ox#Passport.(hashLeaf:function)}. The certificate's own signature is not checked.
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const { modulus } = Passport.fromCertificate('0x3082...')
 * const leaf = Passport.hashLeaf(modulus)
 * ```
 *
 * @param certificate - The DER-encoded certificate.
 * @returns The certificate's RSA public key.
 */
export function fromCertificate(certificate: Hex.Hex | Bytes.Bytes): PublicKey {
  try {
    const element = Der.decode(Bytes.from(certificate), 0x30)
    return readPublicKey(readCertificate(element).spki)
  } catch (error) {
    if (error instanceof Der.DecodeError)
      throw new InvalidCertificateError({ reason: error.message })
    throw error
  }
}

export declare namespace fromCertificate {
  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidCertificateError
    | UnsupportedKeyError
    | Errors.GlobalErrorType
}

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
 * Reads the Active Authentication modulus from a passport's EF.DG15.
 *
 * Scheme `0x02` accepts only an RSA key with a 1024-bit modulus and exponent 65537, encoded
 * exactly as `DG15_PREFIX || n_aa || DG15_SUFFIX`, 165 bytes.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#constraints)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const modulus = Passport.fromDg15('0x6f81a2...')
 * ```
 *
 * @param dg15 - EF.DG15, as read from the chip.
 * @returns The chip's 1024-bit RSA modulus, as 128 big-endian bytes.
 */
export function fromDg15(dg15: Hex.Hex | Bytes.Bytes): Hex.Hex {
  const bytes = Bytes.from(dg15)
  if (
    bytes.length !== dg15Size ||
    Hex.fromBytes(bytes.slice(0, 32)) !== dg15Prefix ||
    Hex.fromBytes(bytes.slice(160)) !== dg15Suffix
  )
    throw new InvalidDataGroupError({
      reason: 'not an EF.DG15 with a 1024-bit RSA key and exponent 65537',
    })
  const modulus = bytes.slice(32, 160)
  if ((modulus[0]! & 0x80) === 0)
    throw new UnsupportedKeyError({
      reason: 'Active Authentication modulus is not 1024 bits',
    })
  return Hex.fromBytes(modulus)
}

export declare namespace fromDg15 {
  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidDataGroupError
    | UnsupportedKeyError
    | Errors.GlobalErrorType
}

/**
 * Parses a passport's EF.SOD: the `77` wrapper around a CMS `SignedData` (RFC 5652) whose
 * content is the LDS security object (ICAO 9303-10 section 4.6.2, 9303-12 section 6).
 *
 * Returns the parts passive authentication and scheme `0x02` use: the LDS security object and
 * its data group hashes, the signed attributes as signed, the messageDigest attribute, and the
 * document signer's signature, certificate, and public key. Parsing accepts any digest and
 * RSA signature algorithm, so check the suite with {@link ox#Passport.(assertSod:function)}, or verify the document with
 * {@link ox#Passport.(verifyDocument:function)}. A document signer without an RSA key throws.
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const sod = Passport.fromSod('0x77...')
 * const dg1Hash = sod.dataGroupHashes[1]
 * ```
 *
 * @param sod - EF.SOD, as read from the chip.
 * @returns The parsed SOD.
 */
export function fromSod(sod: Hex.Hex | Bytes.Bytes): Sod {
  try {
    return readSod(Bytes.from(sod))
  } catch (error) {
    if (error instanceof Der.DecodeError)
      throw new InvalidSodError({ reason: error.message })
    throw error
  }
}

export declare namespace fromSod {
  type ErrorType =
    | Bytes.from.ErrorType
    | InvalidSodError
    | UnsupportedKeyError
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

/**
 * Verifies a chip's Active Authentication response to a challenge: ISO/IEC 9796-2 scheme 1
 * with SHA-1, as scheme `0x02` constraints 9 and 10 check it.
 *
 * With `J = signature^65537 mod n_aa`, and `R = J` if `J` is even, else `n_aa - J`, `R` must be
 * `6A || M1 || SHA-1(M1 || challenge) || BC`, where `M1` is the chip's 106-byte nonce. Either
 * signature production function of ICAO 9303-11 section 6.1.2.2 verifies.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#constraints)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const valid = Passport.verifyActiveAuthentication({
 *   challenge: '0x0011223344556677',
 *   dg15: '0x6f81a2...',
 *   signature: '0x...'
 * })
 * ```
 *
 * @param options - The chip's EF.DG15, the challenge sent with INTERNAL AUTHENTICATE, and the chip's response.
 * @returns Whether the chip's key signed the challenge.
 */
export function verifyActiveAuthentication(
  options: verifyActiveAuthentication.Options,
): boolean {
  const modulus = Bytes.fromHex(fromDg15(options.dg15))
  const challenge = Bytes.from(options.challenge)
  if (challenge.length !== 8)
    throw new InvalidFieldLengthError({
      expected: 8,
      name: 'challenge',
      size: challenge.length,
    })
  const j = Rsa.open({
    exponent: 65537n,
    modulus,
    signature: Bytes.from(options.signature),
  })
  if (!j) return false
  const n = Bytes.toBigInt(modulus)
  const value = Bytes.toBigInt(j)
  const r = Bytes.fromNumber(value % 2n === 0n ? value : n - value, {
    size: 128,
  })
  if (r[0] !== 0x6a || r[127] !== 0xbc) return false
  const hash = sha1(Bytes.concat(r.subarray(1, 107), challenge))
  return Bytes.isEqual(hash, r.subarray(107, 127))
}

export declare namespace verifyActiveAuthentication {
  type Options = {
    /** The 8-byte challenge (`RND.IFD`). See {@link ox#Passport.(getChallenge:function)}. */
    challenge: Hex.Hex | Bytes.Bytes
    /** EF.DG15, as read from the chip. */
    dg15: Hex.Hex | Bytes.Bytes
    /** The chip's INTERNAL AUTHENTICATE response. */
    signature: Hex.Hex | Bytes.Bytes
  }

  type ErrorType =
    | fromDg15.ErrorType
    | InvalidFieldLengthError
    | Errors.GlobalErrorType
}

/**
 * Verifies a passport's data offchain, as scheme `0x02` constraints 1 through 7 check it
 * (passive authentication without the certificate chain):
 *
 * - the SOD uses the supported suite (see {@link ox#Passport.(assertSod:function)});
 * - the LDS security object contains the DataGroupHash entries `30 25 02 01 01 04 20 || SHA-256(dg1)`
 *   and `30 25 02 01 0F 04 20 || SHA-256(dg15)`;
 * - the signed attributes contain the messageDigest attribute with `SHA-256(eContent)`;
 * - the document signer's RSASSA-PKCS1-v1_5 SHA-256 signature over the signed attributes is valid.
 *
 * Passport apps call this before proving, so an unsupported or altered passport fails early.
 * It does not check that a CSCA issued the document signer: publishers do that before listing it.
 *
 * [TIP-1142](https://docs.tempo.xyz/protocol/tips/tip-1142#constraints)
 *
 * @example
 * ```ts twoslash
 * import { Passport } from 'ox/tempo'
 *
 * const { modulus, mrz } = Passport.verifyDocument({
 *   dg1: '0x615b5f1f58...',
 *   dg15: '0x6f81a2...',
 *   sod: '0x77...'
 * })
 * const leaf = Passport.hashLeaf(modulus)
 * ```
 *
 * @param options - EF.DG1, EF.DG15, and EF.SOD, as read from the chip.
 * @returns The document signer's modulus, the MRZ fields, and the parsed SOD.
 */
export function verifyDocument(
  options: verifyDocument.Options,
): verifyDocument.ReturnType {
  const dg1 = Bytes.from(options.dg1)
  const dg15 = Bytes.from(options.dg15)
  const mrz = fromDg1(dg1)
  fromDg15(dg15)
  const sod = fromSod(options.sod)
  assertSod(sod)

  const eContent = Bytes.fromHex(sod.eContent)
  for (const [dataGroup, value] of [
    [1, dg1],
    [15, dg15],
  ] as const)
    if (
      !includes(
        eContent,
        Bytes.concat(
          Bytes.from([0x30, 0x25, 0x02, 0x01, dataGroup, 0x04, 0x20]),
          Hash.sha256(value),
        ),
      )
    )
      throw new DataGroupHashMismatchError({ dataGroup })

  const signedAttributes = Bytes.fromHex(sod.signedAttributes)
  if (
    !includes(
      signedAttributes,
      Bytes.concat(messageDigestPrefix, Hash.sha256(eContent)),
    )
  )
    throw new MessageDigestMismatchError()

  const { exponent, modulus } = sod.publicKey
  if (
    !Rsa.verifyPkcs1Sha256({
      digest: Hash.sha256(signedAttributes),
      exponent,
      modulus: Bytes.fromHex(modulus),
      signature: Bytes.fromHex(sod.signature),
    })
  )
    throw new InvalidDocumentSignatureError()

  return { modulus, mrz, sod }
}

export declare namespace verifyDocument {
  type Options = {
    /** EF.DG1, as read from the chip. */
    dg1: Hex.Hex | Bytes.Bytes
    /** EF.DG15, as read from the chip. */
    dg15: Hex.Hex | Bytes.Bytes
    /** EF.SOD, as read from the chip. */
    sod: Hex.Hex | Bytes.Bytes
  }

  type ReturnType = {
    /** The document signer's 2048-bit modulus, as 256 big-endian bytes. See {@link ox#Passport.(hashLeaf:function)}. */
    modulus: Hex.Hex
    /** The fields scheme `0x02` hashes from the MRZ. */
    mrz: Mrz
    /** The parsed SOD. */
    sod: Sod
  }

  type ErrorType =
    | assertSod.ErrorType
    | DataGroupHashMismatchError
    | fromDg1.ErrorType
    | fromDg15.ErrorType
    | fromSod.ErrorType
    | InvalidDocumentSignatureError
    | MessageDigestMismatchError
    | Errors.GlobalErrorType
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

function assertDscKey(publicKey: PublicKey): void {
  const modulus = Bytes.fromHex(publicKey.modulus)
  if (modulus.length !== 256 || (modulus[0]! & 0x80) === 0)
    throw new UnsupportedKeyError({ reason: 'modulus is not 2048 bits' })
  if (publicKey.exponent !== 65537n)
    throw new UnsupportedKeyError({ reason: 'exponent is not 65537' })
}

function includes(bytes: Bytes.Bytes, pattern: Bytes.Bytes): boolean {
  outer: for (let i = 0; i + pattern.length <= bytes.length; i++) {
    for (let j = 0; j < pattern.length; j++)
      if (bytes[i + j] !== pattern[j]) continue outer
    return true
  }
  return false
}

type Certificate = {
  /** The certificate's issuer Name, DER. */
  issuer: Hex.Hex
  /** The certificate's serial number INTEGER, DER. */
  serialNumber: Hex.Hex
  /** The certificate's SubjectPublicKeyInfo. See `readPublicKey`. */
  spki: Der.Element
  subjectKeyIdentifier: Hex.Hex | undefined
}

// Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue } (RFC 5280).
function readCertificate(certificate: Der.Element): Certificate {
  const [tbs] = Der.children(certificate, [0x30, 0x30, 0x03])
  const fields = Der.children(tbs!)
  // The version is `[0] EXPLICIT` and absent for v1 certificates.
  const offset = fields[0]?.tag === 0xa0 ? 1 : 0
  const [serialNumber, , issuer, , , spki] = fields.slice(offset)
  if (!spki) throw new Der.DecodeError('truncated certificate')
  Der.expect(serialNumber!, 0x02)
  Der.expect(issuer!, 0x30)
  Der.expect(spki, 0x30)

  let subjectKeyIdentifier: Hex.Hex | undefined
  const extensions = fields.find((field) => field.tag === 0xa3)
  if (extensions) {
    const [list] = Der.children(extensions, [0x30])
    for (const extension of Der.children(list!)) {
      const [id, ...rest] = Der.children(extension, [0x06])
      if (Der.oid(id!) !== oids.subjectKeyIdentifier) continue
      const value = rest[rest.length - 1]!
      Der.expect(value, 0x04)
      subjectKeyIdentifier = Hex.fromBytes(
        Der.content(Der.decode(Der.content(value), 0x04)),
      )
    }
  }

  return {
    issuer: Hex.fromBytes(Der.encoded(issuer!)),
    serialNumber: Hex.fromBytes(Der.encoded(serialNumber!)),
    spki,
    subjectKeyIdentifier,
  }
}

// SubjectPublicKeyInfo ::= SEQUENCE { algorithm, subjectPublicKey BIT STRING } (RFC 5280).
function readPublicKey(spki: Der.Element): PublicKey {
  const [algorithm, key] = Der.children(spki, [0x30, 0x03])
  const keyAlgorithm = Der.algorithm(algorithm!)
  if (keyAlgorithm !== oids.rsaEncryption)
    throw new UnsupportedKeyError({
      reason: `key algorithm \`${keyAlgorithm}\` is not RSA`,
    })
  const bits = Der.content(key!)
  if (bits[0] !== 0) throw new Der.DecodeError('malformed public key')
  // RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER } (RFC 8017).
  const [modulus, exponent] = Der.children(
    Der.decode(bits.subarray(1), 0x30),
    [0x02, 0x02],
  )

  return {
    exponent: Bytes.toBigInt(Der.unsigned(exponent!)),
    modulus: Hex.fromBytes(Der.unsigned(modulus!)),
  }
}

// EF.SOD ::= [APPLICATION 23] ContentInfo, with SignedData content (RFC 5652 section 5).
function readSod(bytes: Bytes.Bytes): Sod {
  const [contentInfo] = Der.children(Der.decode(bytes, 0x77), [0x30])
  const [contentType, explicit] = Der.children(contentInfo!, [0x06, 0xa0])
  if (Der.oid(contentType!) !== oids.signedData)
    throw new Der.DecodeError('content is not SignedData')
  const [signedData] = Der.children(explicit!, [0x30])

  // SignedData ::= SEQUENCE { version, digestAlgorithms, encapContentInfo,
  //   certificates [0] IMPLICIT OPTIONAL, crls [1] IMPLICIT OPTIONAL, signerInfos }
  const [, , encapContentInfo, ...rest] = Der.children(
    signedData!,
    [0x02, 0x31, 0x30],
  )
  const certificates = rest.find((element) => element.tag === 0xa0)
  const signerInfos = rest[rest.length - 1]
  if (!signerInfos || signerInfos.tag !== 0x31)
    throw new Der.DecodeError('missing signer infos')

  // EncapsulatedContentInfo ::= SEQUENCE { eContentType, eContent [0] EXPLICIT OCTET STRING }
  const [eContentType, eContentWrapper] = Der.children(
    encapContentInfo!,
    [0x06, 0xa0],
  )
  if (Der.oid(eContentType!) !== oids.ldsSecurityObject)
    throw new Der.DecodeError('content is not an LDS security object')
  const [eContentElement] = Der.children(eContentWrapper!, [0x04])
  const eContent = Der.content(eContentElement!)

  // LDSSecurityObject ::= SEQUENCE { version, hashAlgorithm, dataGroupHashValues, ldsVersionInfo OPTIONAL }
  const [, hashAlgorithm, hashValues] = Der.children(
    Der.decode(eContent, 0x30),
    [0x02, 0x30, 0x30],
  )
  const dataGroupHashes: Record<number, Hex.Hex> = {}
  for (const entry of Der.children(hashValues!)) {
    const [number, hash] = Der.children(entry, [0x02, 0x04])
    const dataGroup = Der.integer(number!)
    if (dataGroup in dataGroupHashes)
      throw new Der.DecodeError(`data group ${dataGroup} is hashed twice`)
    dataGroupHashes[dataGroup] = Hex.fromBytes(Der.content(hash!))
  }

  const signers = Der.children(signerInfos)
  if (signers.length !== 1)
    throw new Der.DecodeError(`expected one signer, got ${signers.length}`)

  // SignerInfo ::= SEQUENCE { version, sid, digestAlgorithm, signedAttrs [0] IMPLICIT,
  //   signatureAlgorithm, signature OCTET STRING, unsignedAttrs [1] IMPLICIT OPTIONAL }
  const [, sid, digestAlgorithm, signedAttrs, signatureAlgorithm, signature] =
    Der.children(signers[0]!, [0x02, undefined, 0x30, 0xa0, 0x30, 0x04])

  // The signature covers the signed attributes with the `SET OF` tag in place of `[0]`.
  const signedAttributes = Bytes.concat(
    Bytes.from([0x31]),
    Der.encoded(signedAttrs!).subarray(1),
  )
  let messageDigest: Uint8Array | undefined
  for (const attribute of Der.children(signedAttrs!)) {
    const [type, values] = Der.children(attribute, [0x06, 0x31])
    if (Der.oid(type!) !== oids.messageDigest) continue
    const [value, ...others] = Der.children(values!, [0x04])
    if (messageDigest || others.length > 0)
      throw new Der.DecodeError('expected one messageDigest')
    messageDigest = Der.content(value!)
  }
  if (!messageDigest) throw new Der.DecodeError('missing messageDigest')

  const certificate = findCertificate(certificates, sid!)

  return {
    certificate: Hex.fromBytes(Der.encoded(certificate.element)),
    dataGroupHashAlgorithm: Der.algorithm(hashAlgorithm!),
    dataGroupHashes,
    digestAlgorithm: Der.algorithm(digestAlgorithm!),
    eContent: Hex.fromBytes(eContent),
    messageDigest: Hex.fromBytes(messageDigest),
    publicKey: readPublicKey(certificate.spki),
    signature: Hex.fromBytes(Der.content(signature!)),
    signatureAlgorithm: Der.algorithm(signatureAlgorithm!),
    signedAttributes: Hex.fromBytes(signedAttributes),
  }
}

// Finds the certificate a SignerInfo's `sid` names: by issuer and serial number, or by
// subject key identifier (`[0] IMPLICIT`).
function findCertificate(
  certificates: Der.Element | undefined,
  sid: Der.Element,
): Certificate & { element: Der.Element } {
  if (!certificates) throw new Der.DecodeError('missing certificates')
  let issuer: Hex.Hex | undefined
  let serialNumber: Hex.Hex | undefined
  let subjectKeyIdentifier: Hex.Hex | undefined
  if (sid.tag === 0x30) {
    const [name, serial] = Der.children(sid, [0x30, 0x02])
    issuer = Hex.fromBytes(Der.encoded(name!))
    serialNumber = Hex.fromBytes(Der.encoded(serial!))
  } else if (sid.tag === 0x80)
    subjectKeyIdentifier = Hex.fromBytes(Der.content(sid))
  else throw new Der.DecodeError('malformed signer identifier')

  for (const element of Der.children(certificates)) {
    if (element.tag !== 0x30) continue
    const certificate = readCertificate(element)
    if (
      subjectKeyIdentifier
        ? certificate.subjectKeyIdentifier === subjectKeyIdentifier
        : certificate.issuer === issuer &&
          certificate.serialNumber === serialNumber
    )
      return { ...certificate, element }
  }
  throw new Der.DecodeError('no certificate matches the signer')
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

/** Thrown when an LDS security object does not hash a data group to its value. */
export class DataGroupHashMismatchError extends Errors.BaseError {
  override readonly name = 'Passport.DataGroupHashMismatchError'
  constructor({ dataGroup }: { dataGroup: number }) {
    super(
      `The security object does not contain the SHA-256 hash of data group ${dataGroup}.`,
    )
  }
}

/** Thrown when a certificate is not well-formed. */
export class InvalidCertificateError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidCertificateError'
  constructor({ reason }: { reason: string }) {
    super(`The certificate is invalid: ${reason}.`)
  }
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

/** Thrown when an EF.SOD is not a well-formed document security object. */
export class InvalidSodError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidSodError'
  constructor({ reason }: { reason: string }) {
    super(`The SOD is invalid: ${reason}.`)
  }
}

/** Thrown when a document signer's signature over the signed attributes is invalid. */
export class InvalidDocumentSignatureError extends Errors.BaseError {
  override readonly name = 'Passport.InvalidDocumentSignatureError'
  constructor() {
    super(
      "The document signer's signature over the signed attributes is invalid.",
    )
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

/** Thrown when the signed messageDigest attribute is not the digest of the security object. */
export class MessageDigestMismatchError extends Errors.BaseError {
  override readonly name = 'Passport.MessageDigestMismatchError'
  constructor() {
    super(
      'The signed attributes do not contain the SHA-256 digest of the security object.',
    )
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

/** Thrown when an EF.SOD uses a suite or size scheme `0x02` cannot prove for. */
export class UnsupportedSodError extends Errors.BaseError {
  override readonly name = 'Passport.UnsupportedSodError'
  constructor({ reason }: { reason: string }) {
    super(`The SOD is unsupported: ${reason}.`)
  }
}
