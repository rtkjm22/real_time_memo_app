import { useCallback, useRef } from 'react'

type Debounce = (fn: () => void) => void

export const useDebounce = (timeout: number): Debounce => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounce: Debounce = useCallback(
    (fn) => {
      if (timer.current) clearTimeout(timer.current)

      const hoge = setTimeout(() => {
        fn()
      }, timeout)
      timer.current = hoge
    },
    [timeout]
  )
  return debounce
}
