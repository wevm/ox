import { Bytes, Hash, Hex, TypedData } from 'ox'
import { Passport } from 'ox/tempo'
import { describe, expect, test } from 'vitest'
import * as TestPassport from '../../test/tempo/passport.js'

// ICAO 9303's specimen passport, and an Oidc test salt. Expected hashes come from circomlibjs.
const dg1 =
  '0x615b5f1f58503c55544f4552494b53534f4e3c3c414e4e413c4d415249413c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c4c38393839303243333655544f3734303831323246313230343135395a45313834323236423c3c3c3c3c3130'
const salt =
  '0x01d2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60'
const modulus =
  `0xd4eb129dd63963c59943bf00b2e2dbea7c1e2c0535afcde631f48b2030cb6da1d49d2e1de9e997edefb0d3f77631a50933a2ca1f7016380732c4273d6b10cbb1d5bba7c359bdea958db6a9b74890293d586d8222095313b9a7d31f2b5d1d16356623131748a91ce20866fc7fb727fed4ceadeba909f8555fcaef88f4645267ecc8217d9661ab22f1e8acf5b14f48683334c29e740f4186f3e7fd7f1961edfd038e7427040e6bfae2daf8a3cb5fb1d733952f1c0ee2fce35517c9d1b13b9c1bdc949478422c56b576aaf228a0ec58ad24fcfdc248580efb05c6af7d1eb6d9d1f1ce82abb90091efacbe403ddfef625c07777c12d3539ebfa346d73c3e6ea3c5f9` as const
const moduli = [
  modulus,
  `0x${'c1'.repeat(256)}`,
  `0x${'ff'.repeat(256)}`,
] as const
const leaves = [
  '0x09ce1e3342d0c0637c7b0559f10d31afdf192c75dd6e9c8cf8e9bf1b20877aed',
  '0x0ff9572d7c7fcfac24800fb59fb4ab53c371cbf5fcedf5a7d0a5cad43f75a682',
  '0x1966212233e0fd0252e4b80b35c3947e81b17a6886194aee7cc7166427e68836',
] as const
const root =
  '0x2ca46260d3d31e18b88977c8acc159c0a821320225cbdebd07fcb0fee2f62ddc'
const path = [
  '0x0ff9572d7c7fcfac24800fb59fb4ab53c371cbf5fcedf5a7d0a5cad43f75a682',
  '0x0e9ffb551dad47a6e4df6610781799bbf75dadd443eb72ad32527b0f56f432df',
  '0x1069673dcdb12263df301a6ff584a7ec261a44cb9dc68df067a4774460b1f1e1',
  '0x18f43331537ee2af2e3d758d50f72106467c6eea50371dd528d57eb2b856d238',
  '0x07f9d837cb17b0d36320ffe93ba52345f1b728571a568265caac97559dbc952a',
  '0x2b94cf5e8746b3f5c9631f4c5df32907a699c58c94b2ad4d7b5cec1639183f55',
  '0x2dee93c5a666459646ea7d22cca9e1bcfed71e6951b953611d11dda32ea09d78',
  '0x078295e5a22b84e982cf601eb639597b8b0515a88cb5ac7fa8a4aabe3c87349d',
  '0x2fa5e5f18f6027a6501bec864564472a616b2e274a41211a444cbe3a99f3cc61',
  '0x0e884376d0d8fd21ecb780389e941f66e45e7acce3e228ab3e2156a614fcd747',
  '0x1b7201da72494f1e28717ad1a52eb469f95892f957713533de6175e5da190af2',
  '0x1f8d8822725e36385200c0b201249819a6e6e1e4650808b5bebc6bface7d7636',
  '0x2c5d82f66c914bafb9701589ba8cfcfb6162b0a12acf88a8d0879a0471b5f85a',
  '0x14c54148a0940bb820957f5adf3fa1134ef5c4aaa113f4646458f270e0bfbfd0',
  '0x190d33b12f986f961e10c0ee44d8b9af11be25588cad89d416118e4bf4ebe80c',
  '0x22f98aa9ce704152ac17354914ad73ed1167ae6596af510aa5b3649325e06c92',
]
const issuer =
  '0x08b74d4900b569c09fc09f312043ada1bb65d7c3a3157978252dfc8173b85317'
const addressSeed =
  '0x0f07dc94d6730dc97292d23ce51cf68682a8aeb87500e04fd41ab819b0e69db7'
