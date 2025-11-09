"use client"

import { useState, useCallback } from "react"
import { ApiClient } from "@/lib/api-client"

export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: "CUSTOMER" | "RESTAURANT" | "ADMIN"
}

const getStorageKeys = (role: string) => {
  const prefix = role.toLowerCase()
  return {
    tokenKey: `${prefix}_token`,
    userKey: `${prefix}_user`,
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = useCallback(async (email: string, password: string, full_name: string, phone: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ApiClient.post("/api/v1/auth/register", {
        email,
        password,
        full_name,
        phone,
      })
      if (response.success) {
        const keys = getStorageKeys("CUSTOMER")
        localStorage.setItem(keys.tokenKey, response.token!)
        localStorage.setItem(keys.userKey, JSON.stringify(response.user))
        // localStorage.setItem("token", response.token!)
        // localStorage.setItem("user", JSON.stringify(response.user))
        setUser(response.user)
        return response
      }
      setError(response.message)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ApiClient.post("/api/v1/auth/login", {
        email,
        password,
      })
      if (response.success) {
        const keys = getStorageKeys(response.user.role)
        localStorage.setItem(keys.tokenKey, response.token!)
        localStorage.setItem(keys.userKey, JSON.stringify(response.user))
        // localStorage.setItem("token", response.token!)
        // localStorage.setItem("user", JSON.stringify(response.user))
        setUser(response.user)
        return response
      }
      setError(response.message)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const registerRestaurant = useCallback(
    async (email: string, password: string, full_name: string, phone: string, restaurant_address: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await ApiClient.post("/api/v1/auth/register-restaurant", {
          email,
          password,
          full_name,
          phone,
          restaurant_address,
        })
        if (response.success) {
          return response
        }
        setError(response.message)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback((role?: string) => {
    if (role) {
      const keys = getStorageKeys(role)
      localStorage.removeItem(keys.tokenKey)
      localStorage.removeItem(keys.userKey)
    } else {
      // Fallback: remove all role-based keys
      localStorage.removeItem("customer_token")
      localStorage.removeItem("customer_user")
      localStorage.removeItem("restaurant_token")
      localStorage.removeItem("restaurant_user")
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_user")
      // Also remove old generic keys for backward compatibility
    }
    
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }, [])

  return {
    user,
    loading,
    error,
    register,
    login,
    registerRestaurant,
    logout,
    getStorageKeys,
  }
}
