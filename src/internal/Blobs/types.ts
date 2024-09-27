import type { Bytes } from '../Bytes/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

/** Root type for a Blob. */
export type Blob<type extends Hex | Bytes = Hex | Bytes> = type

/** A list of {@link ox#Blobs.Blob}. */
export type Blobs<type extends Hex | Bytes = Hex | Bytes> =
  readonly Blob<type>[]

/** Type for a Blob Sidecar that contains a blob, as well as its KZG commitment and proof. */
export type BlobSidecar<type extends Hex | Bytes = Hex | Bytes> = Compute<{
  /** The blob associated with the transaction. */
  blob: type
  /** The KZG commitment corresponding to this blob. */
  commitment: type
  /** The KZG proof corresponding to this blob and commitment. */
  proof: type
}>

/** A list of {@link ox#Blobs.BlobSidecar}. */
export type BlobSidecars<type extends Hex | Bytes = Hex | Bytes> =
  readonly Compute<BlobSidecar<type>>[]
