import { HDKey as ScureHdKey, __TESTS } from '@scure/bip32'
import { HdKey, Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as internal from '../internal/hdKey.js'

const seed = '0x000102030405060708090a0b0c0d0e0f'
const versions = {
  private: 0x0488_ade4,
  public: 0x0488_b21e,
}

/**
 * BIP-32 test vector 1.
 *
 * Source: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 */
const vector = [
  {
    path: 'm',
    privateExtendedKey:
      'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    publicExtendedKey:
      'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
  },
  {
    path: "m/0'",
    privateExtendedKey:
      'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
    publicExtendedKey:
      'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw',
  },
  {
    path: "m/0'/1",
    privateExtendedKey:
      'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs',
    publicExtendedKey:
      'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ',
  },
  {
    path: "m/0'/1/2'",
    privateExtendedKey:
      'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM',
    publicExtendedKey:
      'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
  },
  {
    path: "m/0'/1/2'/2",
    privateExtendedKey:
      'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334',
    publicExtendedKey:
      'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV',
  },
  {
    path: "m/0'/1/2'/2/1000000000",
    privateExtendedKey:
      'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76',
    publicExtendedKey:
      'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy',
  },
] as const

/**
 * BIP-32 test vectors 2-4.
 *
 * Source: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 */
const vectors = [
  {
    number: 2,
    seed: '0xfffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    nodes: [
      {
        path: 'm',
        privateExtendedKey:
          'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U',
        publicExtendedKey:
          'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB',
      },
      {
        path: 'm/0',
        privateExtendedKey:
          'xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt',
        publicExtendedKey:
          'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH',
      },
      {
        path: "m/0/2147483647'",
        privateExtendedKey:
          'xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9',
        publicExtendedKey:
          'xpub6ASAVgeehLbnwdqV6UKMHVzgqAG8Gr6riv3Fxxpj8ksbH9ebxaEyBLZ85ySDhKiLDBrQSARLq1uNRts8RuJiHjaDMBU4Zn9h8LZNnBC5y4a',
      },
      {
        path: "m/0/2147483647'/1",
        privateExtendedKey:
          'xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef',
        publicExtendedKey:
          'xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon',
      },
      {
        path: "m/0/2147483647'/1/2147483646'",
        privateExtendedKey:
          'xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc',
        publicExtendedKey:
          'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
      },
      {
        path: "m/0/2147483647'/1/2147483646'/2",
        privateExtendedKey:
          'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j',
        publicExtendedKey:
          'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt',
      },
    ],
  },
  {
    number: 3,
    seed: '0x4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
    nodes: [
      {
        path: 'm',
        privateExtendedKey:
          'xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6',
        publicExtendedKey:
          'xpub661MyMwAqRbcEZVB4dScxMAdx6d4nFc9nvyvH3v4gJL378CSRZiYmhRoP7mBy6gSPSCYk6SzXPTf3ND1cZAceL7SfJ1Z3GC8vBgp2epUt13',
      },
      {
        path: "m/0'",
        privateExtendedKey:
          'xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L',
        publicExtendedKey:
          'xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y',
      },
    ],
  },
  {
    number: 4,
    seed: '0x3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
    nodes: [
      {
        path: 'm',
        privateExtendedKey:
          'xprv9s21ZrQH143K48vGoLGRPxgo2JNkJ3J3fqkirQC2zVdk5Dgd5w14S7fRDyHH4dWNHUgkvsvNDCkvAwcSHNAQwhwgNMgZhLtQC63zxwhQmRv',
        publicExtendedKey:
          'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
      },
      {
        path: "m/0'",
        privateExtendedKey:
          'xprv9vB7xEWwNp9kh1wQRfCCQMnZUEG21LpbR9NPCNN1dwhiZkjjeGRnaALmPXCX7SgjFTiCTT6bXes17boXtjq3xLpcDjzEuGLQBM5ohqkao9G',
        publicExtendedKey:
          'xpub69AUMk3qDBi3uW1sXgjCmVjJ2G6WQoYSnNHyzkmdCHEhSZ4tBok37xfFEqHd2AddP56Tqp4o56AePAgCjYdvpW2PU2jbUPFKsav5ut6Ch1m',
      },
      {
        path: "m/0'/1'",
        privateExtendedKey:
          'xprv9xJocDuwtYCMNAo3Zw76WENQeAS6WGXQ55RCy7tDJ8oALr4FWkuVoHJeHVAcAqiZLE7Je3vZJHxspZdFHfnBEjHqU5hG1Jaj32dVoS6XLT1',
        publicExtendedKey:
          'xpub6BJA1jSqiukeaesWfxe6sNK9CCGaujFFSJLomWHprUL9DePQ4JDkM5d88n49sMGJxrhpjazuXYWdMf17C9T5XnxkopaeS7jGk1GyyVziaMt',
      },
    ],
  },
] as const

