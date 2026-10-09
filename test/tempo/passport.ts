// A test PKI for TIP-1142 passports: a CSCA, a document signer certificate (DSC), and a chip
// with an RSA Active Authentication key, issuing ICAO 9303's specimen passport. DER is built by
// hand so tests can produce documents outside the supported suite.

import * as crypto from 'node:crypto'
import { Bytes, Hash } from 'ox'

/** ICAO 9303's specimen TD3 machine readable zone. */
export const mrz =
  'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<L898902C36UTO7408122F1204159ZE184226B<<<<<10'

const oids = {
  commonName: '2.5.4.3',
  contentType: '1.2.840.113549.1.9.3',
  country: '2.5.4.6',
  ldsSecurityObject: '2.23.136.1.1.1',
  messageDigest: '1.2.840.113549.1.9.4',
  sha1: '1.3.14.3.2.26',
  sha256: '2.16.840.1.101.3.4.2.1',
  sha256WithRsaEncryption: '1.2.840.113549.1.1.11',
  signedData: '1.2.840.113549.1.7.2',
  subjectKeyIdentifier: '2.5.29.14',
}

export { oids }

export const der = {
  tlv(tag: number, ...contents: Uint8Array[]): Uint8Array {
    const content = Bytes.concat(...contents)
    const length = content.length
    const header =
      length < 0x80
        ? [length]
        : length < 0x100
          ? [0x81, length]
          : [0x82, length >> 8, length & 0xff]
    return Bytes.concat(Bytes.from([tag, ...header]), content)
  },
  sequence: (...contents: Uint8Array[]) => der.tlv(0x30, ...contents),
  set: (...contents: Uint8Array[]) => der.tlv(0x31, ...contents),
  integer(value: bigint | number | Uint8Array): Uint8Array {
    let hex = typeof value === 'object' ? '' : BigInt(value).toString(16)
    if (hex.length % 2) hex = `0${hex}`
    let bytes = value instanceof Uint8Array ? value : Bytes.fromHex(`0x${hex}`)
    while (bytes.length > 1 && bytes[0] === 0 && (bytes[1]! & 0x80) === 0)
      bytes = bytes.slice(1)
    if (bytes[0]! & 0x80) bytes = Bytes.concat(Bytes.from([0]), bytes)
    return der.tlv(0x02, bytes)
  },
  octetString: (value: Uint8Array) => der.tlv(0x04, value),
  oid(value: string): Uint8Array {
    const [a, b, ...rest] = value.split('.').map(BigInt)
    const bytes: number[] = []
    for (const arc of [a! * 40n + b!, ...rest]) {
      const chunk = [Number(arc & 0x7fn)]
      for (let v = arc >> 7n; v > 0n; v >>= 7n)
        chunk.unshift(Number(v & 0x7fn) | 0x80)
      bytes.push(...chunk)
    }
    return der.tlv(0x06, Bytes.from(bytes))
  },
  null: () => Bytes.from([0x05, 0x00]),
  algorithm: (oid: string) => der.sequence(der.oid(oid), der.null()),
  explicit: (n: number, ...contents: Uint8Array[]) =>
    der.tlv(0xa0 + n, ...contents),
  name: (country: string, commonName: string) =>
    der.sequence(
      der.set(
        der.sequence(
          der.oid(oids.country),
          der.tlv(0x13, Bytes.fromString(country)),
        ),
      ),
      der.set(
        der.sequence(
          der.oid(oids.commonName),
          der.tlv(0x0c, Bytes.fromString(commonName)),
        ),
      ),
    ),
}

type Key = {
  d: bigint
  n: bigint
  privateKey: crypto.KeyObject
  publicKey: crypto.KeyObject
  spki: Uint8Array
}

const keys = new Map<string, Key>()

