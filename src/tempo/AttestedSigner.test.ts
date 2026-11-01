import { AbiFunction, AbiItem, Hash, Hex, P256 } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as AttestedSigner from './AttestedSigner.js'

// Fixtures of the node's attested signers proof of concept (tempoxyz/tempo
// `exp/attested-signers`): `crates/primitives/src/transaction/attested.rs`
// `tests::signed` (program key `[0x11; 32]`, policy `0xAA…`, user tag `0xBB…`,
// slot 1) and `crates/precompiles/src/attested_key_registry/mod.rs` `tests`
// (`OWNER = 0x01…`, salt `0x55…`, `program_key(7)` in slot 3, `NOW`).
const policyId = `0x${'aa'.repeat(32)}` as const
const userTag = `0x${'bb'.repeat(32)}` as const
const programKey = P256.getPublicKey({ privateKey: `0x${'11'.repeat(32)}` })

describe('getAddress', () => {
  test('default', () => {
    expect(
      AttestedSigner.getAddress({ policyId, userTag }),
    ).toMatchInlineSnapshot(`"0x8169075568131b8937b140558340450f92bfa9a3"`)
  })

  // attested.rs `tests::address_and_digest_layout`: `keccak256(0x06 ‖ policy_id ‖ user_tag)[12:]`.
  test('behavior: matches the node layout', () => {
    expect(AttestedSigner.getAddress({ policyId, userTag })).toBe(
      Hex.slice(Hash.keccak256(Hex.concat('0x06', policyId, userTag)), 12),
    )
  })

  test('behavior: depends on the policy and the user tag only', () => {
    const other = AttestedSigner.getAddress({
      policyId,
      userTag: `0x${'bc'.repeat(32)}`,
    })
    expect(other).not.toBe(AttestedSigner.getAddress({ policyId, userTag }))
  })
})

describe('getBinding', () => {
  // attested_key_registry/mod.rs `binding` (tempoxyz/tempo c507923): `keccak256("tempo:attested-key" ‖
  // chainid (32 bytes) ‖ registry (20) ‖ policy_id (32) ‖ slot (1) ‖ x (32) ‖ y (32) ‖ lifetime (8))`,
  // with the registry tests' `LIFETIME = 3_600`.
  const key = P256.getPublicKey({ privateKey: `0x${'07'.repeat(32)}` })

  test('default', () => {
    expect(
      AttestedSigner.getBinding({
        chainId: 1337,
        lifetime: 3_600,
        policyId,
        programKey: key,
        slot: 3,
      }),
    ).toMatchInlineSnapshot(
      `"0x147af54491e06d6c30794f989a434a888c55d067b347cc11e0d6ea7ce261fa92"`,
    )
  })

  test('behavior: matches the node layout', () => {
    expect(
      AttestedSigner.getBinding({
        chainId: 1337,
        lifetime: 3_600,
        policyId,
        programKey: key,
        slot: 3,
      }),
    ).toBe(
      Hash.keccak256(
        Hex.concat(
          Hex.fromString('tempo:attested-key'),
          Hex.fromNumber(1337, { size: 32 }),
          '0x1161000000000000000000000000000000000000',
          policyId,
          '0x03',
          key.x,
          key.y,
          Hex.fromNumber(3_600, { size: 8 }),
        ),
      ),
    )
  })

  test('behavior: binds the chain, registry, policy, slot, key, and lifetime', () => {
    const base = {
      chainId: 1337,
      lifetime: 3_600,
      policyId,
      programKey: key,
      slot: 3,
    } as const
    const bindings = new Set([
      AttestedSigner.getBinding(base),
      AttestedSigner.getBinding({ ...base, chainId: 4217 }),
      AttestedSigner.getBinding({
        ...base,
        registry: '0xA77E570000000000000000000000000000000000',
      }),
      AttestedSigner.getBinding({ ...base, policyId: userTag }),
      AttestedSigner.getBinding({ ...base, slot: 4 }),
      AttestedSigner.getBinding({ ...base, programKey }),
      AttestedSigner.getBinding({ ...base, lifetime: 0 }),
    ])
    expect(bindings.size).toBe(7)
  })
})

