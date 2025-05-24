import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { trustedSetup as fastSetup } from '@paulmillr/trusted-setups/fast-kzg.js'
import { KZG } from 'micro-eth-signer/kzg.js'
import { Bytes, Hex, Kzg } from 'ox'

const k = new KZG(fastSetup)
export const kzg = Kzg.from({
  blobToKzgCommitment(blob) {
    return Hex.toBytes(
      k.blobToKzgCommitment(Bytes.toHex(blob)) as `0x${string}`,
    )
  },
  computeBlobKzgProof(blob, commitment) {
    return Hex.toBytes(
      k.computeBlobProof(
        Bytes.toHex(blob),
        Bytes.toHex(commitment),
      ) as `0x${string}`,
    )
  },
})

export const blobData = readFileSync(
  resolve(__dirname, './kzg/lorem-ipsum.txt'),
  'utf-8',
)
