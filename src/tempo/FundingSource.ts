import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'

/** A source invoked to satisfy a funding requirement. */
export type Source = {
  /** Source-specific ABI-encoded request. */
  data: Hex.Hex
  /** Funding source address. */
  to: Address.Address
}
