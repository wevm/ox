import * as BlobCells from './BlobCells.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import type { Compute } from './internal/types.js'
import * as Kzg from './Kzg.js'

/** Blob limit per transaction. */
const blobsPerTransaction = 6

/** The number of bytes in a BLS scalar field element. */
export const bytesPerFieldElement = 32

/** The number of field elements in a blob. */
export const fieldElementsPerBlob = 4096

/** The number of bytes in a blob. */
export const bytesPerBlob = bytesPerFieldElement * fieldElementsPerBlob

/** Blob bytes limit per transaction. */
export const maxBytesPerTransaction =
  bytesPerBlob * blobsPerTransaction -
  // terminator byte (0x80).
  1 -
  // zero byte (0x00) appended to each field element.
  1 * fieldElementsPerBlob * blobsPerTransaction

/** Root type for a Blob. */
export type Blob<type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes> =
  type

/** A list of {@link ox#Blobs.Blob}. */
export type Blobs<type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes> =
  readonly Blob<type>[]

/**
 * Transform a list of Commitments to Blob Versioned Hashes.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes =
 *   Blobs.commitmentsToVersionedHashes(commitments) // [!code focus]
 * // @log: ['0x...', '0x...']
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Versioned Hashes with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(
 *   commitments,
 *   {
 *     as: 'Bytes' // [!code focus]
 *   }
 * )
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @example
 * ### Versioning Hashes
 *
 * It is possible to configure the version for the Versioned Hashes with the `version` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(
 *   commitments,
 *   {
 *     version: 2 // [!code focus]
 *   }
 * )
 * ```
 *
 * @param commitments - A list of commitments.
 * @param options - Options.
 * @returns A list of Blob Versioned Hashes.
 */
export function commitmentsToVersionedHashes<
  const commitments extends readonly Bytes.Bytes[] | readonly Hex.Hex[],
  as extends 'Hex' | 'Bytes' =
    | (commitments extends readonly Hex.Hex[] ? 'Hex' : never)
    | (commitments extends readonly Bytes.Bytes[] ? 'Bytes' : never),
>(
  commitments: commitments | readonly Bytes.Bytes[] | readonly Hex.Hex[],
  options: commitmentsToVersionedHashes.Options<as> = {},
): commitmentsToVersionedHashes.ReturnType<as> {
  const { version } = options

  const as =
    options.as ?? (typeof commitments[0] === 'string' ? 'Hex' : 'Bytes')

  const hashes: Uint8Array[] | Hex.Hex[] = []
  for (const commitment of commitments) {
    hashes.push(
      commitmentToVersionedHash(commitment, {
        as,
        version,
      }) as never,
    )
  }
  return hashes as never
}

