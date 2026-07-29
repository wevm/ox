import { describe, expect, test } from 'vp/test'
import * as Hex from '../../core/Hex.js'
import * as Setups from '../Setups.js'

describe('mainnet', () => {
  test('exports the canonical PeerDAS setup as packed points', () => {
    expect({
      g1Lagrange: {
        bytes: Setups.mainnet.g1_lagrange.length,
        first: Hex.fromBytes(Setups.mainnet.g1_lagrange.slice(0, 48)),
        last: Hex.fromBytes(Setups.mainnet.g1_lagrange.slice(-48)),
      },
      g1Monomial: {
        bytes: Setups.mainnet.g1_monomial.length,
        first: Hex.fromBytes(Setups.mainnet.g1_monomial.slice(0, 48)),
        last: Hex.fromBytes(Setups.mainnet.g1_monomial.slice(-48)),
      },
      g2Monomial: {
        bytes: Setups.mainnet.g2_monomial.length,
        first: Hex.fromBytes(Setups.mainnet.g2_monomial.slice(0, 96)),
        last: Hex.fromBytes(Setups.mainnet.g2_monomial.slice(-96)),
      },
    }).toMatchInlineSnapshot(`
      {
        "g1Lagrange": {
          "bytes": 196608,
          "first": "0xa0413c0dcafec6dbc9f47d66785cf1e8c981044f7d13cfe3e4fcbb71b5408dfde6312493cb3c1d30516cb3ca88c03654",
          "last": "0x825a6f586726c68d45f00ad0f5a4436523317939a47713f78fd4fe81cd74236fdac1b04ecd97c2d0267d6f4981d7beb1",
        },
        "g1Monomial": {
          "bytes": 196608,
          "first": "0x97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb",
          "last": "0xb0bfaf56a5aa59b48960aa7c1617e832e65c823523fb2a5cd44ba606800501cf873e8db1d0dda64065285743dc40786e",
        },
        "g2Monomial": {
          "bytes": 6240,
          "first": "0x93e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8",
          "last": "0x92dcc5a1c8c3e1b28b1524e3dd6dbecd63017c9201da9dbe077f1b82adc08c50169f56fc7b5a3b28ec6b89254de3e2fd12838a761053437883c3e01ba616670cea843754548ef84bcc397de2369adcca2ab54cd73c55dc68d87aec3fc2fe4f10",
        },
      }
    `)
  })
})
