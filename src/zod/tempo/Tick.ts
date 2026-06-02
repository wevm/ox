/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Tick from '../../tempo/Tick.js'
import * as z from 'zod/mini'

/** Tick schema (integer within `[minTick, maxTick]`). */
export const Tick = z
  .number()
  .check(
    z.refine(
      (value) =>
        Number.isInteger(value) &&
        value >= core_Tick.minTick &&
        value <= core_Tick.maxTick,
      'expected tick',
    ),
  )
