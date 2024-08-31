import { JsonRpc } from 'ox'

export async function request<json extends JsonRpc.Request>(
  url: string,
  json: json | JsonRpc.Request,
): Promise<JsonRpc.parseResponse.ReturnType<json['_returnType']>> {
  return fetch(url, {
    body: JSON.stringify(json),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then((res) => res.json())
    .then((res) => JsonRpc.parseResponse(res, { request: json })) as never
}
