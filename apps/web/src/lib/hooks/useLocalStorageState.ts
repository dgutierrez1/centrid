import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for persisting state in localStorage
 * @param key - localStorage key to store the value
 * @param defaultValue - default value if no stored value exists
 * @returns [value, setValue] tuple similar to useState
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with default value (hydration-safe)
  // localStorage is read after hydration in useEffect to prevent server/client mismatch
  const [value, setValue] = useState<T>(defaultValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // Read from localStorage after first render (post-hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key)
        if (stored !== null) {
          setValue(JSON.parse(stored) as T)
        }
      } catch (error) {
        console.error(`Error loading localStorage key "${key}":`, error)
      }
      setIsHydrated(true)
    }
  }, [key])

  // Update localStorage whenever value changes (but only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error)
      }
    }
  }, [key, value, isHydrated])

  // Wrapper for setValue that supports updater functions
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue
        return nextValue
      })
    },
    []
  )

  return [value, updateValue]
}
