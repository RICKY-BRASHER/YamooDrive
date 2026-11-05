import { useCallback, useRef, useState } from 'react'

function readStoredValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): { value: T; error: string | null } {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return { value: fallback, error: null }

    const parsed: unknown = JSON.parse(stored)
    if (!isValid(parsed)) {
      return { value: fallback, error: 'Les données enregistrées dans ce navigateur sont invalides.' }
    }

    return { value: parsed, error: null }
  } catch {
    return { value: fallback, error: 'Impossible de lire les données enregistrées dans ce navigateur.' }
  }
}

export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const [initial] = useState(() => readStoredValue(key, fallback, isValid))
  const [value, setValue] = useState(initial.value)
  const [error, setError] = useState(initial.error)
  const valueRef = useRef(initial.value)

  const commit = useCallback((nextValue: T) => {
    valueRef.current = nextValue
    setValue(nextValue)
    try {
      localStorage.setItem(key, JSON.stringify(nextValue))
      setError(null)
    } catch {
      setError('Impossible d’enregistrer les changements dans ce navigateur. Ils ne seront pas conservés après fermeture.')
    }
  }, [key])

  const save = useCallback((nextValue: T) => commit(nextValue), [commit])
  const update = useCallback((updater: (current: T) => T) => {
    commit(updater(valueRef.current))
  }, [commit])

  return { value, save, update, error }
}
