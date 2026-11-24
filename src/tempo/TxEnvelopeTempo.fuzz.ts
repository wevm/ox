import { fc, test } from '@fast-check/vitest'
import { Hex, Rlp } from 'ox'
import { describe, expect } from 'vp/test'
import { arbitraryRecursiveRlpHex } from '../../test/fuzz/arbitraries/rlp.js'
import { numRuns } from '../../test/fuzz/numRuns.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

describe('deserialize', () => {
  test.prop(
    {
      body: arbitraryRecursiveRlpHex({ maxLeafBytes: 70 }),
      // The Tempo transaction type, signature envelope types, or none.
      type: fc.constantFrom('0x76', '0x01', '0x02', '0x03', '0x04', '0x'),
    },
    { numRuns },
  )('malformed input never throws a built-in error', ({ body, type }) => {
    const serialized = Hex.concat(type as Hex.Hex, Rlp.fromHex(body))
    for (const deserialize of [
      TxEnvelopeTempo.deserialize,
      KeyAuthorization.deserialize,
      SignatureEnvelope.deserialize,
    ])
      try {
        deserialize(serialized as never)
      } catch (error) {
        // ox's errors, including KeyAuthorization's own `Error` subclasses.
        // A built-in error means input reached code that assumed its shape.
        expect([
          RangeError,
          ReferenceError,
          SyntaxError,
          TypeError,
        ]).not.toContain((error as Error).constructor)
      }
  })
})
