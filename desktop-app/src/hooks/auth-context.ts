import { createContext } from "react"
import type { User } from "@/lib/auth-service"

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
