import { expect, test } from 'vitest'

import * as unit from './value.js'

test('exports unit', () => {
  expect(unit).toMatchInlineSnapshot(`
    {
      "valueExponents": {
        "ether": 18,
        "finney": 15,
        "gwei": 9,
        "szabo": 12,
        "wei": 0,
      },
    }
  `)
})
