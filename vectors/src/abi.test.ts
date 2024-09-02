/// <reference types="@types/bun" />

import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { AbiParameters } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './abi.json.gz'))

describe('AbiParameters.encode', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(AbiParameters.encode(v.parameters, v.values)).toEqual(v.encoded)
    })
  })
})

describe.skip('AbiParameters.decode', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(AbiParameters.decode(v.parameters, v.encoded)).toEqual(v.values)
    })
  })
})
