import { expect, test } from 'vitest'
import * as Hex from '../../Hex.js'
import {
  packetToBytes,
  unwrapLabelhash,
  wrapLabelhash,
} from '../../internal/ens.js'

test.each([
  { packet: 'awkweb.eth', expected: '0x0661776b7765620365746800' },
  { packet: 'foo.awkweb.eth', expected: '0x03666f6f0661776b7765620365746800' },
  { packet: '.', expected: '0x00' },
  {
    packet: 'a'.repeat(256),
    expected:
      '0x425b316461613730333461646162363664396563396530336532633839323031623833613734393765383564633562393731616139646165326363626237613230385d00',
  },
  {
    packet:
      '[1daa7034adab66d9ec9e03e2c89201b83a7497e85dc5b971aa9dae2ccbb7a208]',
    expected:
      '0x425b316461613730333461646162363664396563396530336532633839323031623833613734393765383564633562393731616139646165326363626237613230385d00',
  },
])("packetToBytes('$packet') -> '$expected'", ({ packet, expected }) => {
  expect(Hex.fromBytes(packetToBytes(packet))).toBe(expected)
})

test.each([
  {
    label: '[9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658]',
    expected:
      '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658',
  },
  {
    label: '[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]',
    expected:
      '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0',
  },
  {
    label: '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0',
    expected: null,
  },
  {
    label: `[${'z'.repeat(64)}]`,
    expected: null,
  },
  {
    label: 'test',
    expected: null,
  },
  {
    label: 'a[dfsdfd',
    expected: null,
  },
  {
    label: '[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f]0',
    expected: null,
  },
])(`unwrapLabelhash('$label') -> $expected`, ({ label, expected }) => {
  expect(unwrapLabelhash(label)).toBe(expected)
})

test.each([
  {
    hash: '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658',
    expected:
      '[9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658]',
  },
  {
    hash: '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0',
    expected:
      '[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]',
  },
] as const)(`wrapLabelhash('$hash') -> $expected`, ({ hash, expected }) => {
  expect(wrapLabelhash(hash)).toBe(expected)
})
