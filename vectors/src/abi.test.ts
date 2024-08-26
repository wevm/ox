/// <reference types="@types/bun" />

import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { Abi } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './abi.json.gz'))

describe('Abi.encodeParameters', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(Abi.encodeParameters(v.parameters, v.values)).toEqual(v.encoded)
    })
  })
})

describe.skip('Abi.decodeParameters', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(Abi.decodeParameters(v.parameters, v.encoded)).toEqual(v.values)
    })
  })
})
