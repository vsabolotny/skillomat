/** Build a minimal `fetch` Response stand-in matching what apiFetch reads. */
export function jsonResponse(body: unknown, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}
