import type { Abi } from 'abitype'
import type { Narrow } from 'abitype'
import type { Error, Filter } from './types.js'
import { InvalidAbiItemError } from './errors.js'
import { isStructSignature } from './runtime/signatures.js'
import { parseStructs } from './runtime/structs.js'
import { parseSignature } from './runtime/utils.js'
import type { Signature, Signatures } from './types/signatures.js'
import type { ParseStructs } from './types/structs.js'
import type { ParseSignature } from './types/utils.js'

/**
 * Parses human-readable ABI item (e.g. error, event, function) into `Abi` item.
 *
 * @param signature - Human-readable ABI item
 * @returns Parsed `Abi` item.
 */
export type ParseAbiItem<
  signature extends string | readonly string[] | readonly unknown[],
> =
  | (signature extends string
      ? string extends signature
        ? Abi[number]
        : signature extends Signature<signature> // Validate signature
          ? ParseSignature<signature>
          : never
      : never)
  | (signature extends readonly string[]
      ? string[] extends signature
        ? Abi[number] // Return generic Abi item since type was no inferrable
        : signature extends Signatures<signature> // Validate signature
          ? ParseStructs<signature> extends infer structs
            ? {
                [key in keyof signature]: ParseSignature<
                  signature[key] extends string ? signature[key] : never,
                  structs
                >
              } extends infer mapped extends readonly unknown[]
              ? // Filter out `never` since those are structs
                Filter<mapped, never>[0] extends infer result
                ? result extends undefined // convert `undefined` to `never` (e.g. `ParseAbiItem<['struct Foo { string name; }']>`)
                  ? never
                  : result
                : never
              : never
            : never
          : never
      : never)

/**
 * Parses human-readable ABI item (e.g. error, event, function) into `Abi` item.
 *
 * @param signature - Human-readable ABI item
 * @returns Parsed `Abi` item.
 */
export function parseAbiItem<
  signature extends string | readonly string[] | readonly unknown[],
>(
  signature: Narrow<signature> &
    (
      | (signature extends string
          ? string extends signature
            ? unknown
            : Signature<signature>
          : never)
      | (signature extends readonly string[]
          ? signature extends readonly [] // empty array
            ? Error<'At least one signature required.'>
            : string[] extends signature
              ? unknown
              : Signatures<signature>
          : never)
    ),
): ParseAbiItem<signature> {
  let abiItem: ParseAbiItem<signature> | undefined
  if (typeof signature === 'string')
    abiItem = parseSignature(signature) as ParseAbiItem<signature>
  else {
    const structs = parseStructs(signature as readonly string[])
    const length = signature.length as number
    for (let i = 0; i < length; i++) {
      const signature_ = (signature as readonly string[])[i]!
      if (isStructSignature(signature_)) continue
      abiItem = parseSignature(signature_, structs) as ParseAbiItem<signature>
      break
    }
  }

  if (!abiItem) throw new InvalidAbiItemError({ signature })
  return abiItem as ParseAbiItem<signature>
}