export declare namespace commitmentsToVersionedHashes {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Version to tag onto the hashes. */
    version?: number | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Transform a Commitment to its Blob Versioned Hash.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHash =
 *   Blobs.commitmentToVersionedHash(commitment) // [!code focus]
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Versioned Hash with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentToVersionedHash(
 *   commitment,
 *   {
 *     as: 'Bytes' // [!code focus]
 *   }
 * )
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @example
 * ### Versioning Hashes
 *
 * It is possible to configure the version for the Versioned Hash with the `version` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentToVersionedHash(
 *   commitment,
 *   {
 *     version: 2 // [!code focus]
 *   }
 * )
 * ```
 *
 * @param commitment - The commitment.
 * @param options - Options.
 * @returns The Blob Versioned Hash.
 */
export function commitmentToVersionedHash<
  const commitment extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (commitment extends Hex.Hex ? 'Hex' : never)
    | (commitment extends Bytes.Bytes ? 'Bytes' : never),
>(
  commitment: commitment | Hex.Hex | Bytes.Bytes,
  options: commitmentToVersionedHash.Options<as> = {},
): commitmentToVersionedHash.ReturnType<as> {
  const { version = 1 } = options
  const as = options.as ?? (typeof commitment === 'string' ? 'Hex' : 'Bytes')

  const versionedHash = Hash.sha256(commitment, { as: 'Bytes' })
  versionedHash.set([version], 0)
  return (
    as === 'Bytes' ? versionedHash : Hex.fromBytes(versionedHash)
  ) as commitmentToVersionedHash.ReturnType<as>
}

export declare namespace commitmentToVersionedHash {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Version to tag onto the hash. */
    version?: number | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Transforms arbitrary data to {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * ```
 *
 * @example
 * ### Creating Blobs from a String
 *
 * An example of creating Blobs from a string using  {@link ox#Hex.(from:function)}:
 *
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from(Hex.fromString('Hello world!'))
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Blobs with the `as` option.
 *
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef', { as: 'Bytes' })
 * //    ^?
 * ```
 *
 * @param data - The data to convert to {@link ox#Blobs.Blobs}.
 * @param options - Options.
 * @returns The {@link ox#Blobs.Blobs}.
 */
export function from<
  const data extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (data extends Hex.Hex ? 'Hex' : never)
    | (data extends Bytes.Bytes ? 'Bytes' : never),
>(
  data: data | Hex.Hex | Bytes.Bytes,
  options: from.Options<as> = {},
): from.ReturnType<as> {
  const as = options.as ?? (typeof data === 'string' ? 'Hex' : 'Bytes')
  const data_ = (
    typeof data === 'string' ? Bytes.fromHex(data) : data
  ) as Bytes.Bytes

  const size_ = Bytes.size(data_)
  if (!size_) throw new EmptyBlobError()
  if (size_ > maxBytesPerTransaction)
    throw new BlobSizeTooLargeError({
      maxSize: maxBytesPerTransaction,
      size: size_,
    })

  const blobs: Bytes.Bytes[] = []

  let active = true
  let position = 0
  while (active) {
    const blob = new Uint8Array(bytesPerBlob)

    // Each field element is a zero byte, so it doesn't overflow the BLS
    // modulus, followed by 31 data bytes. The zero byte is already in place.
    // Copying byte by byte beats a `subarray` view plus `set` at this size, and
    // allocates nothing.
    for (
      let offset = 1;
      offset < bytesPerBlob;
      offset += bytesPerFieldElement
    ) {
      const length = Math.min(31, size_ - position)
      for (let i = 0; i < length; i++) blob[offset + i] = data_[position + i]!

      // A segment shorter than 31 bytes ends the data: push a terminator byte
      // to mark it.
      if (length < 31) {
        blob[offset + length] = 0x80
        active = false
        break
      }

      position += 31
    }

    blobs.push(blob)
  }

  return (as === 'Bytes' ? blobs : blobs.map((x) => Hex.fromBytes(x))) as never
}

export declare namespace from {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)

  type ErrorType =
    | BlobSizeTooLargeError
    | EmptyBlobError
    | Bytes.fromHex.ErrorType
    | Hex.fromBytes.ErrorType
    | Bytes.size.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.to(blobs) // [!code focus]
 * // @log: '0xdeadbeef'
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type with second argument.
 *
 * ```ts twoslash
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.to(blobs, 'Bytes')
 * // @log: Uint8Array [ 13, 174, 190, 239 ]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform.
 * @param to - The type to transform to.
 * @returns The originating data.
 */
export function to<
  const blobs extends Blobs<Hex.Hex> | Blobs<Bytes.Bytes>,
  to extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex.Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes.Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Hex.Hex> | Blobs<Bytes.Bytes>,
  to?: to | 'Hex' | 'Bytes',
): to.ReturnType<to> {
  const to_ = to ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs_ = (
    typeof blobs[0] === 'string'
      ? blobs.map((x) => Bytes.fromHex(x as Hex.Hex))
      : blobs
  ) as Bytes.Bytes[]

  // Only the final blob contains a terminator: the last `0x80` byte in it, when
  // that byte is data rather than the zero byte leading a field element.
  // Preceding blobs contain only data.
  const last = blobs_[blobs_.length - 1]
  const terminator = last ? last.lastIndexOf(0x80) : -1
  const lastEnd =
    terminator % bytesPerFieldElement > 0 ? terminator : (last?.length ?? 0)

  // Each field element contributes all of its bytes but the leading zero byte.
  const dataSize = (end: number) =>
    Math.floor(end / bytesPerFieldElement) * 31 +
    Math.max(0, (end % bytesPerFieldElement) - 1)

  let length = dataSize(lastEnd)
  for (let index = 0; index < blobs_.length - 1; index++)
    length += dataSize(blobs_[index]!.length)

  const data = new Uint8Array(length)
  let position = 0
  for (let index = 0; index < blobs_.length; index++) {
    const blob = blobs_[index]!
    const end = index === blobs_.length - 1 ? lastEnd : blob.length
    // Skip the zero byte leading each field element. Copying byte by byte
    // beats a `subarray` view plus `set` for 31 bytes, and allocates nothing.
    for (let offset = 1; offset < end; offset += bytesPerFieldElement) {
      const stop = Math.min(offset + 31, end)
      for (let i = offset; i < stop; i++) data[position++] = blob[i]!
    }
  }

  return (to_ === 'Hex' ? Hex.fromBytes(data) : data) as never
}

export declare namespace to {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> =
    | (to extends 'Bytes' ? Bytes.Bytes : never)
    | (to extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts twoslash
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.toHex(blobs) // [!code focus]
 * // @log: '0xdeadbeef'
 * ```
 */
export function toHex(
  blobs: Blobs<Hex.Hex> | Blobs<Bytes.Bytes>,
): toHex.ReturnType {
  return to(blobs, 'Hex')
}

export declare namespace toHex {
  type ReturnType = to.ReturnType<'Hex'>
  type ErrorType = to.ErrorType | Errors.GlobalErrorType
}

/**
 * Transforms Ox-shaped {@link ox#Blobs.Blobs} into the originating data.
 *
 * @example
 * ```ts
 * import { Blobs, Hex } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const data = Blobs.toBytes(blobs) // [!code focus]
 * // @log: Uint8Array [ 13, 174, 190, 239 ]
 * ```
 */
export function toBytes(
  blobs: Blobs<Hex.Hex> | Blobs<Bytes.Bytes>,
): toBytes.ReturnType {
  return to(blobs, 'Bytes')
}

/**
 * Compute commitments from a list of {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg }) // [!code focus]
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, {
 *   as: 'Bytes', // [!code focus]
 *   kzg
 * })
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform to commitments.
 * @param options - Options.
 * @returns The commitments.
 */
export function toCommitments<
  const blobs extends Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex.Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes.Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  options: toCommitments.Options<as>,
): toCommitments.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs_ = (
    typeof blobs[0] === 'string'
      ? blobs.map((x) => Bytes.fromHex(x as any))
      : blobs
  ) as Bytes.Bytes[]

  const commitments: Bytes.Bytes[] = []
  for (const blob of blobs_)
    commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)))

  return (
    as === 'Bytes' ? commitments : commitments.map((x) => Hex.fromBytes(x))
  ) as never
}

export declare namespace toCommitments {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'blobToKzgCommitment'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)
  >

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

export declare namespace toBytes {
  type ReturnType = to.ReturnType<'Bytes'>
  type ErrorType = to.ErrorType | Errors.GlobalErrorType
}

/**
 * Compute the flat list of PeerDAS (EIP-7594) cell KZG proofs for a list of
 * {@link ox#Blobs.Blobs}. Returns `128 * blobs.length` proofs, where
 * `proofs[i * 128 + j]` is the proof for cell `j` of `blobs[i]`'s extended
 * form.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const cellProofs = Blobs.toCellProofs(blobs, { kzg }) // [!code focus]
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const cellProofs = Blobs.toCellProofs(blobs, {
 *   as: 'Bytes', // [!code focus]
 *   kzg
 * })
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ], ...]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform to cell proofs.
 * @param options - Options.
 * @returns The flat list of cell KZG proofs.
 */
export function toCellProofs<
  const blobs extends Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex.Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes.Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  options: toCellProofs.Options<as>,
): toCellProofs.ReturnType<as> {
  const { kzg } = options
  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')

  if (as === 'Bytes') {
    const proofs: Bytes.Bytes[] = []
    for (const blob of blobs) {
      const { proofs: cellProofs } = BlobCells.fromBlob(
        blob as Hex.Hex | Bytes.Bytes,
        { kzg, as: 'Bytes' },
      )
      for (const proof of cellProofs) proofs.push(proof)
    }
    return proofs as never
  }

  const proofs: Hex.Hex[] = []
  for (const blob of blobs) {
    const { proofs: cellProofs } = BlobCells.fromBlob(
      blob as Hex.Hex | Bytes.Bytes,
      { kzg, as: 'Hex' },
    )
    for (const proof of cellProofs) proofs.push(proof)
  }
  return proofs as never
}

export declare namespace toCellProofs {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'computeCellsAndKzgProofs'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)
  >

  type ErrorType = BlobCells.fromBlob.ErrorType | Errors.GlobalErrorType
}

/**
 * Compute Blob Versioned Hashes from a list of {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const versionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * }) // [!code focus]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform into Blob Versioned Hashes.
 * @param options - Options.
 * @returns The Blob Versioned Hashes.
 */
export function toVersionedHashes<
  const blobs extends Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex.Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes.Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  options: toVersionedHashes.Options<as>,
): toVersionedHashes.ReturnType<as> {
  const commitments = toCommitments(blobs, options)
  return commitmentsToVersionedHashes(commitments, options)
}

export declare namespace toVersionedHashes {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'blobToKzgCommitment'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)
  >

  type ErrorType =
    | toCommitments.ErrorType
    | commitmentsToVersionedHashes.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when the blob size is too large. */
export class BlobSizeTooLargeError extends Errors.BaseError {
  override readonly name = 'Blobs.BlobSizeTooLargeError'
  constructor({ maxSize, size }: { maxSize: number; size: number }) {
    super('Blob size is too large.', {
      metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size} bytes`],
    })
  }
}