const blinding =
  '0x00aa00bb00cc00dd00ee00ff0011223344556677889900aabbccddeeff001122'
// The binding typed data's sign payload below.
const payload =
  '0x8c839e205bba1cbd2ee251e8d679d9dd5710a3f78559e15ad178b281704cb42f'
const accessKeyAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'

describe('fromDg1', () => {
  test('default', () => {
    expect(Passport.fromDg1(dg1)).toMatchInlineSnapshot(`
      {
        "birthDate": "740812",
        "documentNumber": "L898902C3",
        "issuingState": "UTO",
      }
    `)
  })

  test('error: not a TD3 EF.DG1', () => {
    expect(() => Passport.fromDg1(dg1.slice(0, -2) as `0x${string}`)).toThrow(
      Passport.InvalidDataGroupError,
    )
  })

  test('error: not a passport', () => {
    // `V` (a visa) in place of the document code `P`.
    expect(() =>
      Passport.fromDg1(`0x615b5f1f5856${dg1.slice(14)}`),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidDataGroupError: The data group is invalid: not a passport.]`,
    )
  })
})

describe('hashIssuer', () => {
  test('default', () => {
    expect(Passport.hashIssuer('UTO')).toBe(issuer)
  })

  test('error: not 3 characters', () => {
    expect(() => Passport.hashIssuer('D')).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidFieldLengthError: \`issuingState\` is 1 bytes; expected 3.]`,
    )
  })
})

describe('getAddressSeed', () => {
  test('default', () => {
    expect(
      Passport.getAddressSeed({
        birthDate: '740812',
        documentNumber: 'L898902C3',
        salt,
      }),
    ).toBe(addressSeed)
  })

  test('error: document number not 9 characters', () => {
    expect(() =>
      Passport.getAddressSeed({
        birthDate: '740812',
        documentNumber: 'L898902C',
        salt,
      }),
    ).toThrow(Passport.InvalidFieldLengthError)
  })

  test('error: salt outside the field', () => {
    expect(() =>
      Passport.getAddressSeed({
        birthDate: '740812',
        documentNumber: 'L898902C3',
        salt: `0x${'ff'.repeat(32)}`,
      }),
    ).toThrow(Passport.InvalidFieldElementError)
  })
})

describe('hashLeaf', () => {
  test('default', () => {
    expect(moduli.map((m) => Passport.hashLeaf(m))).toEqual(leaves)
  })

  test('error: not 2048 bits', () => {
    expect(() => Passport.hashLeaf(`0x7f${'ff'.repeat(255)}`)).toThrow(
      Passport.UnsupportedKeyError,
    )
  })
})

describe('getRoot', () => {
  test('default', () => {
    expect(Passport.getRoot({ leaves })).toBe(root)
  })

  test('behavior: order and duplicates do not matter', () => {
    expect(
      Passport.getRoot({
        leaves: [leaves[2], leaves[0], leaves[1], leaves[0]],
      }),
    ).toBe(root)
  })

  test('behavior: empty tree', () => {
    expect(Passport.getRoot({ leaves: [] })).toBe(
      '0x2a7c7c9b6ce5880b9f6f228d72bf6a575a526f29c66ecceef8b753d38bba7323',
    )
  })
})

describe('getPath', () => {
  test('default', () => {
    expect(Passport.getPath({ leaf: leaves[0], leaves })).toEqual({
      index: 0,
      path,
      root,
    })
  })

  test('error: leaf not in tree', () => {
    expect(() => Passport.getPath({ leaf: issuer, leaves })).toThrow(
      Passport.LeafNotFoundError,
    )
  })
})

describe('getChallenge', () => {
  test('behavior: message form', () => {
    expect(Passport.getChallenge({ blinding, payload })).toBe(
      '0xeff34d9d052bc2c0',
    )
  })

  test('behavior: signature form', () => {
    expect(
      Passport.getChallenge({
        accessKeyAddress,
        blinding,
        validUntil: 1760000540,
      }),
    ).toBe('0xaf0589e2112764de')
  })

  test('error: payload not 32 bytes', () => {
    expect(() => Passport.getChallenge({ blinding, payload: '0x01' })).toThrow(
      Passport.InvalidFieldLengthError,
    )
  })
})

