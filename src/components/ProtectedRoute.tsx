import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Heart } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'doctor' | 'nurse' | 'admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <Heart className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Verifying medical credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (requiredRole && profile?.medical_role !== requiredRole && profile?.medical_role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
            <Heart className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this area. Required role: {requiredRole}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your current role: {profile?.medical_role || 'No role assigned'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}