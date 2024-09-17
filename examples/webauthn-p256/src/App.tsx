import { type Hex, PublicKey, WebAuthnP256 } from 'ox'
import { stringify } from 'ox/Internal'
import { useState } from 'react'

export function App() {
  const [credential, setCredential] = useState<WebAuthnP256.P256Credential>()
  const [signResponse, setSignResponse] =
    useState<WebAuthnP256.sign.ReturnType>()
  const [verified, setVerified] = useState<boolean>()

  return (
    <div>
      <h2>Create Credential</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)

          const credential = await WebAuthnP256.createCredential({
            name: formData.get('name') as string,
          })
          setCredential(credential)
        }}
      >
        <input defaultValue="Example" name="name" placeholder="Name" />
        <button type="submit">Create credential</button>
      </form>
      <br />
      {credential && (
        <div>
          <strong>Credential ID:</strong>
          <br />
          {credential.id}
          <br />
          <br />
          <strong>Public Key: </strong>
          <br />
          <pre>{stringify(credential.publicKey, null, 2)}</pre>
          <strong>Public Key (serialized): </strong>
          <br />
          <pre>{PublicKey.serialize(credential.publicKey)}</pre>
        </div>
      )}
      <br />
      <hr />
      <h2>Sign</h2>
      <div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const payload = formData.get('payload') as Hex.Hex

            const response = await WebAuthnP256.sign({
              credentialId: credential?.id,
              payload,
            })
            setSignResponse(response)
          }}
        >
          <strong>Payload:</strong>
          <br />
          <input
            defaultValue="0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf"
            name="payload"
            placeholder="Payload"
            style={{ width: 500 }}
          />
          <button type="submit">Sign</button>
        </form>
        <br />
        {signResponse && (
          <div>
            <strong>Signature:</strong>
            <br />
            <pre>{stringify(signResponse.signature, null, 2)}</pre>
            <br />
            <strong>Metadata:</strong>
            <br />
            <pre>{stringify(signResponse.metadata, null, 2)}</pre>
          </div>
        )}
        {signResponse && credential && (
          <div>
            <br />
            <hr />
            <h2>Verify</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()

                setVerified(undefined)

                const formData = new FormData(e.target as HTMLFormElement)
                const payload = formData.get('payload') as Hex.Hex
                const signature = JSON.parse(
                  formData.get('signature') as string,
                )
                const metadata = JSON.parse(formData.get('webauthn') as string)

                const verified = WebAuthnP256.verify({
                  payload,
                  publicKey: credential.publicKey,
                  signature: {
                    r: BigInt(signature.r),
                    s: BigInt(signature.s),
                  },
                  metadata,
                })

                setVerified(verified)
              }}
            >
              <strong>Payload:</strong>
              <div>
                <input
                  defaultValue="0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf"
                  name="payload"
                  placeholder="Payload"
                  style={{ width: 500 }}
                />
              </div>
              <br />
              <strong>Signature:</strong>
              <div>
                <textarea
                  name="signature"
                  style={{ height: 100, width: 500 }}
                />
              </div>
              <br />
              <strong>Metadata:</strong>
              <div>
                <textarea name="webauthn" style={{ height: 100, width: 500 }} />
              </div>
              <br />
              <button type="submit">Verify</button>
              <br />
              {verified === true && <div>we gucci</div>}
              {verified === false && <div>we not gucci</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}