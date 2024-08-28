/// <reference types="@types/bun" />

import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { Rlp } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './rlp.json.gz'))

describe('Rlp.from', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(Rlp.from(v.decoded, 'Hex')).toEqual(v.encoded)
    })
  })
})

describe('Rlp.to', () => {
  vectors.forEach((v: any, i: number) => {
    test(`${i}`, () => {
      expect(Rlp.to(v.encoded, 'Hex')).toEqual(v.decoded)
    })
  })
})
