import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { AbiFunction, AbiItem, type AbiParameters } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import {
  arbitraryAbiParameters,
  arbitraryAbiValueFor,
} from '../../../test/fuzz/arbitraries/abi.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const name = fc.stringMatching(/^[a-zA-Z_$][a-zA-Z0-9_$]{0,12}$/)

/** A function with zero or more inputs, and values for them. */
const functionCase = fc
  .record({
    name,
    inputs: fc.oneof(
      { weight: 1, arbitrary: fc.constant([] as AbiParameters.Parameter[]) },
      { weight: 5, arbitrary: arbitraryAbiParameters({ maxDepth: 2 }) },
    ),
  })
  .chain(({ name, inputs }) =>
    fc
      .tuple(
        ...(inputs as readonly AbiParameters.Parameter[]).map((input) =>
          arbitraryAbiValueFor(input),
        ),
      )
      .map((args) => ({
        abiFunction: {
          type: 'function',
          name,
          inputs,
          outputs: [],
          stateMutability: 'nonpayable',
        } as unknown as AbiFunction.AbiFunction,
        args,
      })),
  )

describe('AbiFunction.encodeData', () => {
  test.prop({ functionCase }, { numRuns })(
    'encodes as viem does, and decodeData reads the arguments back',
    ({ functionCase: { abiFunction, args } }) => {
      const data = AbiFunction.encodeData(abiFunction, args as never)
      expect(data).toBe(
        viem.encodeFunctionData({
          abi: [abiFunction] as never,
          functionName: abiFunction.name,
          args,
        } as never),
      )
      expect(data.slice(0, 10)).toBe(AbiItem.getSelector(abiFunction))
      if (args.length === 0) {
        expect(data).toBe(AbiItem.getSelector(abiFunction))
        return
      }
      expect(canonical(AbiFunction.decodeData(abiFunction, data))).toEqual(
        canonical(args),
      )
    },
  )
})

describe('AbiItem signatures and selectors', () => {
  test.prop({ functionCase }, { numRuns })(
    'getSignature, getSignatureHash and getSelector agree with ethers, for items and their human-readable form',
    ({ functionCase: { abiFunction } }) => {
      const fragment = ethers.FunctionFragment.from(abiFunction as never)
      const signature = fragment.format('sighash')
      expect(AbiItem.getSignature(abiFunction)).toBe(signature)
      expect(AbiItem.getSignatureHash(abiFunction)).toBe(ethers.id(signature))
      expect(AbiItem.getSelector(abiFunction)).toBe(fragment.selector)
      const formatted = AbiItem.format(abiFunction)
      expect(AbiItem.getSelector(formatted)).toBe(fragment.selector)
      expect(AbiItem.getSignatureHash(formatted)).toBe(ethers.id(signature))
    },
  )

  test.prop(
    {
      functionCases: fc.array(functionCase, { minLength: 1, maxLength: 4 }),
      pick: fc.nat(),
      overload: fc.boolean(),
    },
    { numRuns },
  )(
    'fromAbi finds an item that takes the arguments by name, and the first item by selector',
    ({ functionCases, pick, overload }) => {
      // Overloads share a name, so lookup by arguments decides between them.
      // (viem is no oracle here: it picks `a(bool)` for `a((uint40[1],int8))`'s
      // arguments.)
      const abi = functionCases.map(({ abiFunction }) => ({
        ...abiFunction,
        name: overload ? functionCases[0]!.abiFunction.name : abiFunction.name,
      })) as unknown as readonly AbiFunction.AbiFunction[]
      const index = pick % abi.length
      const target = abi[index]!
      const args = functionCases[index]!.args
      const named = abi.filter((item) => item.name === target.name)
      const takes = (item: AbiFunction.AbiFunction) => {
        try {
          AbiFunction.encodeData(item, args as never)
          return true
        } catch {
          return false
        }
      }

      let found: AbiFunction.AbiFunction
      try {
        found = AbiItem.fromAbi(
          abi,
          target.name as never,
          {
            args,
          } as never,
        ) as never
      } catch (error) {
        // Only arguments that two overloads both take are ambiguous.
        expect((error as Error).name).toBe('AbiItem.AmbiguityError')
        expect(named.filter(takes).length).toBeGreaterThan(1)
        expect(() =>
          AbiFunction.encodeData(abi, target.name as never, args as never),
        ).toThrowError(error as Error)
        return
      }
      expect(found.name).toBe(target.name)
      expect(takes(found)).toBe(true)
      // `encodeData(abi, name, args)` encodes for the item lookup finds.
      expect(
        AbiFunction.encodeData(abi, target.name as never, args as never),
      ).toBe(AbiFunction.encodeData(found, args as never))
      if (named.length === 1) {
        expect(AbiItem.getSignature(found)).toBe(AbiItem.getSignature(target))
        expect(
          AbiItem.getSignature(
            AbiItem.fromAbi(abi, target.name as never) as never,
          ),
        ).toBe(AbiItem.getSignature(target))
      }

      const selector = AbiItem.getSelector(target)
      const first = abi.find((item) => AbiItem.getSelector(item) === selector)!
      expect(
        AbiItem.getSignature(AbiItem.fromAbi(abi, selector as never) as never),
      ).toBe(AbiItem.getSignature(first))
      expect(AbiItem.getSelector(abi, target.name)).toBe(
        AbiItem.getSelector(
          AbiItem.fromAbi(abi, target.name as never) as never,
        ),
      )
      expect(
        AbiFunction.encodeData(abi, selector as never, args as never),
      ).toBe(AbiFunction.encodeData(first, args as never))
    },
  )
})

/** Lowercases hex strings, so checksummed and lowercase addresses compare equal. */
function canonical(value: unknown): unknown {
  if (typeof value === 'string')
    return /^0x[0-9a-fA-F]*$/.test(value) ? value.toLowerCase() : value
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, canonical(item)]),
    )
  return value
}
