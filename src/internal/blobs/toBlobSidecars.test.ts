import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData, kzg } from '../../../test/kzg.js'

test('default', () => {
  {
    const data = Hex.from(blobData)
    const blobs = Blobs.from(data)
    const sidecars = Blobs.toSidecars(blobs, {
      kzg,
    })
    const blobs_ = sidecars.map(({ blob }) => blob)
    expect(Blobs.toHex(blobs_)).toEqual(data)
  }

  {
    const data = Bytes.from(blobData)
    const blobs = Blobs.from(data)
    const sidecars = Blobs.toSidecars(blobs, {
      kzg,
    })
    const blobs_ = sidecars.map(({ blob }) => blob)
    expect(Blobs.toBytes(blobs_)).toEqual(data)
  }
})

test('args: blobs, commitments, proofs', () => {
  const data = Hex.from(blobData)
  const blobs = Blobs.from(data)
  const commitments = Blobs.toCommitments(blobs, { kzg })
  const proofs = Blobs.toProofs(blobs, { commitments, kzg })
  const sidecars = Blobs.toSidecars(blobs, {
    commitments,
    proofs,
  })
  const sidecarBlobs = sidecars.map(({ blob }) => blob)
  expect(Blobs.toHex(sidecarBlobs)).toEqual(data)
  expect(
    sidecars.map(({ commitment, proof }) => ({
      commitment,
      proof,
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "commitment": "0x93fd6807e033db6b24db5485814f79a98c7e241432e95c2e327042f821f24f4a59315cf4e881205f472e99835729977a",
        "proof": "0x91a6c5d19e50b1b85ae2ef07477160381babf00f0906f5219ce09dee2e00d7d347cb0586d90b491637cdb1715e62d152",
      },
      {
        "commitment": "0xaa9da85a334c2935e670bd44e9b734481fc5ab72859c76f741008a92c2836932af9e60697b6319f3454a141154fcd583",
        "proof": "0xa660592b94033f9c5f7987005fa5d1f84435585ddaaf4b3adc0a198b983f2ae007db73b90067a96ec214b24d7b9820b9",
      },
    ]
  `)
})
