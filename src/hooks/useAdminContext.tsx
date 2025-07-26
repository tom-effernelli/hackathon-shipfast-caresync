import { createContext, useContext } from 'react'

interface AdminContextType {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    user_id: string
    full_name: string
    medical_role: 'admin'
    department?: string
    license_number?: string
    phone?: string
    is_active: boolean
  }
  loading: false
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const mockAdminUser = {
    user: {
      id: 'admin-user',
      email: 'admin@hospital.com'
    },
    profile: {
      id: 'admin-profile',
      user_id: 'admin-user',
      full_name: 'Admin User',
      medical_role: 'admin' as const,
      department: 'Administration',
      is_active: true
    },
    loading: false as const
  }

  return <AdminContext.Provider value={mockAdminUser}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}