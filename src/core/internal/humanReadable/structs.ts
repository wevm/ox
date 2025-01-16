import type * as AbiParameter from '../../AbiParameter.js'
import {
  type ParseAbiParameter,
  isSolidityType,
  parseAbiParameter,
} from '../abiParameter.js'
import { execTyped, isTupleRegex } from '../regex.js'
import type { Trim, TypeErrorMessage } from '../types.js'
import {
  CircularReferenceError,
  InvalidAbiTypeParameterError,
  InvalidSignatureError,
  InvalidStructSignatureError,
  UnknownTypeError,
} from './errors.js'
import {
  type StructSignature,
  execStructSignature,
  isStructSignature,
} from './signatures.js'

export function parseStructs(signatures: readonly string[]) {
  // Create "shallow" version of each struct (and filter out non-structs or invalid structs)
  const shallowStructs: StructLookup = {}
  const signaturesLength = signatures.length
  for (let i = 0; i < signaturesLength; i++) {
    const signature = signatures[i]!
    if (!isStructSignature(signature)) continue

    const match = execStructSignature(signature)
    if (!match)
      throw new InvalidSignatureError({
        signature,
        type: 'struct',
      })

    const properties = match.properties.split(';')

    const components: AbiParameter.AbiParameter[] = []
    const propertiesLength = properties.length
    for (let k = 0; k < propertiesLength; k++) {
      const property = properties[k]!
      const trimmed = property.trim()
      if (!trimmed) continue
      const abiParameter = parseAbiParameter(trimmed, {
        type: 'struct',
      })
      components.push(abiParameter)
    }

    if (!components.length) throw new InvalidStructSignatureError({ signature })
    shallowStructs[match.name] = components
  }

  // Resolve nested structs inside each parameter
  const resolvedStructs: StructLookup = {}
  const entries = Object.entries(shallowStructs)
  const entriesLength = entries.length
  for (let i = 0; i < entriesLength; i++) {
    const [name, parameters] = entries[i]!
    resolvedStructs[name] = resolveStructs(parameters, shallowStructs)
  }

  return resolvedStructs
}

const typeWithoutTupleRegex =
  /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/

function resolveStructs(
  abiParameters: readonly (AbiParameter.AbiParameter & { indexed?: true })[],
  structs: StructLookup,
  ancestors = new Set<string>(),
) {
  const components: AbiParameter.AbiParameter[] = []
  const length = abiParameters.length
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i]!
    const isTuple = isTupleRegex.test(abiParameter.type)
    if (isTuple) components.push(abiParameter)
    else {
      const match = execTyped<{ array?: string; type: string }>(
        typeWithoutTupleRegex,
        abiParameter.type,
      )
      if (!match?.type) throw new InvalidAbiTypeParameterError({ abiParameter })

      const { array, type } = match
      if (type in structs) {
        if (ancestors.has(type)) throw new CircularReferenceError({ type })

        components.push({
          ...abiParameter,
          type: `tuple${array ?? ''}`,
          components: resolveStructs(
            structs[type] ?? [],
            structs,
            new Set([...ancestors, type]),
          ),
        })
      } else {
        if (isSolidityType(type)) components.push(abiParameter)
        else throw new UnknownTypeError({ type })
      }
    }
  }

  return components
}

/// Types

export type StructLookup = Record<string, readonly AbiParameter.AbiParameter[]>

export type ParseStructs<signatures extends readonly string[]> =
  // Create "shallow" version of each struct (and filter out non-structs or invalid structs)
  {
    [signature in signatures[number] as ParseStruct<signature> extends infer struct extends
      {
        name: string
      }
      ? struct['name']
      : never]: ParseStruct<signature>['components']
  } extends infer structs extends Record<
    string,
    readonly (AbiParameter.AbiParameter & { type: string })[]
  >
    ? // Resolve nested structs inside each struct
      {
        [structName in keyof structs]: ResolveStructs<
          structs[structName],
          structs
        >
      }
    : never

export type ParseStruct<
  signature extends string,
  structs extends StructLookup | unknown = unknown,
> = signature extends StructSignature<infer name, infer properties>
  ? {
      readonly name: Trim<name>
      readonly components: ParseStructProperties<properties, structs>
    }
  : never

export type ResolveStructs<
  abiParameters extends readonly (AbiParameter.AbiParameter & {
    type: string
  })[],
  structs extends Record<
    string,
    readonly (AbiParameter.AbiParameter & { type: string })[]
  >,
  keyReferences extends { [_: string]: unknown } | unknown = unknown,
> = readonly [
  ...{
    [key in keyof abiParameters]: abiParameters[key]['type'] extends `${infer head extends
      string & keyof structs}[${infer tail}]` // Struct arrays (e.g. `type: 'Struct[]'`, `type: 'Struct[10]'`, `type: 'Struct[][]'`)
      ? head extends keyof keyReferences
        ? TypeErrorMessage<`Circular reference detected. Struct "${abiParameters[key]['type']}" is a circular reference.`>
        : {
            readonly name: abiParameters[key]['name']
            readonly type: `tuple[${tail}]`
            readonly components: ResolveStructs<
              structs[head],
              structs,
              keyReferences & { [_ in head]: true }
            >
          }
      : // Basic struct (e.g. `type: 'Struct'`)
        abiParameters[key]['type'] extends keyof structs
        ? abiParameters[key]['type'] extends keyof keyReferences
          ? TypeErrorMessage<`Circular reference detected. Struct "${abiParameters[key]['type']}" is a circular reference.`>
          : {
              readonly name: abiParameters[key]['name']
              readonly type: 'tuple'
              readonly components: ResolveStructs<
                structs[abiParameters[key]['type']],
                structs,
                keyReferences & { [_ in abiParameters[key]['type']]: true }
              >
            }
        : abiParameters[key]
  },
]

export type ParseStructProperties<
  signature extends string,
  structs extends StructLookup | unknown = unknown,
  result extends any[] = [],
> = Trim<signature> extends `${infer head};${infer tail}`
  ? ParseStructProperties<
      tail,
      structs,
      [...result, ParseAbiParameter<head, { structs: structs }>]
    >
  : result
