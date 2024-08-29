import type { Bytes } from '../bytes/types.js'
import type { Hex } from '../hex/types.js'
import type { Compute } from '../types.js'

export type Blob<type extends Hex | Bytes = Hex | Bytes> = type

export type Blobs<type extends Hex | Bytes = Hex | Bytes> =
  readonly Blob<type>[]

export type BlobSidecar<type extends Hex | Bytes = Hex | Bytes> = Compute<{
  /** The blob associated with the transaction. */
  blob: type
  /** The KZG commitment corresponding to this blob. */
  commitment: type
  /** The KZG proof corresponding to this blob and commitment. */
  proof: type
}>

export type BlobSidecars<type extends Hex | Bytes = Hex | Bytes> =
  readonly Compute<BlobSidecar<type>>[]
