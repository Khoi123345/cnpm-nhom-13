"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: "CUSTOMER" | "RESTAURANT" | "ADMIN"
  status: "ACTIVE" | "BANNED"
  created_at?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Gọi qua API Gateway
      const response = await ApiClient.get("/api/users")
      if (response.success) {
        setUsers(response.data)
      } else {
        setError(response.message)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleBan = async (userId: string) => {
    try {
      const response = await ApiClient.post(`/api/users/${userId}/ban`, {})
      if (response.success) {
        setUsers(currentUsers =>
          currentUsers.map(user =>
            user.id === userId ? { ...user, status: "BANNED" } : user,
          ),
        )
        toast.success("User has been banned.")
      } else {
        toast.error(response.message || "Failed to ban user")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to ban user")
    }
  }

  const handleUnban = async (userId: string) => {
    try {
      const response = await ApiClient.post(`/api/users/${userId}/unban`, {})
      if (response.success) {
        setUsers(currentUsers =>
          currentUsers.map(user =>
            user.id === userId ? { ...user, status: "ACTIVE" } : user,
          ),
        )
        toast.success("User has been unbanned.")
      } else {
        toast.error(response.message || "Failed to unban user")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unban user")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  if (loading) return <div>Loading users...</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <Button
          onClick={fetchUsers}
          variant="default"
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          Refresh
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : user.status === "ACTIVE" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBan(user.id)}
                    >
                      Ban
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUnban(user.id)}
                    >
                      Unban
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}