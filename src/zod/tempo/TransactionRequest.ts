/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import type * as core_TransactionRequest from '../../tempo/TransactionRequest.js'
import * as core_Hex from '../../core/Hex.js'
import * as z_AccessList from '../AccessList.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_TransactionRequest from '../TransactionRequest.js'
import {
  encodeNumberish,
  uintBigintNumberish,
  uintNumberNumberish,
} from '../internal/Integer.js'
import * as z from 'zod/mini'
import * as z_AuthorizationTempo from './AuthorizationTempo.js'
import * as z_KeyAuthorization from './KeyAuthorization.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'
import * as z_TokenId from './TokenId.js'

const fromRpcType = { '0x76': 'tempo' } as const
const toRpcType = { tempo: '0x76' } as const

const KeyType = z.union([
  z.literal('secp256k1'),
  z.literal('p256'),
  z.literal('webAuthn'),
])

const SignatureRpc = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  v: z.optional(z_Hex.Hex),
  yParity: z_Hex.Hex,
})

const SignatureDecoded = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  v: z.optional(z.number()),
  yParity: z.number(),
})

const CallRpc = z.object({
  data: z.optional(z_Hex.Hex),
  to: z.optional(z_Address.Address),
  value: z.optional(z_Hex.Hex),
})

const Call = z.object({
  data: z.optional(z_Hex.Hex),
  to: z.optional(z_Address.Address),
  value: z.optional(z.bigint()),
})

const CallToRpc = z.object({
  data: z.optional(z_Hex.Hex),
  to: z.optional(z_Address.Address),
  value: z.optional(uintBigintNumberish()),
})

/** RPC tempo transaction request schema. */
export const Rpc = z.object({
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.optional(z_AuthorizationTempo.ListRpc),
  blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
  blobs: z.optional(z.readonly(z.array(z_Hex.Hex))),
  calls: z.optional(z.readonly(z.array(CallRpc))),
  chainId: z.optional(z_Hex.Hex),
  data: z.optional(z_Hex.Hex),
  feePayer: z.optional(z.boolean()),
  feePayerSignature: z.optional(z.union([SignatureRpc, z.null()])),
  feeToken: z.optional(z_Hex.Hex),
  from: z.optional(z_Address.Address),
  gas: z.optional(z_Hex.Hex),
  gasPrice: z.optional(z_Hex.Hex),
  input: z.optional(z_Hex.Hex),
  keyAuthorization: z.optional(z_KeyAuthorization.Rpc),
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(KeyType),
  maxFeePerBlobGas: z.optional(z_Hex.Hex),
  maxFeePerGas: z.optional(z_Hex.Hex),
  maxPriorityFeePerGas: z.optional(z_Hex.Hex),
  nonce: z.optional(z_Hex.Hex),
  nonceKey: z.optional(z_Hex.Hex),
  r: z.optional(z_Hex.Hex),
  s: z.optional(z_Hex.Hex),
  signature: z.optional(z_SignatureEnvelope.Rpc),
  to: z.optional(z.union([z_Address.Address, z.null()])),
  type: z.optional(z.string()),
  v: z.optional(z_Hex.Hex),
  validAfter: z.optional(z_Hex.Hex),
  validBefore: z.optional(z_Hex.Hex),
  value: z.optional(z_Hex.Hex),
  yParity: z.optional(z_Hex.Hex),
})

const AuthorizationSigned = z.object({
  address: z_Address.Address,
  chainId: z.number(),
  nonce: z.bigint(),
  signature: z_SignatureEnvelope.Domain,
})

const AuthorizationSignedToRpc = z.object({
  address: z_Address.Address,
  chainId: uintNumberNumberish(),
  nonce: uintBigintNumberish(),
  signature: z_SignatureEnvelope.Domain,
})

/** Decoded tempo transaction request schema. */
export const Domain = z.object({
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.optional(z.readonly(z.array(AuthorizationSigned))),
  blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
  blobs: z.optional(z.readonly(z.array(z_Hex.Hex))),
  calls: z.optional(z.readonly(z.array(Call))),
  chainId: z.optional(z.number()),
  data: z.optional(z_Hex.Hex),
  feePayer: z.optional(z.boolean()),
  feePayerSignature: z.optional(z.union([SignatureDecoded, z.null()])),
  feeToken: z.optional(z.union([z_Address.Address, z.bigint()])),
  from: z.optional(z_Address.Address),
  gas: z.optional(z.bigint()),
  gasPrice: z.optional(z.bigint()),
  input: z.optional(z_Hex.Hex),
  keyAuthorization: z.optional(z_KeyAuthorization.Domain),
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(KeyType),
  maxFeePerBlobGas: z.optional(z.bigint()),
  maxFeePerGas: z.optional(z.bigint()),
  maxPriorityFeePerGas: z.optional(z.bigint()),
  nonce: z.optional(z.bigint()),
  nonceKey: z.optional(z.union([z.bigint(), z.literal('random')])),
  r: z.optional(z_Hex.Hex),
  s: z.optional(z_Hex.Hex),
  signature: z.optional(z_SignatureEnvelope.Domain),
  to: z.optional(z.union([z_Address.Address, z.null()])),
  type: z.optional(z.string()),
  v: z.optional(z.number()),
  validAfter: z.optional(z.number()),
  validBefore: z.optional(z.number()),
  value: z.optional(z.bigint()),
  yParity: z.optional(z.number()),
})

