import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'

/**
 * ERC-8021 Transaction Attribution.
 *
 * Represents attribution metadata that can be appended to transaction calldata
 * to track entities involved in facilitating a transaction.
 */
export type Attribution = OneOf<AttributionSchemaId0 | AttributionSchemaId1>

/**
 * Schema 0: Canonical Registry Attribution.
 *
 * Uses the canonical attribution code registry for resolving entity identities.
 */
export type AttributionSchemaId0 = {
  /** Attribution codes identifying entities involved in the transaction. */
  codes: readonly string[]
  /** Schema identifier (0 for canonical registry). */
  id?: 0 | undefined
}

/**
 * Schema 1: Custom Registry Attribution.
 *
 * Uses a custom registry contract for resolving attribution codes.
 */
export type AttributionSchemaId1 = {
  /** Attribution codes identifying entities involved in the transaction. */
  codes: readonly string[]
  /* The custom code registry contract. */
  codeRegistry: AttributionSchemaId1Registry
  /** Schema identifier (1 for custom registry). */
  id?: 1 | undefined
}

export type AttributionSchemaId1Registry = {
  /** Address of the custom code registry contract. */
  address: Address.Address
  /** Chain Id of the chain the custom code registry contract is deployed on. */
  chainId: number
}

/**
 * Attribution schema identifier.
 *
 * - `0`: Canonical registry
 * - `1`: Custom registry
 */
export type SchemaId = NonNullable<
  AttributionSchemaId0['id'] | AttributionSchemaId1['id']
>

/**
 * ERC-8021 suffix identifier.
 */
export const ercSuffix = '0x80218021802180218021802180218021' as const

/**
 * Size of the ERC-8021 suffix (16 bytes).
 */
export const ercSuffixSize = /*#__PURE__*/ Hex.size(ercSuffix)

/**
 * Determines the schema ID for an {@link ox#Attribution.Attribution}.
 *
 * @example
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const schemaId = Attribution.getSchemaId({
 *   codes: ['baseapp']
 * })
 * // @log: 0
 *
 * const schemaId2 = Attribution.getSchemaId({
 *   codes: ['baseapp'],
 *   codeRegistry: {
 *      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *      chainId: 8453,
 *   }
 * })
 * // @log: 1
 * ```
 *
 * @param attribution - The attribution object.
 * @returns The schema ID (0 for canonical registry, 1 for custom registry).
 */
export function getSchemaId(attribution: Attribution): SchemaId {
  if ('codeRegistry' in attribution) return 1
  return 0
}

