import { Hash, Hex } from 'ox'
import { PublisherId } from 'ox/tempo'
import { describe, expect, test } from 'vitest'
import { transaction } from '../../test/tempo/zk.js'

describe('from', () => {
  test('default', () => {
    expect(
      PublisherId.from({
        creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        salt: Hash.keccak256(Hex.fromString('tempo:oidc-demo')),
      }),
    ).toMatchInlineSnapshot(
      `"0x0f1827bc3bbfd0fe6e7bc724ebaaaf1e1acb874cb0fb5344411ffaf59f164245"`,
    )
  })

  test('behavior: matches the node', () => {
    expect(
      PublisherId.from({
        creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        salt: Hash.keccak256(Hex.fromString('tempo:oidc-demo:e2e')),
      }),
    ).toBe(transaction.keyAuthorization.signature.publisherId)
  })

  test('behavior: depends on the creator', () => {
    const salt = Hash.keccak256(Hex.fromString('tempo:oidc-demo'))
    expect(
      PublisherId.from({
        creator: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        salt,
      }),
    ).not.toBe(
      PublisherId.from({
        creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        salt,
      }),
    )
  })

  test('error: rejects salts that are not 32 bytes', () => {
    expect(() =>
      PublisherId.from({
        creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        salt: '0x01',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiParameters.BytesSizeMismatchError: Size of bytes "0x01" (bytes1) does not match expected size (bytes32).]`,
    )
  })
})
