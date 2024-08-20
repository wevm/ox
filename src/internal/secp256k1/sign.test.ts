import { Bytes, Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('default', async () => {
  {
    const signature = Secp256k1.sign({
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey: accounts[0].privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
      {
        "r": 74352382517807082440778846078252240710763999160569457624520311883943391062769n,
        "s": 43375188480015931414505591342117068151247353833881461609019650667261881302875n,
        "yParity": 0,
      }
    `,
    )
    expect(
      Secp256k1.verify({
        address: accounts[0].address,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
  }

  {
    const signature = Secp256k1.sign({
      payload: Bytes.from(
        '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
      ),
      privateKey: accounts[0].privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
      {
        "r": 89036260706339362183898531363310683680162157132496689422406521430939707497224n,
        "s": 22310885159939283473640002814069314990500333570711854513358211093549688653897n,
        "yParity": 1,
      }
    `,
    )
    expect(
      Secp256k1.verify({
        address: accounts[0].address,
        payload:
          '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
        signature,
      }),
    ).toBe(true)
  }
})
