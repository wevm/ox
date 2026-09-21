import { afterAll, beforeAll } from 'vite-plus/test'
import { rpcUrl } from './prool.js'

beforeAll(async () => {
  const response = await fetch(`${rpcUrl}/start`)
  if (!response.ok) throw new Error(await response.text())
})

afterAll(async () => {
  const response = await fetch(`${rpcUrl}/destroy`)
  if (!response.ok) throw new Error(await response.text())
})
