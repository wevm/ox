/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiConstructor from './AbiConstructor.js'
import * as z_AbiError from './AbiError.js'
import * as z_AbiEvent from './AbiEvent.js'
import * as z_AbiFallback from './AbiFallback.js'
import * as z_AbiFunction from './AbiFunction.js'
import * as z_AbiReceive from './AbiReceive.js'
import * as z from 'zod/mini'

export const Type = z.union([
  /* @__PURE__ */ z.literal('constructor'),
  /* @__PURE__ */ z.literal('event'),
  /* @__PURE__ */ z.literal('error'),
  /* @__PURE__ */ z.literal('fallback'),
  /* @__PURE__ */ z.literal('function'),
  /* @__PURE__ */ z.literal('receive'),
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
