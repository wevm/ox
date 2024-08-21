import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cKzg from 'c-kzg'
import { Kzg } from 'ox'
import { Path } from 'ox/node'

export const kzg = Kzg.setup(cKzg, Path.mainnetTrustedSetup)

export const blobData = readFileSync(
  resolve(__dirname, './kzg/lorem-ipsum.txt'),
  'utf-8',
)
