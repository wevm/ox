/**
 * Ethereum specification identifiers, in the engine's declaration order.
 *
 * A specification selects the instruction table, gas schedule, precompile set,
 * and transaction handlers an EVM runs under.
 */
export type SpecId = (typeof ids)[number]

/**
 * Every specification, in order. Index is the wire discriminant the engine uses, so
 * this list must track its `SpecId` enum.
 */
export const ids = [
  'frontier',
  'homestead',
  'tangerine',
  'spuriousDragon',
  'byzantium',
  'petersburg',
  'istanbul',
  'berlin',
  'london',
  'merge',
  'shanghai',
  'cancun',
  'prague',
  'osaka',
  'amsterdam',
] as const

/** The newest specification with a released schedule. */
export const latest = 'osaka' satisfies SpecId

/**
 * Returns whether `specId` enables the rules of `other`.
 *
 * @example
 * ```ts twoslash
 * import { SpecId } from 'ox/evm'
 *
 * SpecId.enables('osaka', 'cancun')
 * // @log: true
 * ```
 *
 * @param specId - Specification to test.
 * @param other - Specification whose rules to test for.
 * @returns Whether `specId` is at or after `other`.
 */
export function enables(specId: SpecId, other: SpecId): boolean {
  return ids.indexOf(specId) >= ids.indexOf(other)
}
