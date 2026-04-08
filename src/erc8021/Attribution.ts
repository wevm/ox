import type * as Address from '../core/Address.js'
import * as Cbor from '../core/Cbor.js'
import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'

/**
 * ERC-8021 Transaction Attribution.
 *
 * Represents attribution metadata that can be appended to transaction calldata
 * to track entities involved in facilitating a transaction.
 */
export type Attribution = OneOf<
  AttributionSchemaId0 | AttributionSchemaId1 | AttributionSchemaId2
>

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
 * Schema 2: CBOR-Encoded Attribution.
 *
 * Uses CBOR encoding for extensible transaction annotation with optional fields,
 * support for arbitrary metadata, and coexistence with other suffix-based systems.
 */
export type AttributionSchemaId2 = {
  /** Application attribution code. */
  appCode?: string | undefined
  /** Wallet attribution code. */
  walletCode?: string | undefined
  /** Service codes identifying additional service providers (e.g., block builders, relayers, solvers). */
  serviceCodes?: readonly string[] | undefined
  /** Custom code registries keyed by entity type. */
  registries?: AttributionSchemaId2Registries | undefined
  /** Arbitrary metadata key-value pairs. */
  metadata?: Record<string, unknown> | undefined
  /** Schema identifier (2 for CBOR-encoded). */
  id?: 2 | undefined
}

export type AttributionSchemaId2Registries = {
  /** Custom registry for the application entity. */
  app?: AttributionSchemaId2Registry | undefined
  /** Custom registry for the wallet entity. */
  wallet?: AttributionSchemaId2Registry | undefined
}

export type AttributionSchemaId2Registry = {
  /** Address of the custom code registry contract. */
  address: Address.Address
  /** Chain ID of the chain the custom code registry contract is deployed on. */
  chainId: number
}

/**
 * Attribution schema identifier.
 *
 * - `0`: Canonical registry
 * - `1`: Custom registry
 * - `2`: CBOR-encoded
 */
