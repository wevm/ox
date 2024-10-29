import type * as Errors from '../../Errors.js'
import type { TypedData_Domain, TypedData_Parameter } from './types.js'

/**
 * Gets [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) schema for EIP-721 domain.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.extractEip712DomainTypes({
 *   name: 'Ether!',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 * })
 * // @log: [
 * // @log:   { 'name': 'name', 'type': 'string' },
 * // @log:   { 'name': 'version', 'type': 'string' },
 * // @log:   { 'name': 'chainId', 'type': 'uint256' },
 * // @log:   { 'name': 'verifyingContract', 'type': 'address' },
 * // @log: ]
 * ```
 *
 * @param domain - The EIP-712 domain.
 * @returns The EIP-712 domain schema.
 */
export function TypedData_extractEip712DomainTypes(
  domain: TypedData_Domain | undefined,
): TypedData_Parameter[] {
  return [
    typeof domain?.name === 'string' && { name: 'name', type: 'string' },
    domain?.version && { name: 'version', type: 'string' },
    typeof domain?.chainId === 'number' && {
      name: 'chainId',
      type: 'uint256',
    },
    domain?.verifyingContract && {
      name: 'verifyingContract',
      type: 'address',
    },
    domain?.salt && { name: 'salt', type: 'bytes32' },
  ].filter(Boolean) as TypedData_Parameter[]
}

export declare namespace TypedData_extractEip712DomainTypes {
  type ErrorType = Errors.GlobalErrorType
}

TypedData_extractEip712DomainTypes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_extractEip712DomainTypes.ErrorType