describe('getPublicInput', () => {
  test('behavior: message form', () => {
    expect(
      Passport.getPublicInput({
        addressSeed,
        issuedAt: 1760000000,
        issuer,
        keyHash: root,
        payload,
      }),
    ).toBe('0x04357c9958090626e0da2c1161df2e620596604798f778f9857f347618818cf2')
  })

  test('behavior: signature form', () => {
    expect(
      Passport.getPublicInput({
        accessKeyAddress,
        addressSeed,
        issuedAt: 1760000000,
        issuer,
        keyHash: root,
        validUntil: 1760000540,
      }),
    ).toBe('0x119cd19240ad5ec41b7b2f244159491d0f88cc10c86649863a720db7fdf92652')
  })
})

describe('getBindingTypedData', () => {
  test('default', () => {
    // Expected hash from ethers' TypedDataEncoder.
    expect(
      TypedData.getSignPayload(
        Passport.getBindingTypedData({
          account: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
          chainId: 4217,
        }),
      ),
    ).toBe('0x8c839e205bba1cbd2ee251e8d679d9dd5710a3f78559e15ad178b281704cb42f')
  })
})

describe('randomBlinding', () => {
  test('default', () => {
    const value = Passport.randomBlinding()
    expect(value).toMatch(/^0x00[0-9a-f]{62}$/)
  })
})

describe('fromDg15', () => {
  const { chip, dg15 } = TestPassport.issue()

  test('default', () => {
    expect(Passport.fromDg15(dg15)).toBe(
      Hex.fromNumber(chip.modulus, { size: 128 }),
    )
  })

  test('error: not the template', () => {
    // An extra byte.
    expect(() =>
      Passport.fromDg15(Bytes.concat(dg15, Bytes.from([0]))),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidDataGroupError: The data group is invalid: not an EF.DG15 with a 1024-bit RSA key and exponent 65537.]`,
    )
    // Exponent 3.
    const exponent3 = Bytes.concat(
      dg15.slice(0, 160),
      Bytes.fromHex('0x0203010003'),
    )
    expect(() => Passport.fromDg15(exponent3)).toThrow(
      Passport.InvalidDataGroupError,
    )
    // A 2048-bit chip key.
    const rsa2048 = TestPassport.der.tlv(
      0x6f,
      TestPassport.rsaKey(2048, 65537, 'dsc').spki,
    )
    expect(() => Passport.fromDg15(rsa2048)).toThrow(
      Passport.InvalidDataGroupError,
    )
  })

  test('error: modulus is not 1024 bits', () => {
    const bytes = dg15.slice()
    bytes[32] = 0x7f
    expect(() => Passport.fromDg15(bytes)).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedKeyError: The key is unsupported: Active Authentication modulus is not 1024 bits.]`,
    )
  })
})

// A certificate with a P-256 key.
const ecCertificate = TestPassport.der.sequence(
  TestPassport.der.sequence(
    TestPassport.der.explicit(0, TestPassport.der.integer(2)),
    TestPassport.der.integer(1),
    TestPassport.der.algorithm('1.2.840.10045.4.3.2'),
    TestPassport.der.name('UT', 'CSCA'),
    TestPassport.der.sequence(),
    TestPassport.der.name('UT', 'DS'),
    TestPassport.der.sequence(
      TestPassport.der.sequence(
        TestPassport.der.oid('1.2.840.10045.2.1'),
        TestPassport.der.oid('1.2.840.10045.3.1.7'),
      ),
      TestPassport.der.tlv(0x03, new Uint8Array(66)),
    ),
  ),
  TestPassport.der.algorithm('1.2.840.10045.4.3.2'),
  TestPassport.der.tlv(0x03, new Uint8Array(1)),
)

