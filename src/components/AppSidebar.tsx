import { 
  Users, 
  FileText, 
  FileStack, 
  Tag, 
  Bell, 
  MessageSquare, 
  Eye, 
  Share2, 
  Settings,
  Shield,
  LayoutDashboard,
  PanelLeft,
  Navigation,
  Plus
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useMenuCounts } from "@/hooks/useMenuCounts";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserDropdown } from "@/components/UserDropdown";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, countKey: null },
  { title: "Reportes", url: "/reportes", icon: FileText, countKey: "reportes" as const },
  { title: "Mis Reportes", url: "/mis-reportes", icon: FileStack, countKey: null },
  { title: "Crear Reporte", url: "/reportes/crear", icon: Plus, countKey: null },
  { title: "Rastreo en Vivo", url: "/rastreo", icon: Navigation, countKey: null },
  { title: "Tipo de Reportes", url: "/tipos-reportes", icon: FileStack, countKey: null },
  { title: "Usuarios", url: "/usuarios", icon: Users, countKey: null },
  { title: "Categorías", url: "/categorias", icon: Tag, countKey: null },
  { title: "Mensajes", url: "/mensajeria", icon: MessageSquare, countKey: "mensajes" as const },
  { title: "Notificaciones", url: "/notificaciones", icon: Bell, countKey: "notificaciones" as const },
  { title: "Red Social", url: "/red-social", icon: Share2, countKey: "redSocial" as const },
  { title: "Auditoría", url: "/auditoria", icon: Eye, countKey: null },
  { title: "Configuración", url: "/configuracion", icon: Settings, countKey: null },
];

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { profile } = useProfile();
  const { counts } = useMenuCounts();
  const { hasPermission } = usePermissions();
  const isCollapsed = state === "collapsed" && !isMobile;

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    // Show "Crear Reporte" only if user has permission
    if (item.title === "Crear Reporte") {
      return hasPermission("crear_reporte");
    }
    return true;
  });

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleUserMenuClose = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="border-b px-3 h-14 flex items-center">
        {isCollapsed ? (
          <div className="w-full flex justify-center">
            <button
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <PanelLeft className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold text-sidebar-foreground">UniAlerta UCE</span>
            </NavLink>
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <PanelLeft className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={`${isCollapsed ? "px-0" : "px-2"} py-3`}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/"}
                      onClick={handleMenuItemClick}
                      state={item.url === "/red-social" ? { shouldRefresh: true } : undefined}
                      className={({ isActive }) =>
                        `${isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        } ${isCollapsed ? "!justify-center !p-0 !mx-auto relative" : ""}`
                      }
                    >
                      <item.icon />
                      {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      {item.countKey && counts[item.countKey] > 0 && (
                        <Badge 
                          variant="destructive" 
                          className={`${isCollapsed 
                            ? "absolute -top-1 -right-1 h-4 w-4 text-[10px]" 
                            : "ml-auto h-5 w-5 text-xs"
                          } flex items-center justify-center p-0`}
                        >
                          {counts[item.countKey]}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`mt-auto border-t ${isCollapsed ? "px-0" : "px-2"} py-3`}>
        <UserDropdown showInfo={true} isCollapsed={isCollapsed} onMenuClose={handleUserMenuClose} />
      </SidebarFooter>
    </Sidebar>
  );
}
