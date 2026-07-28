import { Bls, BlsPoint } from 'ox'
import { describe, expect, test } from 'vp/test'

/**
 * Selected Ethereum BLS12-381 test-suite v0.1.0 vectors, independently
 * generated with py_ecc and milagro.
 *
 * Source: https://github.com/ethereum/bls12-381-tests/releases/tag/v0.1.0
 */
const vector = {
  aggregate: {
    input: [
      '0x91347bccf740d859038fcdcaf233eeceb2a436bcaaee9b2aa3bfb70efe29dfb2677562ccbea1c8e061fb9971b0753c240622fab78489ce96768259fc01360346da5b9f579e5da0d941e4c6ba18a0e64906082375394f337fa1af2b7127b0d121',
      '0x9674e2228034527f4c083206032b020310face156d4a4685e2fcaec2f6f3665aa635d90347b6ce124eb879266b1e801d185de36a0a289b85e9039662634f2eea1e02e670bc7ab849d006a70b2f93b84597558a05b879c8d445f387a5d5b653df',
      '0xae82747ddeefe4fd64cf9cedb9b04ae3e8a43420cd255e3c7cd06a8d88b7c7f8638543719981c5d16fa3527c468c25f0026704a6951bde891360c7e8d12ddee0559004ccdbe6046b55bae1b257ee97f7cdb955773d7cf29adf3ccbb9975e4eb9',
    ],
    output:
      '0x9712c3edd73a209c742b8250759db12549b3eaf43b5ca61376d9f30e2747dbcf842d8b2ac0901d2a093713e20284a7670fcf6954e9ab93de991bb9b313e664785a075fc285806fa5224c82bde146561b446ccfc706a64b8579513cfc4ff1d930',
  },
  payload: '0xabababababababababababababababababababababababababababababababab',
  privateKey:
    '0x47b8192d77bf871b62e87859d653922725724a5c031afeabc60bcef5ff665138',
  publicKey:
    '0xb301803f8b5ac4a1133581fc676dfedc60d891dd5fa99028805e5ea5b08d3491af75d0707adab3b70c6a6a580217bf81',
  signature:
    '0x9674e2228034527f4c083206032b020310face156d4a4685e2fcaec2f6f3665aa635d90347b6ce124eb879266b1e801d185de36a0a289b85e9039662634f2eea1e02e670bc7ab849d006a70b2f93b84597558a05b879c8d445f387a5d5b653df',
  suite: 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_',
} as const

describe('Ethereum BLS12-381 vectors', () => {
  test('getPublicKey', () => {
    expect(Bls.getPublicKey({ as: 'Hex', privateKey: vector.privateKey })).toBe(
      vector.publicKey,
    )
  })

  test('sign', () => {
    expect(
      Bls.sign({
        as: 'Hex',
        payload: vector.payload,
        privateKey: vector.privateKey,
        suite: vector.suite,
      }),
    ).toBe(vector.signature)
  })

  test('verify', () => {
    expect(
      Bls.verify({
        payload: vector.payload,
        publicKey: vector.publicKey,
        signature: vector.signature,
        suite: vector.suite,
      }),
    ).toBe(true)
  })

  test('aggregate', () => {
    expect(
      BlsPoint.toHex(
        Bls.aggregate(vector.aggregate.input, { group: 'G2' }) as BlsPoint.G2,
      ),
    ).toBe(vector.aggregate.output)
  })
})