describe('fromCertificate', () => {
  test('default', () => {
    const { certificate, dscModulus } = TestPassport.issue()
    expect(Passport.fromCertificate(certificate)).toEqual({
      exponent: 65537n,
      modulus: Hex.fromBytes(dscModulus),
    })
  })

  test('error: not RSA', () => {
    expect(() =>
      Passport.fromCertificate(ecCertificate),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedKeyError: The key is unsupported: key algorithm \`1.2.840.10045.2.1\` is not RSA.]`,
    )
  })

  test('error: malformed', () => {
    const { certificate } = TestPassport.issue()
    expect(() =>
      Passport.fromCertificate(certificate.slice(0, -1)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidCertificateError: The certificate is invalid: truncated element.]`,
    )
  })
})

describe('fromSod', () => {
  test('default', () => {
    const passport = TestPassport.issue()
    const sod = Passport.fromSod(passport.sod)
    expect(sod.certificate).toBe(Hex.fromBytes(passport.certificate))
    expect(sod.eContent).toBe(Hex.fromBytes(passport.eContent))
    expect(sod.signedAttributes).toBe(Hex.fromBytes(passport.signedAttributes))
    expect(sod.publicKey).toEqual({
      exponent: 65537n,
      modulus: Hex.fromBytes(passport.dscModulus),
    })
    expect(sod.messageDigest).toBe(
      Hex.fromBytes(Hash.sha256(passport.eContent)),
    )
    expect(Hex.size(sod.signature)).toBe(256)
    expect(Object.keys(sod.dataGroupHashes)).toEqual(['1', '2', '15'])
    expect(sod.dataGroupHashes[1]).toBe(
      Hex.fromBytes(Hash.sha256(passport.dg1)),
    )
    expect(sod.dataGroupHashes[15]).toBe(
      Hex.fromBytes(Hash.sha256(passport.dg15)),
    )
    expect({
      dataGroupHashAlgorithm: sod.dataGroupHashAlgorithm,
      digestAlgorithm: sod.digestAlgorithm,
      signatureAlgorithm: sod.signatureAlgorithm,
    }).toMatchInlineSnapshot(`
      {
        "dataGroupHashAlgorithm": "2.16.840.1.101.3.4.2.1",
        "digestAlgorithm": "2.16.840.1.101.3.4.2.1",
        "signatureAlgorithm": "1.2.840.113549.1.1.11",
      }
    `)
  })

  test('behavior: signer identified by subject key identifier', () => {
    const passport = TestPassport.issue({ sid: 'subjectKeyIdentifier' })
    const sod = Passport.fromSod(passport.sod)
    expect(sod.certificate).toBe(Hex.fromBytes(passport.certificate))
  })

  test("behavior: skips other signers' certificates", () => {
    const passport = TestPassport.issue({
      extraCertificates: [ecCertificate],
    })
    expect(Passport.fromSod(passport.sod).certificate).toBe(
      Hex.fromBytes(passport.certificate),
    )
  })

  test('behavior: parses suites scheme 0x02 does not support', () => {
    const passport = TestPassport.issue({
      hashAlgorithm: TestPassport.oids.sha1,
    })
    expect(Passport.fromSod(passport.sod).dataGroupHashAlgorithm).toBe(
      '1.3.14.3.2.26',
    )
  })

  test('error: malformed', () => {
    const { sod } = TestPassport.issue()
    expect(() =>
      Passport.fromSod(sod.slice(4)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidSodError: The SOD is invalid: expected tag 0x77, got 0x30.]`,
    )
    expect(() =>
      Passport.fromSod(Bytes.concat(sod, Bytes.from([0]))),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidSodError: The SOD is invalid: trailing bytes.]`,
    )
    expect(() =>
      Passport.fromSod(sod.slice(0, -1)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidSodError: The SOD is invalid: truncated element.]`,
    )
  })

  test('error: duplicate data group', () => {
    const { sod } = TestPassport.issue({
      dataGroupHashes: (entries) => [...entries, entries[0]!],
    })
    expect(() => Passport.fromSod(sod)).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidSodError: The SOD is invalid: data group 1 is hashed twice.]`,
    )
  })
})

describe('assertSod', () => {
  test('default', () => {
    const { sod } = TestPassport.issue()
    expect(() => Passport.assertSod(Passport.fromSod(sod))).not.toThrow()
  })

  test('error: SHA-1', () => {
    const { sod } = TestPassport.issue({
      hashAlgorithm: TestPassport.oids.sha1,
    })
    expect(() =>
      Passport.assertSod(Passport.fromSod(sod)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedSodError: The SOD is unsupported: data group hashes are not SHA-256.]`,
    )
  })

  test('error: RSASSA-PSS', () => {
    const { sod } = TestPassport.issue({
      signatureAlgorithm: '1.2.840.113549.1.1.10',
    })
    expect(() =>
      Passport.assertSod(Passport.fromSod(sod)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedSodError: The SOD is unsupported: signature algorithm \`1.2.840.113549.1.1.10\` is not RSASSA-PKCS1-v1_5.]`,
    )
  })

  test('error: 2047-bit document signer', () => {
    const { sod } = TestPassport.issue({ dsc: TestPassport.rsaKey(2047) })
    expect(() =>
      Passport.assertSod(Passport.fromSod(sod)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedKeyError: The key is unsupported: modulus is not 2048 bits.]`,
    )
  })

  test('error: exponent 3', () => {
    const { sod } = TestPassport.issue({ dsc: TestPassport.rsaKey(2048, 3) })
    expect(() =>
      Passport.assertSod(Passport.fromSod(sod)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedKeyError: The key is unsupported: exponent is not 65537.]`,
    )
  })

  test('error: security object past MAX_ECONTENT_LEN', () => {
    const issue = (extra: number) =>
      TestPassport.issue({
        dataGroupHashes: (entries) => [
          ...entries,
          ...Array.from(
            { length: extra },
            (_, i) => [3 + i, new Uint8Array(32)] as [number, Uint8Array],
          ),
        ],
      }).sod
    expect(() => Passport.assertSod(Passport.fromSod(issue(11)))).not.toThrow()
    expect(() =>
      Passport.assertSod(Passport.fromSod(issue(12))),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedSodError: The SOD is unsupported: the LDS security object is 611 bytes; at most 576 are supported.]`,
    )
  })

  test('error: signed attributes past MAX_SIGNED_ATTRS_LEN', () => {
    // An extra attribute with a `size`-byte value.
    const issue = (size: number) =>
      Passport.fromSod(
        TestPassport.issue({
          signedAttributes: [
            TestPassport.der.sequence(
              TestPassport.der.oid('1.2.3.4'),
              TestPassport.der.set(
                TestPassport.der.octetString(new Uint8Array(size)),
              ),
            ),
          ],
        }).sod,
      )
    let room = 0
    while (Hex.size(issue(room + 1).signedAttributes) <= 192) room++
    expect(Hex.size(issue(room).signedAttributes)).toBe(192)
    expect(() => Passport.assertSod(issue(room))).not.toThrow()
    expect(() =>
      Passport.assertSod(issue(room + 1)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.UnsupportedSodError: The SOD is unsupported: the signed attributes are 193 bytes; at most 192 are supported.]`,
    )
  })
})

