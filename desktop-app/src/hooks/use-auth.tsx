import { useEffect, useState, type ReactNode } from "react"
import { authService, type User } from "@/lib/auth-service"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      console.log("[v0] Auth state updated in provider:", user)
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const result = await authService.login(email, password)
    setLoading(false)
    return result
  }

  const register = async (email: string, password: string, displayName?: string) => {
    setLoading(true)
    const result = await authService.register(email, password, displayName)
    setLoading(false)
    return result
  }

  const logout = async () => {
    setLoading(true)
    const result = await authService.logout()
    setLoading(false)
    return result
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