/** Generates (once) an RSA key of the given size and exponent. */
export function rsaKey(bits: number, exponent = 65537, label = ''): Key {
  const id = `${bits}:${exponent}:${label}`
  const cached = keys.get(id)
  if (cached) return cached
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicExponent: exponent,
  })
  const jwk = privateKey.export({ format: 'jwk' })
  const toBigInt = (value: string) =>
    Bytes.toBigInt(new Uint8Array(Buffer.from(value, 'base64url')))
  const key = {
    d: toBigInt(jwk.d!),
    n: toBigInt(jwk.n!),
    privateKey,
    publicKey,
    spki: new Uint8Array(publicKey.export({ format: 'der', type: 'spki' })),
  }
  keys.set(id, key)
  return key
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  let b = base % modulus
  for (let e = exponent; e > 0n; e >>= 1n) {
    if (e & 1n) result = (result * b) % modulus
    b = (b * b) % modulus
  }
  return result
}

/** A DSC certificate issued by the test CSCA. */
export function certificate(
  options: {
    dsc?: Key | undefined
    serialNumber?: number | undefined
    subjectKeyIdentifier?: Uint8Array | undefined
  } = {},
): Uint8Array {
  const {
    dsc = rsaKey(2048, 65537, 'dsc'),
    serialNumber = 0x1142,
    subjectKeyIdentifier,
  } = options
  const csca = rsaKey(2048, 65537, 'csca')
  const time = (value: string) => der.tlv(0x17, Bytes.fromString(value))
  const tbs = der.sequence(
    der.explicit(0, der.integer(2)),
    der.integer(serialNumber),
    der.algorithm(oids.sha256WithRsaEncryption),
    der.name('UT', 'Utopia CSCA'),
    der.sequence(time('120415000000Z'), time('320415000000Z')),
    der.name('UT', 'Utopia Document Signer'),
    dsc.spki,
    ...(subjectKeyIdentifier
      ? [
          der.tlv(
            0xa3,
            der.sequence(
              der.sequence(
                der.oid(oids.subjectKeyIdentifier),
                der.octetString(der.octetString(subjectKeyIdentifier)),
              ),
            ),
          ),
        ]
      : []),
  )
  const signature = crypto.sign('sha256', tbs, csca.privateKey)
  return der.sequence(
    tbs,
    der.algorithm(oids.sha256WithRsaEncryption),
    der.tlv(0x03, Bytes.from([0]), new Uint8Array(signature)),
  )
}

export type Options = {
  /** Replaces the DataGroupHash entries, given the honest ones. */
  dataGroupHashes?:
    | ((entries: [number, Uint8Array][]) => [number, Uint8Array][])
    | undefined
  /** The document signer's key. */
  dsc?: Key | undefined
  /** Certificates of other signers to include. */
  extraCertificates?: readonly Uint8Array[] | undefined
  /** OID of the data group hash and digest algorithm. */
  hashAlgorithm?: string | undefined
  /** Replaces the messageDigest value, given the honest one. */
  messageDigest?: ((digest: Uint8Array) => Uint8Array) | undefined
  /** Identify the signer by subject key identifier rather than issuer and serial number. */
  sid?: 'issuerAndSerialNumber' | 'subjectKeyIdentifier' | undefined
  /** Replaces the signature, given the honest one. */
  signature?: ((signature: Uint8Array) => Uint8Array) | undefined
  /** OID of the signature algorithm. */
  signatureAlgorithm?: string | undefined
  /** Extra signed attributes. */
  signedAttributes?: readonly Uint8Array[] | undefined
}

