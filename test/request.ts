import { RpcRequest, RpcResponse } from 'ox'

const requestStore = RpcRequest.createStore()

export async function request<methodName extends RpcRequest.MethodNameGeneric>(
  url: string,
  json: RpcRequest.ExtractMethodParameters<methodName>,
): Promise<RpcRequest.ExtractMethodReturnType<methodName>> {
  return fetch(url, {
    body: JSON.stringify(requestStore.prepare(json)),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then((res) => res.json())
    .then(RpcResponse.parse)
}
