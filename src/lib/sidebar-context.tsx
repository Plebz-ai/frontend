'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  refreshTrigger: number
  refreshCharacters: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  refreshTrigger: 0,
  refreshCharacters: () => {}
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshCharacters = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, refreshTrigger, refreshCharacters }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext) 