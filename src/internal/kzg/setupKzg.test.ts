import * as cKzg from 'c-kzg'
import { Kzg } from 'ox'
import { Path } from 'ox/node'
import { expect, test } from 'vitest'

test('setupKzg', () => {
  const kzg = Kzg.setup(cKzg, Path.mainnetTrustedSetup)

  expect(kzg).toMatchInlineSnapshot(`
    {
      "blobToKzgCommitment": [Function],
      "computeBlobKzgProof": [Function],
    }
  `)
})
