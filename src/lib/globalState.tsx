import { createContext, useContext, type ReactNode } from 'react'

type GlobalStateContextValue = Record<string, never>

const GlobalStateContext = createContext<GlobalStateContextValue | null>(null)

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  return (
    <GlobalStateContext.Provider value={{}}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext)
  if (!ctx) throw new Error('useGlobalState must be used within GlobalStateProvider')
  return ctx
}
