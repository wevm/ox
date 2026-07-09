/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiItem from './AbiItem.js'
import * as z from 'zod/mini'

export const Abi = z.readonly(z.array(z_AbiItem.AbiItem))
