/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import type * as abitype from 'abitype'
import * as z from 'zod/mini'

export const Identifier = z
  .string()
  .check(
    z.refine(
      (value) => /^[a-zA-Z$_][a-zA-Z0-9$_]*$/.test(value),
      'expected identifier',
    ),
  )

export const Address = z.literal('address')
export const Bool = z.literal('bool')
export const Bytes = z
  .string()
  .check(
    z.refine(
      (value): value is abitype.SolidityBytes =>
        /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(value),
      'expected Solidity bytes type',
    ),
  )
export const Function = z.literal('function')
export const String = z.literal('string')
export const Tuple = z.literal('tuple')
export const Int = z
  .string()
  .check(
    z.refine(
      (value): value is abitype.SolidityInt =>
        /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
          value,
        ),
      'expected Solidity integer type',
    ),
  )
export const ArrayWithoutTuple = z
  .string()
  .check(
    z.refine(
      (value): value is abitype.SolidityArrayWithoutTuple =>
        /^(address|bool|function|string|bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?|u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?)(\[[0-9]{0,}\])+$/.test(
          value,
        ),
      'expected Solidity array type',
    ),
  )
export const ArrayWithTuple = z
  .string()
  .check(
    z.refine(
      (value): value is abitype.SolidityArrayWithTuple =>
        /^tuple(\[[0-9]{0,}\])+$/.test(value),
      'expected Solidity tuple array type',
    ),
  )
export const Array = z.union([ArrayWithTuple, ArrayWithoutTuple])

export const Type = z.union([
  Address,
  Bool,
  Bytes,
  Function,
  String,
  Tuple,
  Int,
  Array,
])

export function isType(type: string) {
  return (
    type === 'address' ||
    type === 'bool' ||
    type === 'function' ||
    type === 'string' ||
    /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(type) ||
    /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
      type,
    )
  )
}
