import type { Bytes, Hex } from './data.js'

export type BlobSidecar<type extends Hex | Bytes = Hex | Bytes> = {
  /** The blob associated with the transaction. */
  blob: type
  /** The KZG commitment corresponding to this blob. */
  commitment: type
  /** The KZG proof corresponding to this blob and commitment. */
  proof: type
}
export type BlobSidecars<type extends Hex | Bytes = Hex | Bytes> =
  BlobSidecar<type>[]
