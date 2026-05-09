import { useEffect, useState } from 'react'
import { FrappeApiError } from './client'

export type ApiState<T> =
  | { status: 'loading'; data: T; isFallback: boolean; error: null }
  | { status: 'ready'; data: T; isFallback: false; error: null }
  | { status: 'fallback'; data: T; isFallback: true; error: Error }

// useApi: runs `loader` on mount; if it rejects, falls back to `mock` with
// the error attached so the UI can show a soft banner. Always renders SOME
// data so card layouts never break in standalone Vite dev or for guests.
export function useApi<T>(
  loader: () => Promise<T>,
  mock: T,
  deps: ReadonlyArray<unknown> = [],
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    status: 'loading',
    data: mock,
    isFallback: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: mock, isFallback: true, error: null })
    loader()
      .then((data) => {
        if (cancelled) return
        setState({ status: 'ready', data, isFallback: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ status: 'fallback', data: mock, isFallback: true, error })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function isAuthError(err: Error | null | undefined): boolean {
  return err instanceof FrappeApiError && err.isAuth
}
