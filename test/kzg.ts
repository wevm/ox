import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cKzg from 'c-kzg'
import { Kzg } from 'ox'
import { Paths } from 'ox/trusted-setups'

cKzg.loadTrustedSetup(Paths.mainnet)

export const kzg = Kzg.from(cKzg)

export const blobData = readFileSync(
  resolve(__dirname, './kzg/lorem-ipsum.txt'),
  'utf-8',
)
