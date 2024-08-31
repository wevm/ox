import { JsonRpc } from 'ox'

const requestStore = JsonRpc.createRequestStore()

export async function request<methodName extends JsonRpc.MethodNameGeneric>(
  url: string,
  json: JsonRpc.ExtractMethodParameters<methodName>,
): Promise<JsonRpc.ExtractMethodReturnType<methodName>> {
  const request = requestStore.prepare(json)
  return fetch(url, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then((res) => res.json())
    .then((res) => JsonRpc.parseResponse(res))
}
