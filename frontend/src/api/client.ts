// Thin wrapper over Frappe's /api/method/<dotted.path> endpoint.
// All calls send credentials so the Frappe session cookie is included.
// Frappe wraps responses as { message: <returned_value> } — we unwrap.

export class FrappeApiError extends Error {
  status: number
  isAuth: boolean
  constructor(message: string, status: number) {
    super(message)
    this.name = 'FrappeApiError'
    this.status = status
    this.isAuth = status === 401 || status === 403
  }
}

export async function frappeCall<T>(
  method: string,
  args: Record<string, unknown> = {},
  init: RequestInit = {},
): Promise<T> {
  const url = `/api/method/${method}`
  const body =
    Object.keys(args).length > 0 ? JSON.stringify(args) : undefined
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Frappe-CSRF-Token': getCsrfToken(),
      Accept: 'application/json',
    },
    body,
    ...init,
  })
  if (!res.ok) {
    let message = `${method} failed (${res.status})`
    try {
      const errJson = await res.json()
      if (errJson?.exception) message = errJson.exception
      else if (errJson?._server_messages) message = errJson._server_messages
    } catch {
      // ignore
    }
    throw new FrappeApiError(message, res.status)
  }
  const json = await res.json()
  return (json?.message ?? json) as T
}

function getCsrfToken(): string {
  // Frappe sets window.csrf_token when the page is rendered through the
  // website. For SPA deep navigation we may not have it; an empty token is
  // accepted by Frappe for whitelisted methods called with a session cookie.
  // @ts-expect-error - csrf_token is injected by Frappe at runtime
  return (typeof window !== 'undefined' && window.csrf_token) || ''
}

export function isLikelyFrappeHosted(): boolean {
  // Heuristic: the bundle is served from /assets/vcl_portal/portal_v2/ on a
  // Frappe site. In standalone Vite dev (npm run dev) it is served from /.
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/portal-v2')
}