describe('getKeyId', () => {
  // attested_key_registry/mod.rs `key_id`: `keccak256(policy_id ‖ x ‖ y)`.
  test('default', () => {
    expect(
      AttestedSigner.getKeyId({ policyId, programKey }),
    ).toMatchInlineSnapshot(
      `"0xcdec6718fb764f2c509f06b6d63e056ad81089f34cbdfe229d66bd1e10554828"`,
    )
    expect(AttestedSigner.getKeyId({ policyId, programKey })).toBe(
      Hash.keccak256(Hex.concat(policyId, programKey.x, programKey.y)),
    )
  })
})

describe('getPolicyId', () => {
  // attested_key_registry/mod.rs `tests::registers_dev_key_and_reports_it_current`:
  // `keccak256((OWNER, B256::repeat_byte(0x55)).abi_encode())`.
  test('default', () => {
    const policyId = AttestedSigner.getPolicyId({
      creator: '0x0101010101010101010101010101010101010101',
      salt: `0x${'55'.repeat(32)}`,
    })
    expect(policyId).toMatchInlineSnapshot(
      `"0xf2d4c5d094e0f0c2020e30cc2f55ff45f95255e81e4a9a0ac93525ae1fb60d82"`,
    )
    expect(policyId).toBe(
      Hash.keccak256(
        Hex.concat(
          Hex.padLeft('0x0101010101010101010101010101010101010101', 32),
          `0x${'55'.repeat(32)}`,
        ),
      ),
    )
  })
})

describe('getSignPayload', () => {
  const fields = {
    policyId,
    programKey,
    slot: 1,
    userTag,
    validUntil: 1_800_000_600,
  } as const

  test('default', () => {
    expect(
      AttestedSigner.getSignPayload({
        ...fields,
        payload: `0x${'42'.repeat(32)}`,
      }),
    ).toMatchInlineSnapshot(
      `"0xc71bf0eee9a3b30baa834a09a7bbfd09d945b3ad318ce4d3a2f8deae853c90dd"`,
    )
  })

  // attested.rs `tests::address_and_digest_layout`: the fields list is
  // `0xf88a ‖ 0xa0 policy_id ‖ 0xa0 user_tag ‖ 0x01 ‖ 0xb840 program_key ‖ 0x84 valid_until`.
  test('behavior: matches the node layout', () => {
    const payload = `0x${'42'.repeat(32)}` as const
    const rlp = Hex.concat(
      '0xf88a',
      '0xa0',
      policyId,
      '0xa0',
      userTag,
      '0x01',
      '0xb840',
      programKey.x,
      programKey.y,
      '0x84',
      Hex.fromNumber(1_800_000_600, { size: 4 }),
    )
    expect(AttestedSigner.getSignPayload({ ...fields, payload })).toBe(
      Hash.keccak256(
        Hex.concat(
          Hex.fromString('tempo:attested-signature'),
          payload,
          Hash.keccak256(rlp),
        ),
      ),
    )
  })

  test('behavior: slot 0 and validUntil 0 encode as empty strings', () => {
    const payload = `0x${'42'.repeat(32)}` as const
    const rlp = Hex.concat(
      '0xf886',
      '0xa0',
      policyId,
      '0xa0',
      userTag,
      '0x80',
      '0xb840',
      programKey.x,
      programKey.y,
      '0x80',
    )
    expect(
      AttestedSigner.getSignPayload({
        ...fields,
        payload,
        slot: 0,
        validUntil: 0,
      }),
    ).toBe(
      Hash.keccak256(
        Hex.concat(
          Hex.fromString('tempo:attested-signature'),
          payload,
          Hash.keccak256(rlp),
        ),
      ),
    )
  })

  test('behavior: covers every field', () => {
    const payload = `0x${'42'.repeat(32)}` as const
    const payloads = new Set([
      AttestedSigner.getSignPayload({ ...fields, payload }),
      AttestedSigner.getSignPayload({
        ...fields,
        payload: `0x${'43'.repeat(32)}`,
      }),
      AttestedSigner.getSignPayload({ ...fields, payload, policyId: userTag }),
      AttestedSigner.getSignPayload({ ...fields, payload, userTag: policyId }),
      AttestedSigner.getSignPayload({ ...fields, payload, slot: 2 }),
      AttestedSigner.getSignPayload({
        ...fields,
        payload,
        programKey: P256.getPublicKey({ privateKey: `0x${'12'.repeat(32)}` }),
      }),
      AttestedSigner.getSignPayload({ ...fields, payload, validUntil: 1 }),
    ])
    expect(payloads.size).toBe(7)
  })
})