describe('verifyDocument', () => {
  test('default', () => {
    const passport = TestPassport.issue()
    const { modulus, mrz, sod } = Passport.verifyDocument(passport)
    expect(modulus).toBe(Hex.fromBytes(passport.dscModulus))
    expect(mrz).toEqual(Passport.fromDg1(passport.dg1))
    expect(sod).toEqual(Passport.fromSod(passport.sod))
    // Publishers list the modulus's leaf.
    expect(() => Passport.hashLeaf(modulus)).not.toThrow()
  })

  test('behavior: signer identified by subject key identifier', () => {
    const passport = TestPassport.issue({ sid: 'subjectKeyIdentifier' })
    expect(Passport.verifyDocument(passport).modulus).toBe(
      Hex.fromBytes(passport.dscModulus),
    )
  })

  test('error: DG1 does not match its hash', () => {
    const passport = TestPassport.issue()
    const dg1 = passport.dg1.slice()
    dg1[50] = 0x3c
    expect(() =>
      Passport.verifyDocument({ ...passport, dg1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.DataGroupHashMismatchError: The security object does not contain the SHA-256 hash of data group 1.]`,
    )
  })

  test('error: DG15 does not match its hash', () => {
    const passport = TestPassport.issue()
    const dg15 = passport.dg15.slice()
    dg15[100]! ^= 1
    expect(() =>
      Passport.verifyDocument({ ...passport, dg15 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.DataGroupHashMismatchError: The security object does not contain the SHA-256 hash of data group 15.]`,
    )
  })

  test('error: DG15 does not match the template', () => {
    const passport = TestPassport.issue()
    expect(() =>
      Passport.verifyDocument({ ...passport, dg15: passport.dg15.slice(1) }),
    ).toThrow(Passport.InvalidDataGroupError)
  })

  test('error: DataGroupHash for another data group', () => {
    // DG1's hash listed as data group 2.
    const passport = TestPassport.issue({
      dataGroupHashes: ([dg1, , dg15]) => [[2, dg1![1]], dg15!],
    })
    expect(() =>
      Passport.verifyDocument(passport),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.DataGroupHashMismatchError: The security object does not contain the SHA-256 hash of data group 1.]`,
    )
  })

  test('error: messageDigest for another security object', () => {
    const passport = TestPassport.issue({
      messageDigest: (digest) => {
        const copy = digest.slice()
        copy[0]! ^= 1
        return copy
      },
    })
    expect(() =>
      Passport.verifyDocument(passport),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.MessageDigestMismatchError: The signed attributes do not contain the SHA-256 digest of the security object.]`,
    )
  })

  test('error: signature by another key', () => {
    const other = TestPassport.issue({
      dsc: TestPassport.rsaKey(2048, 65537, 'other'),
    })
    const passport = TestPassport.issue({
      signature: () => Bytes.fromHex(Passport.fromSod(other.sod).signature),
    })
    expect(() =>
      Passport.verifyDocument(passport),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidDocumentSignatureError: The document signer's signature over the signed attributes is invalid.]`,
    )
  })

  test('error: signature not less than its modulus', () => {
    const passport = TestPassport.issue({
      signature: () => TestPassport.issue().dscModulus,
    })
    expect(() => Passport.verifyDocument(passport)).toThrow(
      Passport.InvalidDocumentSignatureError,
    )
  })

  test('error: unsupported suite', () => {
    const passport = TestPassport.issue({
      hashAlgorithm: TestPassport.oids.sha1,
    })
    expect(() => Passport.verifyDocument(passport)).toThrow(
      Passport.UnsupportedSodError,
    )
  })
})

