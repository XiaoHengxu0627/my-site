import { createContext, useContext, useState, type ReactNode } from 'react'

type GlobalStateContextValue = {
  hasShowedHomeLoading: boolean
  setHasShowedHomeLoading: (val: boolean) => void
}

const GlobalStateContext = createContext<GlobalStateContextValue | null>(null)

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [hasShowedHomeLoading, setHasShowedHomeLoading] = useState(false)

  return (
    <GlobalStateContext.Provider value={{ hasShowedHomeLoading, setHasShowedHomeLoading }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext)
  if (!ctx) throw new Error('useGlobalState must be used within GlobalStateProvider')
  return ctx
}