/** Thrown when the blob is empty. */
export class EmptyBlobError extends Errors.BaseError {
  override readonly name = 'Blobs.EmptyBlobError'
  constructor() {
    super('Blob data must not be empty.')
  }
}

/** Thrown when the blob versioned hashes are empty. */
export class EmptyBlobVersionedHashesError extends Errors.BaseError {
  override readonly name = 'Blobs.EmptyBlobVersionedHashesError'
  constructor() {
    super('Blob versioned hashes must not be empty.')
  }
}

/** Thrown when the blob versioned hash size is invalid. */
export class InvalidVersionedHashSizeError extends Errors.BaseError {
  override readonly name = 'Blobs.InvalidVersionedHashSizeError'
  constructor({ hash, size }: { hash: Hex.Hex; size: number }) {
    super(`Versioned hash "${hash}" size is invalid.`, {
      metaMessages: ['Expected: 32', `Received: ${size}`],
    })
  }
}

/** Thrown when the blob versioned hash version is invalid. */
export class InvalidVersionedHashVersionError extends Errors.BaseError {
  override readonly name = 'Blobs.InvalidVersionedHashVersionError'
  constructor({ hash, version }: { hash: Hex.Hex; version: number }) {
    super(`Versioned hash "${hash}" version is invalid.`, {
      metaMessages: [
        `Expected: ${Kzg.versionedHashVersion}`,
        `Received: ${version}`,
      ],
    })
  }
}
