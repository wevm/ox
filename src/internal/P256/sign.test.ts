import { Bytes, P256 } from 'ox'
import { expect, test } from 'vitest'

const privateKey =
  '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'
const publicKey = P256.getPublicKey({ privateKey })

test('default', async () => {
  {
    const signature = P256.sign({
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
      {
        "r": 25696373395957984486324188498890325781005829812399813021478384321951480608605n,
        "s": 71471412582193316356881596002626442093973157771381586232812188859587069632849n,
        "yParity": 0,
      }
    `,
    )
    expect(
      P256.verify({
        publicKey,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
    expect(
      P256.verify({
        publicKey,
        payload: '0xbeef',
        signature,
      }),
    ).toBe(false)
  }

  {
    const signature = P256.sign({
      payload: Bytes.fromHex(
        '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
      ),
      privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
      {
        "r": 109093915289726021639001379260733771573757231672849462488223442695417941697300n,
        "s": 109093247477094054921870710630193648963091633971756441119531150894951521569389n,
        "yParity": 1,
      }
    `,
    )
    expect(
      P256.verify({
        publicKey,
        payload: '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
        signature,
      }),
    ).toBe(true)
    expect(
      P256.verify({
        publicKey,
        payload: '0xbeef',
        signature,
      }),
    ).toBe(false)
  }
})

test('options: hash', () => {
  const signature = P256.sign({
    hash: true,
    payload:
      '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
    privateKey,
  })
  expect(signature).toMatchInlineSnapshot(
    `
    {
      "r": 38589374264307162948518251922729143918445204519165784874036137623135009958234n,
      "s": 201259577542353941908945259470130875727678910646252042669727980758229302244n,
      "yParity": 0,
    }
  `,
  )
  expect(
    P256.verify({
      hash: true,
      publicKey,
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      signature,
    }),
  ).toBe(true)
  expect(
    P256.verify({
      hash: true,
      publicKey,
      payload: '0xbeef',
      signature,
    }),
  ).toBe(false)
})
