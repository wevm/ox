import { describe, expect, test } from 'vp/test'
import * as Prf from '../Prf.js'

describe('tag', () => {
  test('default', () => {
    expect(Prf.tag('account.1')).toMatchInlineSnapshot(`
      {
        "input": Uint8Array [
          97,
          99,
          99,
          111,
          117,
          110,
          116,
          46,
          49,
        ],
      }
    `)
  })

  test('behavior: UTF-8', () => {
    expect(Prf.tag('account.🔑')).toMatchInlineSnapshot(`
      {
        "input": Uint8Array [
          97,
          99,
          99,
          111,
          117,
          110,
          116,
          46,
          240,
          159,
          148,
          145,
        ],
      }
    `)
  })
})
