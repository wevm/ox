export async function request(url: string, json: unknown) {
  return fetch(url, {
    body: JSON.stringify(json),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((x) => x.json())
}
