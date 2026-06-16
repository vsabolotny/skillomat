const BASE = '/api'

export interface ApiError {
  message: string
  /** Laravel 422 field errors, keyed by input name. */
  errors?: Record<string, string[]>
  status: number
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'status' in value && 'message' in value
}

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw {
      message: data?.message ?? `Request failed (${response.status})`,
      errors: data?.errors,
      status: response.status,
    } satisfies ApiError
  }

  return data as T
}
