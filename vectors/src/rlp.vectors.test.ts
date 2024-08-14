/// <reference types="@types/bun" />

import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'

import { Rlp } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './rlp.json.gz'))

describe('Rlp.encode', () => {
  vectors.forEach((v, i) => {
    test(`${i}`, () => {
      expect(Rlp.encode(v.decoded, 'hex')).toEqual(v.encoded)
    })
  })
})

describe('Rlp.decode', () => {
  vectors.forEach((v, i) => {
    test(`${i}`, () => {
      expect(Rlp.decode(v.encoded)).toEqual(v.decoded)
    })
  })
})