describe('verifyActiveAuthentication', () => {
  const { chip, dg15 } = TestPassport.issue()
  const challenge = Bytes.fromHex(
    Passport.getChallenge({
      blinding,
      payload: TypedData.getSignPayload(
        Passport.getBindingTypedData({
          account: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
          chainId: 4217,
        }),
      ),
    }),
  )

  test('default', () => {
    const signature = chip.sign(challenge)
    expect(
      Passport.verifyActiveAuthentication({ challenge, dg15, signature }),
    ).toBe(true)
  })

  test('behavior: chips returning J or n - J', () => {
    for (let i = 0; i < 4; i++)
      for (const form of ['J', 'n - J'] as const)
        expect(
          Passport.verifyActiveAuthentication({
            challenge: Hex.fromBytes(challenge),
            dg15: Hex.fromBytes(dg15),
            signature: Hex.fromBytes(chip.sign(challenge, { form })),
          }),
        ).toBe(true)
  })

  test('behavior: H over another challenge', () => {
    const signature = chip.sign(challenge)
    const other = challenge.slice()
    other[7]! ^= 1
    expect(
      Passport.verifyActiveAuthentication({
        challenge: other,
        dg15,
        signature,
      }),
    ).toBe(false)
  })

  test('behavior: challenge for another commitment', () => {
    const signature = chip.sign(challenge)
    const other = Passport.getChallenge({
      accessKeyAddress,
      blinding,
      validUntil: 1760000540,
    })
    expect(
      Passport.verifyActiveAuthentication({
        challenge: other,
        dg15,
        signature,
      }),
    ).toBe(false)
  })

  test('behavior: wrong header or trailer', () => {
    for (const options of [{ header: 0x6b }, { trailer: 0xcc }])
      expect(
        Passport.verifyActiveAuthentication({
          challenge,
          dg15,
          signature: chip.sign(challenge, options),
        }),
      ).toBe(false)
  })

  test('behavior: signature not less than its modulus', () => {
    const modulus = Bytes.fromNumber(chip.modulus, { size: 128 })
    expect(
      Passport.verifyActiveAuthentication({
        challenge,
        dg15,
        signature: modulus,
      }),
    ).toBe(false)
    expect(
      Passport.verifyActiveAuthentication({
        challenge,
        dg15,
        signature: new Uint8Array(128),
      }),
    ).toBe(false)
  })

  test('behavior: another chip', () => {
    const other = TestPassport.der.tlv(
      0x6f,
      TestPassport.rsaKey(1024, 65537, 'other chip').spki,
    )
    expect(
      Passport.verifyActiveAuthentication({
        challenge,
        dg15: other,
        signature: chip.sign(challenge),
      }),
    ).toBe(false)
  })

  test('error: challenge is not 8 bytes', () => {
    expect(() =>
      Passport.verifyActiveAuthentication({
        challenge: challenge.slice(1),
        dg15,
        signature: chip.sign(challenge),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Passport.InvalidFieldLengthError: \`challenge\` is 7 bytes; expected 8.]`,
    )
  })
})
