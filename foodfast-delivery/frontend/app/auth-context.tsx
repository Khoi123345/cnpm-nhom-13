"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: "CUSTOMER" | "RESTAURANT" | "ADMIN"
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  return <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
