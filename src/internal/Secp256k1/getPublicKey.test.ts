import { Address, Bytes, Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('default', () => {
  {
    const publicKey = Secp256k1.getPublicKey({
      privateKey: accounts[0].privateKey,
    })

    expect(publicKey).toMatchInlineSnapshot(
      `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
    )
    expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
      accounts[0].address,
    )
  }

  {
    const publicKey = Secp256k1.getPublicKey({
      privateKey: Bytes.fromHex(accounts[0].privateKey),
    })

    expect(publicKey).toMatchInlineSnapshot(
      `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
    )
    expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
      accounts[0].address,
    )
  }
})
