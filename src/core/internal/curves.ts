/**
 * Curve constants, inlined so that modules needing nothing but an order do not
 * pull a curve implementation into the bundle.
 *
 * These are fixed by the curve specifications and are asserted against
 * `@noble/curves` in `src/core/_test/curves.test.ts`.
 *
 * @internal
 */

/**
 * Order of the secp256r1 (P-256) curve.
 *
 * @see https://www.secg.org/sec2-v2.pdf
 * @internal
 */
export const p256N =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
