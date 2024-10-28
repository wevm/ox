import type { Errors } from '../../Errors.js'
import type { Hex } from '../Hex/types.js'
import { TypedData_hashDomain } from './hashDomain.js'
import type { TypedData_Domain } from './types.js'

/**
 * Creates [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) [`domainSeparator`](https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator) for the provided domain.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.domainSeparator({
 *   name: 'Ether!',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 * })
 * // @log: '0x9911ee4f58a7059a8f5385248040e6984d80e2c849500fe6a4d11c4fa98c2af3'
 * ```
 *
 * @param domain - The domain for which to create the domain separator.
 * @returns The domain separator.
 */
export function TypedData_domainSeparator(domain: TypedData_Domain): Hex {
  return TypedData_hashDomain({
    domain,
  })
}

export declare namespace TypedData_domainSeparator {
  type ErrorType = TypedData_hashDomain.ErrorType | Errors.GlobalErrorType
}

TypedData_domainSeparator.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_domainSeparator.ErrorType
