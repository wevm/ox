import { readFileSync } from 'node:fs'
import { expect, test } from 'vp/test'
import * as Module from '../Paths.js'

test('exports', () => {
  expect(Object.keys(Module)).toMatchInlineSnapshot(`
    [
      "mainnet",
    ]
  `)
})

test('mainnet resolves to the packaged trusted setup', () => {
  const setup = JSON.parse(readFileSync(Module.mainnet, 'utf8'))
  expect({
    g1Lagrange: setup.g1_lagrange.length,
    g1Monomial: setup.g1_monomial.length,
    g2Monomial: setup.g2_monomial.length,
  }).toMatchInlineSnapshot(`
    {
      "g1Lagrange": 4096,
      "g1Monomial": 4096,
      "g2Monomial": 65,
    }
  `)
})
