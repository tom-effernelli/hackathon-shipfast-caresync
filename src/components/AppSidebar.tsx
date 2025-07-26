import { Heart, Activity, Users, UserCheck, BarChart3, Home, LogOut, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const workflowItems = [
    { title: "Triage Board", url: "/", icon: Activity },
    { title: "Patient Check-In", url: "/patient-checkin", icon: UserCheck },
    { title: "Patient Management", url: "/patient-management", icon: Users },
  ];

  const analysisItems = [
    { title: "Triage Analysis", url: "/triage", icon: Heart },
    { title: "Statistics", url: "/statistics", icon: BarChart3, adminOnly: true },
  ];

  const overviewItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white'
      case 'doctor': return 'bg-blue-500 text-white'
      case 'nurse': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  };

  const visibleAnalysisItems = analysisItems.filter(item => 
    !item.adminOnly || profile?.medical_role === 'admin'
  );

  const renderMenuItems = (items: typeof workflowItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.url);

      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <Link 
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-lg">ER Portal</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Workflow
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(workflowItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Analysis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(visibleAnalysisItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(overviewItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {profile && (
          <div className="space-y-3">
            {!collapsed && (
              <div className="space-y-2">
                <p className="text-sm font-medium truncate">
                  {profile.full_name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(profile.medical_role)}>
                    {profile.medical_role.toUpperCase()}
                  </Badge>
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}