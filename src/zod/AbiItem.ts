/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiConstructor from './AbiConstructor.js'
import * as z_AbiError from './AbiError.js'
import * as z_AbiEvent from './AbiEvent.js'
import * as z_AbiFallback from './AbiFallback.js'
import * as z_AbiFunction from './AbiFunction.js'
import * as z_AbiReceive from './AbiReceive.js'
import * as z from 'zod/mini'

export const Type = z.union([
  z.literal('constructor'),
  z.literal('event'),
  z.literal('error'),
  z.literal('fallback'),
  z.literal('function'),
  z.literal('receive'),
])

export const AbiItem = z.union([
  z_AbiConstructor.AbiConstructor,
  z_AbiError.AbiError,
  z_AbiEvent.AbiEvent,
  z_AbiFallback.AbiFallback,
  z_AbiFunction.AbiFunction,
  z_AbiReceive.AbiReceive,
])

export const AbiItemType = Type
