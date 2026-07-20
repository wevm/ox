import { port, tag } from './multisig.js'
import { createServer } from './prool.js'

export default async function () {
  const server = await createServer({ port, tag })
  return server.start()
}
