import { beforeAll, describe, expect, test } from 'vp/test'
import * as vectors from '../../../test/vectors/pbkdf2/index.js'
import * as WasmKeystore from '../Keystore.js'

let engine: WasmKeystore.create.ReturnType

beforeAll(async () => {
  engine = await WasmKeystore.create()
})

describe('pbkdf2Sha256', () => {
  test(`matches ${vectors.vectors.length} RFC 7914 vectors`, () => {
    for (const { iterations, key, password, salt } of vectors.vectors)
      expect(
        engine.Keystore.pbkdf2Sha256(password, salt, {
          c: iterations,
          dkLen: key.length,
        }),
      ).toEqual(key)
  })
})
