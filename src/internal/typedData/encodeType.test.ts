import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'
import { encodeType } from './encodeType.js'

test('default', () => {
  expect(
    encodeType({
      ...typedData.basic,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"Mail(Person from,Person to,string contents)Person(string name,address wallet)"`,
  )
})