/**
 * BIP-32 test vector 5.
 *
 * Source: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 */
const invalidExtendedKeys = [
  [
    'public version with private key',
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6LBpB85b3D2yc8sfvZU521AAwdZafEz7mnzBBsz4wKY5fTtTQBm',
  ],
  [
    'private version with public key',
    'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFGTQQD3dC4H2D5GBj7vWvSQaaBv5cxi9gafk7NF3pnBju6dwKvH',
  ],
  [
    'public key prefix 04',
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6Txnt3siSujt9RCVYsx4qHZGc62TG4McvMGcAUjeuwZdduYEvFn',
  ],
  [
    'private key prefix 04',
    'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFGpWnsj83BHtEy5Zt8CcDr1UiRXuWCmTQLxEK9vbz5gPstX92JQ',
  ],
  [
    'public key prefix 01',
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6N8ZMMXctdiCjxTNq964yKkwrkBJJwpzZS4HS2fxvyYUA4q2Xe4',
  ],
  [
    'private key prefix 01',
    'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFAzHGBP2UuGCqWLTAPLcMtD9y5gkZ6Eq3Rjuahrv17fEQ3Qen6J',
  ],
  [
    'private zero depth with parent fingerprint',
    'xprv9s2SPatNQ9Vc6GTbVMFPFo7jsaZySyzk7L8n2uqKXJen3KUmvQNTuLh3fhZMBoG3G4ZW1N2kZuHEPY53qmbZzCHshoQnNf4GvELZfqTUrcv',
  ],
  [
    'public zero depth with parent fingerprint',
    'xpub661no6RGEX3uJkY4bNnPcw4URcQTrSibUZ4NqJEw5eBkv7ovTwgiT91XX27VbEXGENhYRCf7hyEbWrR3FewATdCEebj6znwMfQkhRYHRLpJ',
  ],
  [
    'private zero depth with index',
    'xprv9s21ZrQH4r4TsiLvyLXqM9P7k1K3EYhA1kkD6xuquB5i39AU8KF42acDyL3qsDbU9NmZn6MsGSUYZEsuoePmjzsB3eFKSUEh3Gu1N3cqVUN',
  ],
  [
    'public zero depth with index',
    'xpub661MyMwAuDcm6CRQ5N4qiHKrJ39Xe1R1NyfouMKTTWcguwVcfrZJaNvhpebzGerh7gucBvzEQWRugZDuDXjNDRmXzSZe4c7mnTK97pTvGS8',
  ],
  [
    'unknown private version',
    'DMwo58pR1QLEFihHiXPVykYB6fJmsTeHvyTp7hRThAtCX8CvYzgPcn8XnmdfHGMQzT7ayAmfo4z3gY5KfbrZWZ6St24UVf2Qgo6oujFktLHdHY4',
  ],
  [
    'unknown public version',
    'DMwo58pR1QLEFihHiXPVykYB6fJmsTeHvyTp7hRThAtCX8CvYzgPcn8XnmdfHPmHJiEDXkTiJTVV9rHEBUem2mwVbbNfvT2MTcAqj3nesx8uBf9',
  ],
  [
    'private key zero',
    'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF93Y5wvzdUayhgkkFoicQZcP3y52uPPxFnfoLZB21Teqt1VvEHx',
  ],
  [
    'private key curve order',
    'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFAzHGBP2UuGCqWLTAPLcMtD5SDKr24z3aiUvKr9bJpdrcLg1y3G',
  ],
  [
    'invalid public key',
    'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6Q5JXayek4PRsn35jii4veMimro1xefsM58PgBMrvdYre8QyULY',
  ],
  [
    'invalid checksum',
    'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHL',
  ],
] as const

