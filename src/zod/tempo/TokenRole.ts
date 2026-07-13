/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_TokenRole from '../../tempo/TokenRole.js'
import * as z from 'zod/mini'

/** TIP-20 token role schema. */
export const TokenRole = z.literal(core_TokenRole.roles)