/** Encode-only decoded tempo transaction request schema accepting numberish `toRpc` inputs. */
export const DomainToRpc = z.object({
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.optional(z.readonly(z.array(AuthorizationSignedToRpc))),
  blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
  blobs: z.optional(z.readonly(z.array(z_Hex.Hex))),
  calls: z.optional(z.readonly(z.array(CallToRpc))),
  chainId: z.optional(uintNumberNumberish()),
  data: z.optional(z_Hex.Hex),
  feePayer: z.optional(z.boolean()),
  feePayerSignature: z.optional(z.union([SignatureDecoded, z.null()])),
  feeToken: z.optional(z.union([z_Address.Address, z.bigint()])),
  from: z.optional(z_Address.Address),
  gas: z.optional(uintBigintNumberish()),
  gasPrice: z.optional(uintBigintNumberish()),
  input: z.optional(z_Hex.Hex),
  keyAuthorization: z.optional(z_KeyAuthorization.DomainToRpc),
  keyData: z.optional(z_Hex.Hex),
  keyType: z.optional(KeyType),
  maxFeePerBlobGas: z.optional(uintBigintNumberish()),
  maxFeePerGas: z.optional(uintBigintNumberish()),
  maxPriorityFeePerGas: z.optional(uintBigintNumberish()),
  nonce: z.optional(uintBigintNumberish()),
  nonceKey: z.optional(z.union([uintBigintNumberish(), z.literal('random')])),
  r: z.optional(z_Hex.Hex),
  s: z.optional(z_Hex.Hex),
  signature: z.optional(z_SignatureEnvelope.Domain),
  to: z.optional(z.union([z_Address.Address, z.null()])),
  type: z.optional(z.string()),
  v: z.optional(z.number()),
  validAfter: z.optional(uintNumberNumberish()),
  validBefore: z.optional(uintNumberNumberish()),
  value: z.optional(uintBigintNumberish()),
  yParity: z.optional(z.number()),
})

/** Codec decoding an RPC tempo transaction request into a transaction request. */
export const TransactionRequest = z.codec(Rpc, Domain, {
  decode: (value) => fromRpc(value as never) as never,
  encode: (value) => toRpc(value as never) as never,
})

/** Encode-only tempo transaction request codec accepting numberish `toRpc` inputs. */
export const TransactionRequestToRpc = z.codec(Rpc, DomainToRpc, {
  decode: (value) => fromRpc(value as never) as never,
  encode: (value) => toRpc(value as never) as never,
})

/** Decodes an RPC tempo transaction request into a transaction request. */
function fromRpc(
  request: core_TransactionRequest.Rpc,
): core_TransactionRequest.TransactionRequest {
  const { authorizationList: _, ...rest } = request
  const request_ = z.decode(
    z_TransactionRequest.TransactionRequest,
    rest as never,
  ) as core_TransactionRequest.TransactionRequest

  if (typeof request.type !== 'undefined')
    request_.type =
      fromRpcType[request.type as keyof typeof fromRpcType] || request_.type

  if (request.authorizationList)
    request_.authorizationList = z.decode(
      z_AuthorizationTempo.ListSigned,
      request.authorizationList as never,
    ) as never
  if (request.signature)
    request_.signature = z.decode(
      z_SignatureEnvelope.SignatureEnvelope,
      request.signature as never,
    ) as never
  if (request.feePayerSignature)
    request_.feePayerSignature = signatureFromRpc(request.feePayerSignature)
  if (request.calls)
    request_.calls = request.calls.map((call) => ({
      to: call.to,
      data: call.data,
      ...(call.value && call.value !== '0x'
        ? { value: core_Hex.toBigInt(call.value) }
        : {}),
    }))
  if (typeof request.feeToken !== 'undefined')
    request_.feeToken = request.feeToken
  if (request.keyAuthorization)
    request_.keyAuthorization = z.decode(
      z_KeyAuthorization.KeyAuthorization,
      request.keyAuthorization as never,
    ) as never
  if (typeof request.validBefore !== 'undefined')
    request_.validBefore = core_Hex.toNumber(request.validBefore)
  if (typeof request.validAfter !== 'undefined')
    request_.validAfter = core_Hex.toNumber(request.validAfter)
  if (typeof request.nonceKey !== 'undefined')
    request_.nonceKey = core_Hex.toBigInt(request.nonceKey)

  return request_
}

