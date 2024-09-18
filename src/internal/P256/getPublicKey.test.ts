import { Bytes, P256 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const privateKey =
  '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'

test('default', () => {
  {
    const publicKey = P256.getPublicKey({
      privateKey,
    })

    expect(publicKey).toMatchInlineSnapshot(
      `
      {
        "prefix": 4,
        "x": 10551483369778534213743005046722587423472548496575383028418761641566343103239n,
        "y": 88295525029668593780823649128376935553570204792365777341876890493798599407244n,
      }
    `,
    )
  }

  {
    const publicKey = P256.getPublicKey({
      privateKey: Bytes.fromHex(accounts[0].privateKey),
    })

    expect(publicKey).toMatchInlineSnapshot(
      `
      {
        "prefix": 4,
        "x": 74284260781974828542656778781460620511024287575108245086657461940925169173577n,
        "y": 49004966777120461993240735637857463864712305111925716454339081891868780934195n,
      }
    `,
    )
  }
})
