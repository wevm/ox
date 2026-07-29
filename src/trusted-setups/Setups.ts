import * as Base64 from '../core/Base64.js'
import type * as Bytes from '../core/Bytes.js'
import {
  g1Lagrange,
  g1Monomial,
  g2Monomial,
} from './internal/setups/mainnet.js'

/**
 * Trusted setup points for EIP-4844 and EIP-7594 KZG operations.
 */
export type TrustedSetup = {
  /** G1 points in Lagrange form. */
  readonly g1_lagrange: Bytes.Bytes
  /** G1 points in monomial form. */
  readonly g1_monomial: Bytes.Bytes
  /** G2 points in monomial form. */
  readonly g2_monomial: Bytes.Bytes
}

/**
 * Ethereum mainnet trusted setup for EIP-4844 and EIP-7594.
 *
 * The setup stores packed points and is safe to reuse across `Kzg.create`
 * calls. `Kzg.create` copies every field before asynchronous initialization.
 *
 * Treat the exported byte arrays as read-only.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Setups } from 'ox/trusted-setups'
 * import { Kzg } from 'ox/wasm'
 *
 * const kzg = await Kzg.create({ trustedSetup: Setups.mainnet })
 *
 * kzg.dispose()
 * ```
 */
export const mainnet: TrustedSetup = /* @__PURE__ */ Object.freeze({
  g1_lagrange: /* @__PURE__ */ Base64.toBytes(g1Lagrange),
  g1_monomial: /* @__PURE__ */ Base64.toBytes(g1Monomial),
  g2_monomial: /* @__PURE__ */ Base64.toBytes(g2Monomial),
})
