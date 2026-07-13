/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Hex from '../Hex.js'

/** TIP-20 pool id schema (32-byte hex). */
export const PoolId = z_Hex.Hex32