describe('abi', () => {
  test('selectors', () => {
    expect(
      AttestedSigner.abi
        .filter((item) => item.type === 'function')
        .map(
          (item) =>
            `${AbiItem.getSignature(item)} ${AbiFunction.getSelector(item as AbiFunction.AbiFunction)}`,
        ),
    ).toMatchInlineSnapshot(`
      [
        "createPolicy(bytes32,uint8,address,address,uint64,uint64,bytes32[],bytes32[]) 0x132f2ec3",
        "computePolicyId(address,bytes32) 0xd9954df4",
        "proposeMeasurement(bytes32,bytes32) 0x013baaa5",
        "proposeAnchor(bytes32,bytes32) 0x62195124",
        "cancelProposal(bytes32,bytes32,bool) 0xf60d8581",
        "removeMeasurement(bytes32,bytes32) 0x7056429a",
        "removeAnchor(bytes32,bytes32) 0x9b50b21f",
        "revokeKeys(bytes32) 0x030b10fd",
        "pause(bytes32) 0xed56531a",
        "unpause(bytes32) 0x2f4dae9f",
        "setDelay(bytes32,uint64) 0xcc026f37",
        "setMaxKeyLifetime(bytes32,uint64) 0xb0c48e3e",
        "setGuardian(bytes32,address) 0xd3674b18",
        "transferOwnership(bytes32,address) 0xef5d6bbb",
        "registerKey(bytes32,uint8,bytes,bytes32,bytes32,uint64) 0xd2932210",
        "policy(bytes32) 0x115f746c",
        "measurementActiveAt(bytes32,bytes32) 0xe9324bd1",
        "anchorActiveAt(bytes32,bytes32) 0xbb8fcdb1",
        "keyValidUntil(bytes32,bytes32,bytes32) 0x89c45cf8",
      ]
    `)
  })
})

describe('constants', () => {
  test('default', () => {
    expect({
      keySlots: AttestedSigner.keySlots,
      maxAttestationAge: AttestedSigner.maxAttestationAge,
      maxFutureSkew: AttestedSigner.maxFutureSkew,
      maxKeyLifetime: AttestedSigner.maxKeyLifetime,
      maxSignatureSize: AttestedSigner.maxSignatureSize,
      maxValidityWindow: AttestedSigner.maxValidityWindow,
      registryAddress: AttestedSigner.registryAddress,
      schemes: AttestedSigner.schemes,
      signatureType: AttestedSigner.signatureType,
    }).toMatchInlineSnapshot(`
      {
        "keySlots": 8,
        "maxAttestationAge": 300,
        "maxFutureSkew": 60,
        "maxKeyLifetime": 604800,
        "maxSignatureSize": 211,
        "maxValidityWindow": 600,
        "registryAddress": "0x1161000000000000000000000000000000000000",
        "schemes": {
          "awsNitro": 1,
          "awsNitroDev": 254,
          "gcpConfidentialSpace": 2,
        },
        "signatureType": "0x06",
      }
    `)
  })
})
