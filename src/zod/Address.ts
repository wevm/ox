/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

/** Address schema. */
export const Address = z
  .templateLiteral([z.literal('0x'), z.string()])
  .check(
    z.refine((value) => /^0x[0-9a-fA-F]{40}$/.test(value), 'expected address'),
  )