/** Issues the specimen passport: its EF.DG1, EF.DG15, and EF.SOD, and its chip. */
export function issue(options: Options = {}) {
  const {
    dsc = rsaKey(2048, 65537, 'dsc'),
    hashAlgorithm = oids.sha256,
    sid = 'issuerAndSerialNumber',
    signatureAlgorithm = oids.sha256WithRsaEncryption,
  } = options
  const chip = rsaKey(1024, 65537, 'chip')

  const dg1 = Bytes.concat(Bytes.fromHex('0x615b5f1f58'), Bytes.fromString(mrz))
  const dg2 = der.tlv(0x75, Bytes.fromString('a face'))
  const dg15 = der.tlv(0x6f, chip.spki)

  const hash = (value: Uint8Array) =>
    hashAlgorithm === oids.sha1
      ? new Uint8Array(crypto.createHash('sha1').update(value).digest())
      : Hash.sha256(value)
  let entries: [number, Uint8Array][] = [
    [1, hash(dg1)],
    [2, hash(dg2)],
    [15, hash(dg15)],
  ]
  if (options.dataGroupHashes) entries = options.dataGroupHashes(entries)
  const eContent = der.sequence(
    der.integer(0),
    der.algorithm(hashAlgorithm),
    der.sequence(
      ...entries.map(([number, value]) =>
        der.sequence(der.integer(number), der.octetString(value)),
      ),
    ),
  )

  let digest = hash(eContent)
  if (options.messageDigest) digest = options.messageDigest(digest)
  const attributes = Bytes.concat(
    der.sequence(
      der.oid(oids.contentType),
      der.set(der.oid(oids.ldsSecurityObject)),
    ),
    der.sequence(der.oid(oids.messageDigest), der.set(der.octetString(digest))),
    ...(options.signedAttributes ?? []),
  )
  const signedAttributes = der.tlv(0x31, attributes)
  let signature = new Uint8Array(
    crypto.sign('sha256', signedAttributes, dsc.privateKey),
  )
  if (options.signature) signature = options.signature(signature)

  const subjectKeyIdentifier = Hash.sha256(dsc.spki).slice(0, 20)
  const dscCertificate = certificate({ dsc, subjectKeyIdentifier })
  const signerInfo = der.sequence(
    der.integer(sid === 'subjectKeyIdentifier' ? 3 : 1),
    sid === 'subjectKeyIdentifier'
      ? der.tlv(0x80, subjectKeyIdentifier)
      : der.sequence(der.name('UT', 'Utopia CSCA'), der.integer(0x1142)),
    der.algorithm(hashAlgorithm),
    der.tlv(0xa0, attributes),
    der.algorithm(signatureAlgorithm),
    der.octetString(signature),
  )
  const signedData = der.sequence(
    der.integer(3),
    der.set(der.algorithm(hashAlgorithm)),
    der.sequence(
      der.oid(oids.ldsSecurityObject),
      der.explicit(0, der.octetString(eContent)),
    ),
    der.explicit(
      0,
      ...(options.extraCertificates ?? []),
      certificate({ serialNumber: 7 }),
      dscCertificate,
    ),
    der.set(signerInfo),
  )
  const sod = der.tlv(
    0x77,
    der.sequence(der.oid(oids.signedData), der.explicit(0, signedData)),
  )

  return {
    certificate: dscCertificate,
    chip: {
      modulus: chip.n,
      /**
       * Answers INTERNAL AUTHENTICATE as an RSA chip does: ISO/IEC 9796-2 scheme 1 with SHA-1.
       * `form: 'n - J'` returns `n - s`, which a verifier opens to `n - J`.
       */
      sign(
        challenge: Uint8Array,
        options: {
          form?: 'J' | 'n - J'
          header?: number
          trailer?: number
        } = {},
      ): Uint8Array {
        const { form = 'J', header = 0x6a, trailer = 0xbc } = options
        const m1 = crypto.randomBytes(106)
        const h = crypto
          .createHash('sha1')
          .update(Buffer.concat([m1, challenge]))
          .digest()
        const f = Bytes.toBigInt(
          Bytes.concat(Bytes.from([header]), m1, h, Bytes.from([trailer])),
        )
        const s = modPow(f, chip.d, chip.n)
        return Bytes.fromNumber(form === 'J' ? s : chip.n - s, { size: 128 })
      },
    },
    dg1,
    dg15,
    dscModulus: Bytes.fromNumber(dsc.n, { size: 256 }),
    eContent,
    signedAttributes,
    sod,
  }
}
