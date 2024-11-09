import { Ens } from 'ox'
import { describe, expect, test } from 'vitest'

describe('labelhash', () => {
  test.each([
    {
      label: '',
      expected:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      label: 'eth',
      expected:
        '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0',
    },
    {
      label: 'awkweb',
      expected:
        '0x7aaad03ddcacc63166440f59c14a1a2c97ee381014b59c58f55b49ab05f31a38',
    },
    {
      label: Ens.normalize('awkw𝝣b'),
      expected:
        '0x064cfb20fc5f10bd727bd17232b9b0c8021cec89e596b1c966ff1c611420c72f',
    },
    {
      label: '\u{0061}wkweb',
      expected:
        '0x7aaad03ddcacc63166440f59c14a1a2c97ee381014b59c58f55b49ab05f31a38',
    },
    {
      label: '\u{0061}wkw\u{0065}b',
      expected:
        '0x7aaad03ddcacc63166440f59c14a1a2c97ee381014b59c58f55b49ab05f31a38',
    },
    {
      label: 'awkweb',
      //     ^ latin small "a"
      expected:
        '0x7aaad03ddcacc63166440f59c14a1a2c97ee381014b59c58f55b49ab05f31a38',
    },
    {
      label: 'awkweb',
      //         ^ latin small "e"
      expected:
        '0x7aaad03ddcacc63166440f59c14a1a2c97ee381014b59c58f55b49ab05f31a38',
    },
    {
      label: 'ʘ‿ʘ',
      expected:
        '0xc142daa955184f4c4992e064a059bd8950e0bff10db566df9068ae2d5379e652',
    },
    {
      label:
        '[9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658]',
      expected:
        '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658',
    },
  ])("labelhash('$label') -> '$expected'", ({ label, expected }) => {
    expect(Ens.labelhash(label)).toBe(expected)
  })
})

describe('namehash', () => {
  test.each([
    {
      name: '',
      expected:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      name: 'eth',
      expected:
        '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae',
    },
    {
      name: 'alice.eth',
      expected:
        '0x787192fc5378cc32aa956ddfdedbf26b24e8d78e40109add0eea2c1a012c3dec',
    },
    {
      name: 'iam.alice.eth',
      expected:
        '0x5bec9e288ed3df984a80a1ac48538a7f19370794d676506adfbddefad210775b',
    },
    {
      name: 'awkweb.eth',
      expected:
        '0x52d0f5fbf348925621be297a61b88ec492ebbbdfa9477d82892e2786020ad61c',
    },
    {
      name: Ens.normalize('awkw𝝣b.eth'),
      expected:
        '0x4e372358e2e47fdbba39e5ca56d412e6dc4216a260a733b1b5d8df0001d28202',
    },
    {
      name: '\u{0061}wkweb.eth',
      expected:
        '0x52d0f5fbf348925621be297a61b88ec492ebbbdfa9477d82892e2786020ad61c',
    },
    {
      name: '\u{0061}wkw\u{0065}b.eth',
      expected:
        '0x52d0f5fbf348925621be297a61b88ec492ebbbdfa9477d82892e2786020ad61c',
    },
    {
      name: 'awkweb.eth',
      //     ^ latin small "a"
      expected:
        '0x52d0f5fbf348925621be297a61b88ec492ebbbdfa9477d82892e2786020ad61c',
    },
    {
      name: 'awkweb.eth',
      //         ^ latin small "e"
      expected:
        '0x52d0f5fbf348925621be297a61b88ec492ebbbdfa9477d82892e2786020ad61c',
    },
    {
      name: 'ʘ‿ʘ.eth',
      expected:
        '0x61e4a7cb09f4b512f41d02fedcc851cf8e43161e1f34e4264d7d911bb6c9c7af',
    },
    {
      name: '[9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658].eth',
      expected:
        '0xeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1',
    },
  ])("namehash('$name') -> '$expected'", ({ name, expected }) => {
    expect(Ens.namehash(name)).toBe(expected)
  })
})

describe('normalize', () => {
  test.each([
    { name: 'awkweb.eth', expected: 'awkweb.eth' },
    { name: 'Awkweb.eth', expected: 'awkweb.eth' },
    { name: '🖖.eth', expected: '🖖.eth' },
    { name: 'awkw𝝣b.eth', expected: 'awkwξb.eth' },
    { name: '\u{0061}wkweb.eth', expected: 'awkweb.eth' },
    { name: '\u{0061}wkw\u{0065}b.eth', expected: 'awkweb.eth' },
    { name: 'awkweb.eth', expected: 'awkweb.eth' },
    //       ^ latin small "a"
    { name: 'awkweb.eth', expected: 'awkweb.eth' },
    //           ^ latin small "e"
  ])("normalize('$name') -> '$expected'", ({ name, expected }) => {
    expect(Ens.normalize(name)).toBe(expected)
  })

  test('invalid label extension', () => {
    expect(() => Ens.normalize('34--A.eth')).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid label "34--A"‎: invalid label extension: "34--"]`,
    )
  })

  test('illegal placement: leading combining mark', () => {
    expect(() =>
      Ens.normalize('\u{303}.eth'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid label "◌̃"‎: illegal placement: leading combining mark]`,
    )
  })

  test('underscore allowed only at start', () => {
    expect(() => Ens.normalize('a_b_c.eth')).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid label "a_b_c"‎: underscore allowed only at start]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(Ens)).toMatchInlineSnapshot(`
    [
      "labelhash",
      "namehash",
      "normalize",
    ]
  `)
})
