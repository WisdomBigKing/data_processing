'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      }
    }

    checkAuth()
  }, [setUser, setLoading])

  return <>{children}</>
}