export declare namespace getSchemaId {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#Attribution.Attribution} to a data suffix that can be appended to transaction calldata.
 *
 * @example
 * ### Schema 0 (Canonical Registry)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const suffix = Attribution.toDataSuffix({
 *   codes: ['baseapp', 'morpho']
 * })
 * // @log: '0x626173656170702c6d6f7270686f0e0080218021802180218021802180218021'
 * ```
 *
 * @example
 * ### Schema 1 (Custom Registry)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const suffix = Attribution.toDataSuffix({
 *   codes: ['baseapp'],
 *   codeRegistry: {
 *      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *      chainId: 8453,
 *   }
 * })
 * ```
 *
 * @param attribution - The attribution to convert.
 * @returns The data suffix as a {@link ox#Hex.Hex} value.
 */
export function toDataSuffix(attribution: Attribution): Hex.Hex {
  // Encode the codes as ASCII strings separated by commas
  const codesHex = Hex.fromString(attribution.codes.join(','))

  // Get the byte length of the encoded codes
  const codesLength = Hex.size(codesHex)

  // Encode the codes length as 1 byte
  const codesLengthHex = Hex.fromNumber(codesLength, { size: 1 })

  // Determine schema ID
  const schemaId = getSchemaId(attribution)
  const schemaIdHex = Hex.fromNumber(schemaId, { size: 1 })

  // Build the suffix based on schema
  if (schemaId === 1) {
    const schema1 = attribution as AttributionSchemaId1
    // Schema 1: codeRegistryAddress (20 bytes) ∥ chainId ∥ chainIdLength (1 byte) ∥ codes ∥ codesLength (1 byte) ∥ schemaId (1 byte) ∥ ercSuffix
    return Hex.concat(
      registryToData(schema1.codeRegistry),
      codesHex,
      codesLengthHex,
      schemaIdHex,
      ercSuffix,
    )
  }

  // Schema 0: codes ∥ codesLength ∥ schemaId ∥ ercSuffix
  return Hex.concat(codesHex, codesLengthHex, schemaIdHex, ercSuffix)
}

export declare namespace toDataSuffix {
  type ErrorType =
    | getSchemaId.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromString.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Extracts an {@link ox#Attribution.Attribution} from transaction calldata.
 *
 * @example
 * ### Schema 0 (Canonical Registry)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const attribution = Attribution.fromData(
 *   '0xdddddddd62617365617070070080218021802180218021802180218021'
 * )
 * // @log: { codes: ['baseapp'], id: 0 }
 * ```
 *
 * @example
 * ### Schema 1 (Custom Registry)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const attribution = Attribution.fromData(
 *   '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021'
 * )
 * // @log: {
 * // @log:   codes: ['baseapp', 'morpho'],
 * // @log:   registry: {
 * // @log:       address: '0xcccccccccccccccccccccccccccccccccccccccc`
 * // @log:       chainId: 8453,
 * // @log:   }
 * // @log:   id: 1
 * // @log: }
 * ```
 *
 * @param data - The transaction calldata containing the attribution suffix.
 * @returns The extracted attribution, or undefined if no valid attribution is found.
 */
export function fromData(data: Hex.Hex): Attribution | undefined {
  // Check minimum length: ERC suffix (16 bytes) + schema ID (1 byte) + length (1 byte) = 18 bytes
  const minSize = ercSuffixSize + 1 + 1
  if (Hex.size(data) < minSize) return undefined

  // Verify ERC suffix is present at the end
  const suffix = Hex.slice(data, -ercSuffixSize)
  if (suffix !== ercSuffix) return undefined

  // Extract schema ID (1 byte before the ERC suffix)
  const schemaIdHex = Hex.slice(data, -ercSuffixSize - 1, -ercSuffixSize)
  const schemaId = Hex.toNumber(schemaIdHex)

  // Schema 0: Canonical registry
  if (schemaId === 0) {
    // Extract codes length (1 byte before schema ID)
    const codesLengthHex = Hex.slice(
      data,
      -ercSuffixSize - 2,
      -ercSuffixSize - 1,
    )
    const codesLength = Hex.toNumber(codesLengthHex)

    // Extract codes
    const codesStart = -ercSuffixSize - 2 - codesLength
    const codesEnd = -ercSuffixSize - 2
    const codesHex = Hex.slice(data, codesStart, codesEnd)
    const codesString = Hex.toString(codesHex)
    const codes = codesString.length > 0 ? codesString.split(',') : []

    return { codes, id: 0 }
  }

  // Schema 1: Custom registry
  // Format: codeRegistryAddress (20 bytes) ∥ chainId ∥ chainIdLength (1 byte) ∥ codes ∥ codesLength (1 byte) ∥ schemaId (1 byte) ∥ ercSuffix
  if (schemaId === 1) {
    // Extract codes length (1 byte before schema ID)
    const codesLengthHex = Hex.slice(
      data,
      -ercSuffixSize - 2,
      -ercSuffixSize - 1,
    )
    const codesLength = Hex.toNumber(codesLengthHex)

    // Extract codes
    const codesStart = -ercSuffixSize - 2 - codesLength
    const codesEnd = -ercSuffixSize - 2
    const codesHex = Hex.slice(data, codesStart, codesEnd)
    const codesString = Hex.toString(codesHex)
    const codes = codesString.length > 0 ? codesString.split(',') : []

    // Extract registry by reading backwards from just before codes
    const codeRegistry = registryFromData(Hex.slice(data, 0, codesStart))
    if (codeRegistry === undefined) return undefined

    return {
      codes,
      codeRegistry,
      id: 1,
    }
  }

  // Unknown schema ID
  return undefined
}

function registryFromData(
  data: Hex.Hex,
): AttributionSchemaId1Registry | undefined {
  // Expect at least: address (20 bytes) + chainIdLen (1 byte)
  const minRegistrySize = 20 + 1
  if (Hex.size(data) < minRegistrySize) return undefined

  // Read chainId length from the last byte of the registry segment
  const chainIdLenHex = Hex.slice(data, -1)
  const chainIdLen = Hex.toNumber(chainIdLenHex)

  if (chainIdLen === 0) return undefined

  // Validate we have enough bytes to cover address + chainId + chainIdLen
  const totalRegistrySize = 20 + chainIdLen + 1
  if (Hex.size(data) < totalRegistrySize) return undefined

  // Address is located immediately before chainId and chainIdLen (read from back)
  const addressStart = -(chainIdLen + 1 + 20)
  const addressEnd = -(chainIdLen + 1)
  const addressHex = Hex.slice(data, addressStart, addressEnd)
  // Chain ID occupies the bytes preceding the final length byte (read from back)
  const chainIdHex = Hex.slice(data, -(chainIdLen + 1), -1)

  const codeRegistry: AttributionSchemaId1Registry = {
    address: addressHex as Address.Address,
    chainId: Hex.toNumber(chainIdHex),
  }

  return codeRegistry
}

function registryToData(registry: AttributionSchemaId1Registry): Hex.Hex {
  const chainIdAsHex = Hex.fromNumber(registry.chainId)
  const chainIdLen = Hex.size(chainIdAsHex)
  // Need to padleft because the output of size may not be a full byte (1 -> 0x1 vs 0x01)
  const paddedChainId = Hex.padLeft(chainIdAsHex, chainIdLen)
  return Hex.concat(
    registry.address as Hex.Hex,
    paddedChainId,
    Hex.fromNumber(chainIdLen, { size: 1 }),
  )
}

export declare namespace fromData {
  type ErrorType =
    | Hex.slice.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.toString.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}
