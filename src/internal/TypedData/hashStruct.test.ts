import { TypedData } from 'ox'
import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'

test('default', () => {
  expect(
    TypedData.hashStruct({
      ...typedData.basic,
      primaryType: 'Mail',
      data: typedData.basic.message,
    }),
  ).toMatchInlineSnapshot(
    `"0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e"`,
  )
})