export type SchemaId = NonNullable<
  | AttributionSchemaId0['id']
  | AttributionSchemaId1['id']
  | AttributionSchemaId2['id']
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
 *
 * const schemaId3 = Attribution.getSchemaId({
 *   appCode: 'baseapp',
 * })
 * // @log: 2
 * ```
 *
 * @param attribution - The attribution object.
 * @returns The schema ID (0 for canonical registry, 1 for custom registry, 2 for CBOR-encoded).
 */
export function getSchemaId(attribution: Attribution): SchemaId {
  if (
    'appCode' in attribution ||
    'walletCode' in attribution ||
    'serviceCodes' in attribution
  )
    return 2
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
 * @example
 * ### Schema 2 (CBOR-Encoded)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const suffix = Attribution.toDataSuffix({
 *   appCode: 'baseapp',
 *   walletCode: 'privy',
 *   metadata: { source: 'webapp' },
 * })
 * ```
 *
 * @param attribution - The attribution to convert.
 * @returns The data suffix as a {@link ox#Hex.Hex} value.
 */
export function toDataSuffix(attribution: Attribution): Hex.Hex {
  // Determine schema ID
  const schemaId = getSchemaId(attribution)

  // Schema 2: CBOR-encoded
  if (schemaId === 2) {
    const schema2 = attribution as AttributionSchemaId2
    return schema2ToDataSuffix(schema2)
  }

  // Encode the codes as ASCII strings separated by commas
  const codesHex = Hex.fromString((attribution.codes ?? []).join(','))

  // Get the byte length of the encoded codes
  const codesLength = Hex.size(codesHex)

  // Encode the codes length as 1 byte
  const codesLengthHex = Hex.fromNumber(codesLength, { size: 1 })

  const schemaIdHex = Hex.fromNumber(schemaId, { size: 1 })

  // Schema 1: codeRegistryAddress (20 bytes) ∥ chainId ∥ chainIdLength (1 byte) ∥ codes ∥ codesLength (1 byte) ∥ schemaId (1 byte) ∥ ercSuffix
  if (schemaId === 1) {
    const schema1 = attribution as AttributionSchemaId1
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
    | Cbor.encode.ErrorType
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
 * // @log:   codeRegistry: {
 * // @log:       address: '0xcccccccccccccccccccccccccccccccccccccccc',
 * // @log:       chainId: 8453,
 * // @log:   },
 * // @log:   id: 1
 * // @log: }
 * ```
 *
 * @example
 * ### Schema 2 (CBOR-Encoded)
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const attribution = Attribution.fromData(
 *   '0xdddddddda161616762617365617070000b0280218021802180218021802180218021'
 * )
 * // @log: { appCode: 'baseapp', id: 2 }
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
  // Schema 2: CBOR-encoded
  if (schemaId === 2) {
    return schema2FromData(data)
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
    | Cbor.decode.ErrorType
    | Errors.GlobalErrorType
}

// ---- Schema 2 helpers ----

/** Internal CBOR map shape matching the ERC-8021 spec. */
type Schema2CborMap = {
  a?: string
  w?: string
  s?: string[]
  r?: {
    a?: { c: string; a: string }
    w?: { c: string; a: string }
  }
  m?: Record<string, unknown>
}

function schema2ToDataSuffix(attribution: AttributionSchemaId2): Hex.Hex {
  // Build the CBOR map using single-letter keys per the spec
  const cborMap: Schema2CborMap = {}

  if (attribution.appCode) cborMap.a = attribution.appCode
  if (attribution.walletCode) cborMap.w = attribution.walletCode
  if (attribution.serviceCodes && attribution.serviceCodes.length > 0)
    cborMap.s = [...attribution.serviceCodes]

  if (attribution.registries) {
    const r: Schema2CborMap['r'] = {}
    if (attribution.registries.app) {
      r.a = {
        c: Hex.fromNumber(attribution.registries.app.chainId),
        a: attribution.registries.app.address,
      }
    }
    if (attribution.registries.wallet) {
      r.w = {
        c: Hex.fromNumber(attribution.registries.wallet.chainId),
        a: attribution.registries.wallet.address,
      }
    }
    if (r.a || r.w) cborMap.r = r
  }

  if (attribution.metadata && Object.keys(attribution.metadata).length > 0)
    cborMap.m = attribution.metadata

  // Encode to CBOR
  const cborHex = Cbor.encode(cborMap)
  const cborBytes = Hex.size(cborHex)

  // cborData ∥ cborLength (2 bytes) ∥ schemaId (1 byte) ∥ ercSuffix
  return Hex.concat(
    cborHex,
    Hex.fromNumber(cborBytes, { size: 2 }),
    Hex.fromNumber(2, { size: 1 }),
    ercSuffix,
  )
}

function schema2FromData(data: Hex.Hex): AttributionSchemaId2 | undefined {
  // cborLength is 2 bytes before schema ID
  const cborLengthHex = Hex.slice(
    data,
    -ercSuffixSize - 1 - 2,
    -ercSuffixSize - 1,
  )
  const cborLength = Hex.toNumber(cborLengthHex)

  // Extract CBOR data
  const cborStart = -ercSuffixSize - 1 - 2 - cborLength
  const cborEnd = -ercSuffixSize - 1 - 2
  const cborHex = Hex.slice(data, cborStart, cborEnd)

  // Decode CBOR
  const decoded = Cbor.decode<Schema2CborMap>(cborHex)

  const result: AttributionSchemaId2 = { id: 2 }

  if (typeof decoded.a === 'string') result.appCode = decoded.a
  if (typeof decoded.w === 'string') result.walletCode = decoded.w
  if (Array.isArray(decoded.s)) result.serviceCodes = decoded.s

  if (decoded.r) {
    const registries: AttributionSchemaId2Registries = {}
    if (decoded.r.a?.c && decoded.r.a?.a) {
      registries.app = {
        address: decoded.r.a.a as Address.Address,
        chainId: Hex.toNumber(decoded.r.a.c as Hex.Hex),
      }
    }
    if (decoded.r.w?.c && decoded.r.w?.a) {
      registries.wallet = {
        address: decoded.r.w.a as Address.Address,
        chainId: Hex.toNumber(decoded.r.w.c as Hex.Hex),
      }
    }
    if (registries.app || registries.wallet) result.registries = registries
  }

  if (decoded.m && typeof decoded.m === 'object') result.metadata = decoded.m

  return result
}