/** Encodes a transaction request into an RPC tempo transaction request. */
function toRpc(
  request: core_TransactionRequest.TransactionRequest,
): core_TransactionRequest.Rpc {
  const request_rpc = z.encode(z_TransactionRequest.TransactionRequestToRpc, {
    ...request,
    authorizationList: undefined,
  } as never) as core_TransactionRequest.Rpc

  if (request.authorizationList)
    request_rpc.authorizationList = z.encode(
      z_AuthorizationTempo.ListSignedToRpc,
      request.authorizationList as never,
    ) as never
  if (request.signature)
    request_rpc.signature = z.encode(
      z_SignatureEnvelope.SignatureEnvelope,
      request.signature as never,
    ) as never
  if (request.feePayerSignature)
    request_rpc.feePayerSignature = signatureToRpc(request.feePayerSignature)
  if (request.calls)
    request_rpc.calls = request.calls.map((call) => ({
      to: call.to,
      value: call.value ? encodeNumberish(call.value) : '0x',
      data: call.data ?? '0x',
    }))
  else if (request.to || request.data || request.value)
    request_rpc.calls = [
      {
        to: request.to ?? undefined,
        value: request.value ? encodeNumberish(request.value) : '0x',
        data: request.data ?? '0x',
      },
    ]
  if (typeof request.feeToken !== 'undefined')
    request_rpc.feeToken =
      typeof request.feeToken === 'bigint'
        ? z.encode(z_TokenId.address, request.feeToken)
        : request.feeToken
  if (request.keyAuthorization)
    request_rpc.keyAuthorization = z.encode(
      z_KeyAuthorization.KeyAuthorizationToRpc,
      request.keyAuthorization as never,
    ) as never
  if (typeof request.validBefore !== 'undefined')
    request_rpc.validBefore = encodeNumberish(request.validBefore)
  if (typeof request.validAfter !== 'undefined')
    request_rpc.validAfter = encodeNumberish(request.validAfter)

  const nonceKey = (() => {
    if (request.nonceKey === 'random') return core_Hex.random(24)
    if (typeof request.nonceKey !== 'undefined')
      return encodeNumberish(request.nonceKey)
    return undefined
  })()
  if (nonceKey) request_rpc.nonceKey = nonceKey

  if (
    typeof request.calls !== 'undefined' ||
    typeof request.feePayer !== 'undefined' ||
    typeof request.feeToken !== 'undefined' ||
    typeof request.keyAuthorization !== 'undefined' ||
    typeof request.nonceKey !== 'undefined' ||
    typeof request.validBefore !== 'undefined' ||
    typeof request.validAfter !== 'undefined' ||
    request.type === 'tempo'
  ) {
    request_rpc.type = toRpcType.tempo
    delete request_rpc.data
    delete request_rpc.input
    delete request_rpc.to
    delete request_rpc.value
  }

  return request_rpc
}

/** Decodes an RPC signature into a recovered signature. */
function signatureFromRpc(signature: {
  r: core_Hex.Hex
  s: core_Hex.Hex
  v?: core_Hex.Hex | undefined
  yParity: core_Hex.Hex
}) {
  const v = signature.v ? Number(signature.v) : undefined
  let yParity = signature.yParity ? Number(signature.yParity) : undefined
  if (typeof v === 'number' && typeof yParity !== 'number') {
    if (v === 0 || v === 27) yParity = 0
    else if (v === 1 || v === 28) yParity = 1
    else if (v >= 35) yParity = v % 2 === 0 ? 1 : 0
  }
  return {
    r: core_Hex.padLeft(signature.r, 32),
    s: core_Hex.padLeft(signature.s, 32),
    yParity: yParity as number,
  }
}

/** Encodes a recovered signature into an RPC signature. */
function signatureToRpc(signature: {
  r: core_Hex.Hex
  s: core_Hex.Hex
  yParity: number
}) {
  return {
    r: signature.r,
    s: signature.s,
    yParity: signature.yParity === 0 ? '0x0' : '0x1',
  } as const
}
