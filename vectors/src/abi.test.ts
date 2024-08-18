/// <reference types="@types/bun" />

import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { Abi } from '../../src/index.js'
import { readGzippedJson } from '../utils.js'

const vectors = await readGzippedJson(join(import.meta.dir, './abi.json.gz'))

describe('Abi.encode', () => {
  vectors.forEach((v, i) => {
    test(`${i}`, () => {
      expect(Abi.encode(v.parameters, v.values)).toEqual(v.encoded)
    })
  })
})

// TODO
// describe.skip('Abi.decode', () => {
//   vectors.forEach((v, i) => {
//     test(`${i}`, () => {
//       expect(Abi.decode(v.parameters, v.encoded)).toEqual(v.values)
//     });
//   });
// })
