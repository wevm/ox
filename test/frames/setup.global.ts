import { createServer } from './prool.js'

export default async function () {
  return await createServer().start()
}
