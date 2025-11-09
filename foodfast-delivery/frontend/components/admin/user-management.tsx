"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/environment"

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: "CUSTOMER" | "RESTAURANT" | "ADMIN"
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null) // Xóa lỗi cũ
      
      // Dùng ApiClient (đã tự động đính kèm 'admin_token')
      const response = await ApiClient.get<any>( // Dùng 'any' vì response không chuẩn
        `${API_CONFIG.USER_SERVICE}/api/v1/users?isActive=true`
      )

      if (response.success) {
        // user-service trả về { success: true, users: [...] }
        setUsers(response.users || []) 
      } else {
        setError(response.message)
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading users...</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Users</h3>
        <Button onClick={() => fetchUsers()}>Refresh</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-6 py-3 text-sm">{user.email}</td>
                <td className="px-6 py-3 text-sm">{user.full_name}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-foreground/70">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-sm">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