describe('BIP-32 test vector 1', () => {
  test('matches every private and public extended key', () => {
    const root = HdKey.fromSeed(seed)
    for (const expected of vector) {
      const node = root.derive(expected.path)
      expect(node.privateExtendedKey).toBe(expected.privateExtendedKey)
      expect(node.publicExtendedKey).toBe(expected.publicExtendedKey)
    }
  })

  test('imports every private extended key', () => {
    for (const expected of vector) {
      const node = HdKey.fromExtendedKey(expected.privateExtendedKey)
      expect(node.privateExtendedKey).toBe(expected.privateExtendedKey)
      expect(node.publicExtendedKey).toBe(expected.publicExtendedKey)
    }
  })
})

for (const vector of vectors) {
  describe(`BIP-32 test vector ${vector.number}`, () => {
    test('matches every private and public extended key', () => {
      const root = HdKey.fromSeed(vector.seed)
      for (const expected of vector.nodes) {
        const node = root.derive(expected.path)
        expect(node.privateExtendedKey).toBe(expected.privateExtendedKey)
        expect(node.publicExtendedKey).toBe(expected.publicExtendedKey)
      }
    })

    test('imports every private extended key', () => {
      for (const expected of vector.nodes) {
        const node = HdKey.fromExtendedKey(expected.privateExtendedKey)
        expect(node.privateExtendedKey).toBe(expected.privateExtendedKey)
        expect(node.publicExtendedKey).toBe(expected.publicExtendedKey)
      }
    })
  })
}

describe('BIP-32 test vector 5', () => {
  test.each(invalidExtendedKeys)('rejects %s', (_name, extendedKey) => {
    expect(() => HdKey.fromExtendedKey(extendedKey)).toThrowError()
  })
})

describe('derive', () => {
  test('behavior: accepts the highest normal and hardened indices', () => {
    const root = HdKey.fromSeed(seed)

    expect({
      firstHardened: root.derive("m/0'").index,
      highestHardened: root.derive("m/2147483647'").index,
      highestNormal: root.derive('m/2147483647').index,
    }).toMatchInlineSnapshot(`
      {
        "firstHardened": 2147483648,
        "highestHardened": 4294967295,
        "highestNormal": 2147483647,
      }
    `)
  })

  test('error: rejects malformed and out-of-range paths', () => {
    const root = HdKey.fromSeed(seed)

    expect(() => root.derive('0/1')).toThrowErrorMatchingInlineSnapshot(
      `[Error: Path must start with "m" or "M"]`,
    )
    expect(() =>
      root.derive('m/2147483648'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Invalid index]`)
    expect(() => root.derive('m/-1')).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid child index: -1]`,
    )
  })

  test('behavior: the default retries the next index for an invalid child', () => {
    const key = ScureHdKey.fromMasterSeed(Hex.toBytes(seed))
    const invalidTweak = Hex.toBytes(
      `0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141${'00'.repeat(32)}`,
    )

    const child = internal.fromScure(
      __TESTS.deriveChildWithI(key, 0, invalidTweak),
    )

    expect(child.index).toMatchInlineSnapshot('1')
    expect(child.privateExtendedKey).toBe(
      HdKey.fromSeed(seed).derive('m/1').privateExtendedKey,
    )
  })
})

describe('node ownership', () => {
  test('behavior: the default returns fresh result buffers', () => {
    const first = internal.fromSeed(Hex.toBytes(seed), versions)
    const second = internal.fromSeed(Hex.toBytes(seed), versions)

    expect({
      identifier: first.identifier === second.identifier,
      identifierLength: first.identifier.length,
      privateKey: first.privateKey === second.privateKey,
      privateKeyLength: first.privateKey.length,
      publicKey: first.publicKey === second.publicKey,
      publicKeyLength: first.publicKey.length,
      versions: first.versions === second.versions,
    }).toMatchInlineSnapshot(`
      {
        "identifier": false,
        "identifierLength": 20,
        "privateKey": false,
        "privateKeyLength": 32,
        "publicKey": false,
        "publicKeyLength": 65,
        "versions": false,
      }
    `)
  })
})
