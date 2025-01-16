import { parseAbiParameter, splitParameters } from '../../abiParameter.js'
import { InvalidSignatureError, UnknownSignatureError } from '../errors.js'
import {
  eventModifiers,
  execConstructorSignature,
  execErrorSignature,
  execEventSignature,
  execFallbackSignature,
  execFunctionSignature,
  functionModifiers,
  isConstructorSignature,
  isErrorSignature,
  isEventSignature,
  isFallbackSignature,
  isFunctionSignature,
  isReceiveSignature,
} from '../signatures.js'
import type { StructLookup } from '../structs.js'

export function parseSignature(signature: string, structs: StructLookup = {}) {
  if (isFunctionSignature(signature))
    return parseFunctionSignature(signature, structs)

  if (isEventSignature(signature))
    return parseEventSignature(signature, structs)

  if (isErrorSignature(signature))
    return parseErrorSignature(signature, structs)

  if (isConstructorSignature(signature))
    return parseConstructorSignature(signature, structs)

  if (isFallbackSignature(signature)) return parseFallbackSignature(signature)

  if (isReceiveSignature(signature))
    return {
      type: 'receive',
      stateMutability: 'payable',
    }

  throw new UnknownSignatureError({ signature })
}

export function parseFunctionSignature(
  signature: string,
  structs: StructLookup = {},
) {
  const match = execFunctionSignature(signature)
  if (!match)
    throw new InvalidSignatureError({
      signature,
      type: 'function',
    })

  const inputParams = splitParameters(match.parameters)
  const inputs = []
  const inputLength = inputParams.length
  for (let i = 0; i < inputLength; i++) {
    inputs.push(
      parseAbiParameter(inputParams[i]!, {
        modifiers: functionModifiers,
        structs,
        type: 'function',
      }),
    )
  }

  const outputs = []
  if (match.returns) {
    const outputParams = splitParameters(match.returns)
    const outputLength = outputParams.length
    for (let i = 0; i < outputLength; i++) {
      outputs.push(
        parseAbiParameter(outputParams[i]!, {
          modifiers: functionModifiers,
          structs,
          type: 'function',
        }),
      )
    }
  }

  return {
    name: match.name,
    type: 'function',
    stateMutability: match.stateMutability ?? 'nonpayable',
    inputs,
    outputs,
  }
}

export function parseEventSignature(
  signature: string,
  structs: StructLookup = {},
) {
  const match = execEventSignature(signature)
  if (!match) throw new InvalidSignatureError({ signature, type: 'event' })

  const params = splitParameters(match.parameters)
  const abiParameters = []
  const length = params.length
  for (let i = 0; i < length; i++)
    abiParameters.push(
      parseAbiParameter(params[i]!, {
        modifiers: eventModifiers,
        structs,
        type: 'event',
      }),
    )
  return { name: match.name, type: 'event', inputs: abiParameters }
}

export function parseErrorSignature(
  signature: string,
  structs: StructLookup = {},
) {
  const match = execErrorSignature(signature)
  if (!match) throw new InvalidSignatureError({ signature, type: 'error' })

  const params = splitParameters(match.parameters)
  const abiParameters = []
  const length = params.length
  for (let i = 0; i < length; i++)
    abiParameters.push(
      parseAbiParameter(params[i]!, { structs, type: 'error' }),
    )
  return { name: match.name, type: 'error', inputs: abiParameters }
}

export function parseConstructorSignature(
  signature: string,
  structs: StructLookup = {},
) {
  const match = execConstructorSignature(signature)
  if (!match)
    throw new InvalidSignatureError({
      signature,
      type: 'constructor',
    })

  const params = splitParameters(match.parameters)
  const abiParameters = []
  const length = params.length
  for (let i = 0; i < length; i++)
    abiParameters.push(
      parseAbiParameter(params[i]!, { structs, type: 'constructor' }),
    )
  return {
    type: 'constructor',
    stateMutability: match.stateMutability ?? 'nonpayable',
    inputs: abiParameters,
  }
}

export function parseFallbackSignature(signature: string) {
  const match = execFallbackSignature(signature)
  if (!match)
    throw new InvalidSignatureError({
      signature,
      type: 'fallback',
    })

  return {
    type: 'fallback',
    stateMutability: match.stateMutability ?? 'nonpayable',
  }
}
