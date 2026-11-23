/**
 * Calls the public functions that none of ox's tests call in a way the speed bench can replay,
 * with arguments like their docs show, so the bench has a call to replay for each.
 * `speed-vitest.config.ts` runs this file with ox's tests while recording; it asserts nothing and
 * needs no node.
 *
 * The WebAuthn ceremonies get the browser responses ox's WebAuthn tests mock, from callbacks that
 * close over nothing, so they replay from their source; ox's tests pass callbacks that record the
 * options they get. A provider wraps an HTTP transport, which makes no request until it is used.
 * `Kzg.from` wraps the KZG implementation ox's tests build in test/kzg.ts, which ox's tests only
 * call while that module loads, before the recorder knows the module's exports.
 *
 * @module
 */

import {
  Kzg,
  Provider,
  RpcSchema,
  RpcTransport,
  Signature,
  WebAuthnP256,
} from 'ox'
import { TransactionReceipt } from 'ox/tempo'
import { Authentication, Authenticator, Registration } from 'ox/webauthn'
import { beforeAll, test, vi } from 'vitest'

import { kzg } from '../../test/kzg.js'

beforeAll(() => {
  vi.stubGlobal('window', {
    document: { title: 'My Website' },
    location: { hostname: 'example.com', origin: 'https://example.com' },
  })
})

test('RpcSchema.from', () => {
  RpcSchema.from()
})

test('Signature.toLegacy', () => {
  Signature.toLegacy({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  })
})

test('Authenticator.getSignCount', () => {
  Authenticator.getSignCount(
    '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
  )
})

test('Kzg.from', () => {
  Kzg.from(kzg)
})

test('Provider.from', () => {
  Provider.from(RpcTransport.fromHttp('http://localhost:8545'))
})

test('tempo TransactionReceipt', () => {
  const receipt = TransactionReceipt.fromRpc({
    blobGasPrice: '0x42069',
    blobGasUsed: '0x1337',
    blockHash:
      '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
    blockNumber: '0x12f296f',
    contractAddress: null,
    cumulativeGasUsed: '0x82515',
    effectiveGasPrice: '0x21c2f6c09',
    feePayer: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
    feeToken: '0x20c0000000000000000000000000000000000001',
    from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
    gasUsed: '0x2abba',
    logs: [],
    logsBloom:
      '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
    status: '0x1',
    to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
    transactionHash:
      '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
    transactionIndex: '0x2',
    type: '0x2',
  } as never)
  TransactionReceipt.toRpc(receipt)
})

test('WebAuthn credential creation', async () => {
  const createFn = () =>
    Promise.resolve({
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      response: {
        getPublicKey: () => [
          48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134, 72,
          206, 61, 3, 1, 7, 3, 66, 0, 4, 171, 137, 20, 0, 20, 15, 196, 248, 233,
          65, 206, 15, 249, 14, 65, 157, 233, 71, 10, 202, 202, 97, 59, 189,
          113, 122, 71, 117, 67, 80, 49, 167, 216, 132, 49, 142, 145, 159, 211,
          179, 229, 166, 49, 216, 102, 216, 163, 128, 180, 64, 99, 231, 15, 12,
          56, 30, 225, 110, 6, 82, 247, 249, 117, 84,
        ],
      },
    } as never)
  await WebAuthnP256.createCredential({ createFn, name: 'Foo' })
  await Registration.create({ createFn, name: 'Foo' })
})

test('WebAuthn signing', async () => {
  const getFn = () =>
    Promise.resolve({
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      response: {
        authenticatorData: [
          73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96,
          91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29,
          151, 99, 5, 0, 0, 0, 0,
        ],
        clientDataJSON: [
          123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116,
          104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101,
          110, 103, 101, 34, 58, 34, 57, 106, 69, 70, 105, 106, 117, 104, 69,
          87, 114, 77, 52, 83, 79, 87, 45, 116, 67, 104, 74, 98, 85, 69, 72, 69,
          80, 52, 52, 86, 99, 106, 99, 74, 45, 66, 113, 111, 49, 102, 84, 77,
          56, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116,
          116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58,
          53, 49, 55, 51, 34, 44, 34, 99, 114, 111, 115, 115, 79, 114, 105, 103,
          105, 110, 34, 58, 102, 97, 108, 115, 101, 125,
        ],
        signature: [
          48, 70, 2, 33, 0, 146, 61, 150, 57, 188, 182, 119, 250, 23, 162, 103,
          56, 232, 200, 162, 77, 88, 37, 145, 151, 40, 59, 42, 63, 46, 225, 53,
          221, 74, 128, 13, 165, 2, 33, 0, 128, 39, 38, 71, 180, 153, 30, 232,
          243, 94, 159, 66, 42, 246, 56, 195, 195, 139, 40, 163, 26, 34, 125,
          244, 171, 166, 7, 178, 169, 246, 142, 198,
        ],
      },
    } as never)
  const challenge =
    '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf'
  await WebAuthnP256.sign({ challenge, getFn })
  await Authentication.sign({ challenge, getFn })
})
