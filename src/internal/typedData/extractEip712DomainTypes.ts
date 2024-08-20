import type { TypedDataDomain, TypedDataParameter } from 'abitype'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Gets [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) schema for EIP-721 domain.
 *
 * - Docs: https://oxlib.sh/api/typedData/extractEip712Domain
 *
 * @example
 * import { TypedData } from 'ox'
 *
 * TypedData.extractEip712Domain({
 *   name: 'Ether!',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 * })
 * // [{ 'name': 'name', 'type': 'string' }, { 'name': 'version', 'type': 'string' }, { 'name': 'chainId', 'type': 'uint256' }, { 'name': 'verifyingContract', 'type': 'address' }]
 */
export function extractEip712DomainTypes(
  domain: TypedDataDomain | undefined,
): TypedDataParameter[] {
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
  ].filter(Boolean) as TypedDataParameter[]
}

export declare namespace extractEip712DomainTypes {
  type ErrorType = GlobalErrorType
}

extractEip712DomainTypes.parseError = (error: unknown) =>
  error as extractEip712DomainTypes.ErrorType
