/// <reference types="@types/bun" />

import { join } from 'node:path'
import { AbiParameters, Hex, Json, Solidity } from '../../src/index.js'

export async function generateAbiVectors() {
  const generatedPath = join(import.meta.dir, './abi.json')
  Bun.write(generatedPath, '')

  const generated = Bun.file(generatedPath)
  const writer = generated.writer()

  writer.write('[')

  for (let i = 0; i < 2048; i++) {
    if (i > 0) writer.write(',')
    const parameters = generateParameters(10)
    const values = generateValues(parameters)
    const encoded = AbiParameters.encode(parameters, values)
    writer.write(
      Json.stringify(
        {
          parameters: Json.stringify(parameters),
          values: Json.stringify(values),
          encoded,
        },
        null,
        2,
      ),
    )
  }

  writer.write(']\n')
  writer.end()

  const gzipped = Bun.gzipSync(new Uint8Array(await generated.arrayBuffer()))
  Bun.write(`${generatedPath}.gz`, gzipped)
}

function generateAddress() {
  const bytes = generateBytes(20)
  return Hex.fromBytes(bytes)
}

function generateBytes(length: number) {
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 255)
  return bytes
}

function generateBigInt(max: bigint) {
  const bytes = Math.ceil(Number(max).toString(2).length / 8)
  let value = 0n
  for (let i = 0; i < bytes; i++) {
    value = (value << 8n) + BigInt(Math.floor(Math.random() * 256))
  }
  return value % max
}

function generateValues(parameters: AbiParameters.Parameter[]) {
  const values: any[] = []
  for (const parameter of parameters) {
    if (parameter.type.includes('[')) {
      const arrayMatch = parameter.type.match(/(.*)\[(.*)\]/)
      if (!arrayMatch) continue
      const [_, type, size] = arrayMatch
      const length = size
        ? Number.parseInt(size)
        : Math.floor(Math.random() * 8)
      const nested = []
      for (let i = 0; i < length; i++) {
        nested.push(
          // @ts-ignore
          generateValues([{ components: parameter.components, type }])[0],
        )
      }
      values.push(nested)
      continue
    }
    if (parameter.type.startsWith('int') || parameter.type.startsWith('uint')) {
      const intMatch = parameter.type.match(Solidity.integerRegex)
      if (!intMatch) continue
      const [_, type, size_str = '256'] = intMatch
      const size = Number.parseInt(size_str)
      const max =
        type === 'int'
          ? Math.random() > 0.5
            ? -(2n ** (BigInt(size) - 1n))
            : 2n ** (BigInt(size) - 1n) - 1n
          : 2n ** BigInt(size) - 1n
      const int = generateBigInt(max)
      values.push(size > 48 ? int : Number(int))
      continue
    }
    if (parameter.type === 'bool') {
      const value = Math.random() > 0.5
      values.push(value)
      continue
    }
    if (parameter.type === 'address') {
      values.push(generateAddress())
      continue
    }
    if (parameter.type.startsWith('bytes')) {
      const bytesMatch = parameter.type.match(Solidity.bytesRegex)
      if (!bytesMatch) continue
      const [_, size = '32'] = bytesMatch
      const value = Hex.fromBytes(generateBytes(Number.parseInt(size)))
      values.push(value)
      continue
    }
    if (parameter.type === 'string') {
      const value = Math.random().toString(36).slice(2)
      values.push(value)
      continue
    }
    if (parameter.type === 'tuple' && 'components' in parameter) {
      const value = generateValues(
        parameter.components as AbiParameters.Parameter[],
      )
      values.push(value)
    }
  }
  return values
}

function generateParameters(maxLength: number, level = 0) {
  if (level > 10) return []

  const parameters: AbiParameters.Parameter[] = []
  const length = Math.floor(Math.random() * maxLength)
  for (let i = 0; i < length; i++) {
    const types = ['int', 'uint', 'bool', 'address', 'bytes', 'string', 'tuple']
    const type = types[Math.floor(Math.random() * types.length)]

    let parameter: AbiParameters.Parameter = { type: 'tuple' }
    if (type === 'int' || type === 'uint') {
      const hasSize = Math.random() > 0.5
      const size = hasSize ? Math.floor(Math.random() * 31) * 8 + 8 : undefined
      parameter = {
        type: `${type}${hasSize ? size : ''}`,
      }
    } else if (type === 'bool' || type === 'address' || type === 'string') {
      parameter = {
        type: type,
      }
    }
    if (type === 'bytes') {
      const hasSize = Math.random() > 0.5
      const size = hasSize ? Math.floor(Math.random() * 3) * 8 + 8 : undefined
      parameter = {
        type: `${type}${hasSize ? size : ''}`,
      }
    }
    if (type === 'tuple') {
      const hasComponents = Math.random() > 0.1
      const components = hasComponents
        ? generateParameters(maxLength, level + 1)
        : []
      if (components.length === 0) continue
      parameter = {
        type: 'tuple',
        components,
      }
    }

    const hasSize = Math.random() > 0.5
    const isArray = Math.random() > 0.5
    if (isArray) {
      parameter.type += `[${hasSize ? Math.floor(Math.random() * 8 + 1) : ''}]`
    }

    parameters.push(parameter)
  }
  return parameters
}
