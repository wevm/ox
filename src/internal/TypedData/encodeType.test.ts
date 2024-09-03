import { TypedData } from 'ox'
import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'

test('default', () => {
  expect(
    TypedData.encodeType({
      ...typedData.basic,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"Mail(Person from,Person to,string contents)Person(string name,address wallet)"`,
  )
})
