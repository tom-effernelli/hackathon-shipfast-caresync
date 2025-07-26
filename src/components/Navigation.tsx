import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Users, Home, UserCheck, Kanban, BarChart3, LogOut, Shield, Heart } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/patient-checkin", label: "Patient Check-In", icon: UserCheck },
    { path: "/triage", label: "Triage Analysis", icon: Activity },
    { path: "/patient-management", label: "Patient Management", icon: Users },
    { path: "/triage-workflow", label: "Triage Board", icon: Kanban },
    { path: "/statistics", label: "Statistics", icon: BarChart3, adminOnly: true },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white'
      case 'doctor': return 'bg-blue-500 text-white'
      case 'nurse': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  };

  const visibleNavItems = navItems.filter(item => 
    !item.adminOnly || profile?.medical_role === 'admin'
  );

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">ER Medical Portal</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation Items */}
            <div className="flex items-center gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Logout */}
            {profile && (
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {profile.full_name}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge className={getRoleBadgeColor(profile.medical_role)}>
                      {profile.medical_role.toUpperCase()}
                    </Badge>
                    <Shield className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}