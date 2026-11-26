/**
 * Calls public functions that ox's tests never call directly, or call only in ways the speed bench
 * cannot replay, so the bench has arguments to replay. Only `speed-vitest.config.ts` runs this file.
 *
 * - `AbiError`'s tests run in a `describe` that first deploys a contract on a forked Anvil, so they
 *   record nothing without a fork RPC URL.
 * - The KZG functions' tests pass a `Kzg.from` object built from closures. Here they take
 *   `ox/wasm`'s `Kzg.create`, which the bench rebuilds by awaiting the call again.
 *
 * @module
 */

import { AbiError, BlobCells, Blobs, BlsPoint, RpcSchema, Signature } from 'ox'
import { Setups } from 'ox/trusted-setups'
import { Kzg } from 'ox/wasm'
import { Authenticator } from 'ox/webauthn'
import { z } from 'ox/zod'
import { describe, test } from 'vitest'

describe('uphill speed calls', () => {
  test('AbiError', () => {
    const error = AbiError.from(
      'error InsufficientBalance(address account, uint256 needed)',
    )
    AbiError.format(error)
    AbiError.getSelector(error)
    const data = AbiError.encode(error, [
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      42n,
    ])
    AbiError.decode(error, data)
    const abi = [error, AbiError.from('error Unauthorized()')] as const
    AbiError.fromAbi(abi, 'InsufficientBalance')
    AbiError.extract(abi, data)
  })

  test('small helpers', () => {
    BlsPoint.fp2FromBigInt({ c0: 1n, c1: 2n })
    RpcSchema.from()
    Signature.toLegacy({
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 1,
    })
    Authenticator.getSignCount(
      '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000007',
    )
    z.Bytes.sizedBytes(32)
  })

  test('KZG', async () => {
    const kzg = await Kzg.create({ trustedSetup: Setups.mainnet })
    try {
      const blobs = Blobs.from('0xdeadbeef', { as: 'Bytes' })
      Blobs.toCommitments(blobs, { kzg })
      Blobs.toVersionedHashes(blobs, { kzg })
      Blobs.toCellProofs(blobs, { kzg })
      const { cells, proofs } = BlobCells.fromBlob(blobs[0]!, { kzg })
      BlobCells.toDataColumns(blobs, { kzg })
      const commitment = Blobs.toCommitments(blobs, { kzg })[0]!
      BlobCells.verify({
        cells: cells.slice(0, 2),
        cellIndices: [0, 1],
        commitments: [commitment, commitment],
        kzg,
        proofs: proofs.slice(0, 2),
      })
      BlobCells.recover(
        cells.map((_, index) => index).slice(0, 64),
        cells.slice(0, 64),
        { kzg },
      )
    } finally {
      kzg.dispose()
    }
  }, 120_000)
})
