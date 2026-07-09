/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z from 'zod/mini'

export const AbiParameters = z.readonly(z.array(z_AbiParameter.AbiParameter))

export const Parameter = z_AbiParameter.AbiParameter
