import type { AbiEventParameter, AbiParameter } from 'abitype'
import type { Join } from './types.js'
import {
  type FormatAbiParameter,
  formatAbiParameter,
} from './formatAbiParameter.js'

/**
 * Formats `AbiParameter`s to human-readable ABI parameter.
 *
 * @param abiParameters - ABI parameters
 * @returns Human-readable ABI parameters
 */
export type FormatAbiParameters<
  abiParameters extends readonly [
    AbiParameter | AbiEventParameter,
    ...(readonly (AbiParameter | AbiEventParameter)[]),
  ],
> = Join<
  {
    [key in keyof abiParameters]: FormatAbiParameter<abiParameters[key]>
  },
  ', '
>

/**
 * Formats `AbiParameter`s to human-readable ABI parameters.
 *
 * @param abiParameters - ABI parameters
 * @returns Human-readable ABI parameters
 */
export function formatAbiParameters<
  const abiParameters extends readonly [
    AbiParameter | AbiEventParameter,
    ...(readonly (AbiParameter | AbiEventParameter)[]),
  ],
>(abiParameters: abiParameters): FormatAbiParameters<abiParameters> {
  let params = ''
  const length = abiParameters.length
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i]!
    params += formatAbiParameter(abiParameter)
    if (i !== length - 1) params += ', '
  }
  return params as FormatAbiParameters<abiParameters>
}
