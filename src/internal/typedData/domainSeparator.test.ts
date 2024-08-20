import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'
import { domainSeparator } from './domainSeparator.js'

test('default', () => {
  expect(domainSeparator(typedData.basic.domain)).toMatchInlineSnapshot(
    `"0x2fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413"`,
  )
})
