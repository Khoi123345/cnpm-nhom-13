// foodfast-delivery/frontend/hooks/use-auth.ts

"use client"

import { useState, useCallback } from "react"
import { ApiClient } from "@/lib/api-client"
// ⭐️ SỬA 1: Import API_ENDPOINTS
import { API_ENDPOINTS } from "@/lib/environment"

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
      // ⭐️ SỬA 2: Dùng hằng số
      const response = await ApiClient.post(API_ENDPOINTS.AUTH_REGISTER, {
        email,
        password,
        full_name,
        phone,
      }, true)
      if (response.success) {
        const keys = getStorageKeys("CUSTOMER")
        localStorage.setItem(keys.tokenKey, response.token!)
        localStorage.setItem(keys.userKey, JSON.stringify(response.user))
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
      // ⭐️ SỬA 3: Dùng hằng số
      const response = await ApiClient.post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password,
      }, true)
      
      console.log('Login response:', response) // DEBUG
      
      if (response.success) {
        const keys = getStorageKeys(response.user.role)
        console.log('Saving token to:', keys.tokenKey, 'Token:', response.token) // DEBUG
        localStorage.setItem(keys.tokenKey, response.token!)
        localStorage.setItem(keys.userKey, JSON.stringify(response.user))
        setUser(response.user)
        return response
      }
      setError(response.message)
    } catch (err: any) {
      console.error('Login error:', err) // DEBUG
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
        // ⭐️ SỬA 4: Dùng hằng số
        const response = await ApiClient.post(API_ENDPOINTS.AUTH_REGISTER_RESTAURANT, {
          email,
          password,
          full_name,
          phone,
          restaurant_address,
        }, true)
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
    }
    
    // ⭐️ XOÁ: Các key cũ không còn cần thiết
    // localStorage.removeItem("token")
    // localStorage.removeItem("user")
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