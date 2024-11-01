/// <reference types="@types/bun" />

import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { AbiParameters, Json } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './abi.json.gz'))

describe('AbiParameters.encode', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(
        AbiParameters.encode(Json.parse(v.parameters), Json.parse(v.values)),
      ).toEqual(v.encoded)
    })
  })
})

describe('AbiParameters.decode', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(AbiParameters.decode(Json.parse(v.parameters), v.encoded)).toEqual(
        Json.parse(v.values),
      )
    })
  })
})
