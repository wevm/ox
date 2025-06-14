import { Bls, Hex } from 'ox'
import { describe, expect, it, test } from 'vitest'

const privateKey =
  '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'

describe('aggregate', () => {
  test('default', () => {
    const payload = Hex.random(32)
    const privateKeys = Array.from({ length: 100 }, () =>
      Bls.randomPrivateKey(),
    )

    const signatures = privateKeys.map((privateKey) =>
      Bls.sign({ payload, privateKey }),
    )
    const signature = Bls.aggregate(signatures)

    const publicKeys = privateKeys.map((privateKey) =>
      Bls.getPublicKey({ privateKey }),
    )
    const publicKey = Bls.aggregate(publicKeys)

    const valid = Bls.verify({
      payload,
      publicKey,
      signature,
    })
    expect(valid).toBe(true)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.random(32)
    const privateKeys = Array.from({ length: 100 }, () =>
      Bls.randomPrivateKey(),
    )

    const signatures = privateKeys.map((privateKey) =>
      Bls.sign({ payload, privateKey, size: 'long-key:short-sig' }),
    )
    const signature = Bls.aggregate(signatures)

    const publicKeys = privateKeys.map((privateKey) =>
      Bls.getPublicKey({ privateKey, size: 'long-key:short-sig' }),
    )
    const publicKey = Bls.aggregate(publicKeys)

    const valid = Bls.verify({
      payload,
      publicKey,
      signature,
    })
    expect(valid).toBe(true)
  })
})

describe('createKeyPair', () => {
  it('default', () => {
    const { privateKey, publicKey } = Bls.createKeyPair()
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('bigint')
    expect(typeof publicKey.y).toBe('bigint')
    expect(typeof publicKey.z).toBe('bigint')
  })

  it('as: bytes', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({ as: 'Bytes' })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(32)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('bigint')
    expect(typeof publicKey.y).toBe('bigint')
    expect(typeof publicKey.z).toBe('bigint')
  })

  it('size: "long-key:short-sig"', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({
      size: 'long-key:short-sig',
    })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('object')
    expect(typeof publicKey.y).toBe('object')
    expect(typeof publicKey.z).toBe('object')
  })

  it('should create functional key pair', () => {
    const { privateKey, publicKey } = Bls.createKeyPair()
    const payload = Hex.fromString('test message')
    
    const signature = Bls.sign({ payload, privateKey })
    const verified = Bls.verify({ payload, publicKey, signature })
    
    expect(verified).toBe(true)
  })

  it('should create functional key pair with long-key:short-sig', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({
      size: 'long-key:short-sig',
    })
    const payload = Hex.fromString('test message')
    
    const signature = Bls.sign({ payload, privateKey, size: 'long-key:short-sig' })
    const verified = Bls.verify({ payload, publicKey, signature })
    
    expect(verified).toBe(true)
  })
})

describe('getPublicKey', () => {
  it('default', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "x": 1952783380189056174522580903352347766701573809635723835268303492562286913265402164399416172997666069723894699105894n,
        "y": 3394089175947417419526317884165437122243448720528225119792553064107324599006426161993648623279289675312316462718429n,
        "z": 1n,
      }
    `)
  })

  it('size: "long-key:short-sig"', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "x": {
          "c0": 355700073819052008684778820175963255205495140126954969787089018774753222070622698188835174184164179369078130885244n,
          "c1": 3141747483469678201696152507180044107401052508149828985947848597238369234167677882679751100991611433759974704216489n,
        },
        "y": {
          "c0": 2066498625632373741693121319338450383866133445054897600869581552265032944423583015562782022208222353927807243866749n,
          "c1": 2094957017561088565638483770249057751981351081887405244515911122357724535677090041039038848651564427361620547334206n,
        },
        "z": {
          "c0": 1n,
          "c1": 0n,
        },
      }
    `)
  })
})

describe('randomPrivateKey', () => {
  it('default', () => {
    const privateKey = Bls.randomPrivateKey()
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
  })

  it('as: bytes', () => {
    const privateKey = Bls.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(32)
  })
})

describe('sign', () => {
  test('default', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({ payload, privateKey })

    expect(signature).toMatchInlineSnapshot(`
      {
        "x": {
          "c0": 3746086905447253682610543432049782958935576956103835696177151771320417199129097598091428899350812694802984340320507n,
          "c1": 3283146048622226517954881634398987000360291525283271875090618615961785504260074427269084149051224291832699744536875n,
        },
        "y": {
          "c0": 2635882389000876446384650976799081995605300411488416553944693011070686484045367229225761824211357395609735141830301n,
          "c1": 3150725065472868899001777665935568609665827996367588938443411055163385844006645735808933132167606601018627944394270n,
        },
        "z": {
          "c0": 1n,
          "c1": 0n,
        },
      }
    `)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })

    expect(signature).toMatchInlineSnapshot(`
      {
        "x": 3755087731136217504597239089482980992941034609034858157163586991013626465307525157337003693748653301444139684957942n,
        "y": 1939521305169884934876256226456095365402898060507274143668904400539743214063601510507290152344771164790023535191463n,
        "z": 1n,
      }
    `)
  })
})

describe('verify', () => {
  test('default', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({ payload, privateKey })
    const publicKey = Bls.getPublicKey({ privateKey })
    const verified = Bls.verify({ payload, publicKey, signature })
    expect(verified).toBe(true)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const verified = Bls.verify({ payload, publicKey, signature })
    expect(verified).toBe(true)
  })
})
