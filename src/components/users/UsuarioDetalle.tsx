import { Layout } from "@/components/Layout";
import { ArrowLeft, User, FileText, Shield, Settings as SettingsIcon, History, Activity, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { UserSidebar } from "./detalle/UserSidebar";
import { UserReportes } from "./detalle/UserReportes";
import { UserRoles } from "./detalle/UserRoles";
import { UserPermisos } from "./detalle/UserPermisos";
import { UserAuditoria } from "./detalle/UserAuditoria";
import { UserCambios } from "./detalle/UserCambios";
import { UserActivityStats } from "@/components/ui/user-activity-stats";

const UsuarioDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUserById, resendConfirmation, toggleUserStatus, toggleBlockUser, updateUserRoles } = useUserManagement();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(true);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      administrador: "Administrador",
      mantenimiento: "Mantenimiento",
      usuario_regular: "Usuario Regular",
    };
    return labels[role] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      administrador: "Rol de administrador con todos los permisos del sistema",
      mantenimiento: "Rol de mantenimiento con permisos de gestión",
      usuario_regular: "Rol básico de usuario con permisos limitados",
    };
    return descriptions[role] || "Rol de usuario";
  };

  const getRolePermissions = (role: string): string[] => {
    const permissions: Record<string, string[]> = {
      administrador: [
        "ver_reporte", "crear_reporte", "editar_reporte", "eliminar_reporte",
        "ver_usuario", "crear_usuario", "editar_usuario", "eliminar_usuario",
        "ver_categoria", "crear_categoria", "editar_categoria", "eliminar_categoria",
      ],
      mantenimiento: [
        "ver_reporte", "crear_reporte", "editar_reporte",
        "ver_categoria", "crear_categoria", "editar_categoria",
      ],
      usuario_regular: ["ver_reporte", "crear_reporte"],
    };
    return permissions[role] || [];
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      ver_reporte: "Ver Reportes",
      crear_reporte: "Crear Reportes",
      editar_reporte: "Editar Reportes",
      eliminar_reporte: "Eliminar Reportes",
      ver_usuario: "Ver Usuarios",
      crear_usuario: "Crear Usuarios",
      editar_usuario: "Editar Usuarios",
      eliminar_usuario: "Eliminar Usuarios",
      ver_categoria: "Ver Categorías",
      crear_categoria: "Crear Categorías",
      editar_categoria: "Editar Categorías",
      eliminar_categoria: "Eliminar Categorías",
    };
    return labels[permission] || permission;
  };

  const getPermissionsByCategory = () => {
    return {
      reportes: ["ver_reporte", "crear_reporte", "editar_reporte", "eliminar_reporte"],
      usuarios: ["ver_usuario", "crear_usuario", "editar_usuario", "eliminar_usuario"],
      categorias: ["ver_categoria", "crear_categoria", "editar_categoria", "eliminar_categoria"],
      estados: ["ver_estado", "crear_estado", "editar_estado", "eliminar_estado"],
    };
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      reportes: "Reportes",
      usuarios: "Usuarios",
      categorias: "Categorías",
      estados: "Estados",
    };
    return labels[category] || category;
  };

  const handleTogglePermission = async (permission: string) => {
    if (!user) return;

    const newPermisos = permisos.includes(permission)
      ? permisos.filter((p: string) => p !== permission)
      : [...permisos, permission];

    const success = await updateUserRoles(user.id, {
      permisos: newPermisos as Database["public"]["Enums"]["user_permission"][],
    });

    if (success) {
      setUser((prev: any) => {
        if (!prev) return prev;
        const updatedUserRoles = Array.isArray(prev.user_roles) 
          ? [{ ...prev.user_roles[0], permisos: newPermisos }]
          : { ...prev.user_roles, permisos: newPermisos };
        return { ...prev, user_roles: updatedUserRoles };
      });
    }
  };

  const handleToggleAllCategory = async (category: string) => {
    if (!user) return;

    const categoryPermissions = getPermissionsByCategory()[category as keyof ReturnType<typeof getPermissionsByCategory>];
    const allChecked = categoryPermissions.every((p: string) => permisos.includes(p));

    const newPermisos = allChecked
      ? permisos.filter((p: string) => !categoryPermissions.includes(p))
      : Array.from(new Set([...permisos, ...categoryPermissions]));

    const success = await updateUserRoles(user.id, {
      permisos: newPermisos as Database["public"]["Enums"]["user_permission"][],
    });

    if (success) {
      setUser((prev: any) => {
        if (!prev) return prev;
        const updatedUserRoles = Array.isArray(prev.user_roles) 
          ? [{ ...prev.user_roles[0], permisos: newPermisos }]
          : { ...prev.user_roles, permisos: newPermisos };
        return { ...prev, user_roles: updatedUserRoles };
      });
    }
  };

  const getAvailableRoles = () => {
    const allRoles = ["administrador", "mantenimiento", "usuario_regular"];
    return allRoles.filter(role => !roles.includes(role));
  };

  const handleAddRole = async (role: string) => {
    if (!user) return;

    const newRoles = [...roles, role] as Database["public"]["Enums"]["user_role"][];
    
    // Agregar permisos del nuevo rol a los permisos existentes
    const rolePermissions = getRolePermissions(role) as Database["public"]["Enums"]["user_permission"][];
    const newPermisos = Array.from(new Set([
      ...permisos,
      ...rolePermissions
    ])) as Database["public"]["Enums"]["user_permission"][];

    const success = await updateUserRoles(user.id, {
      roles: newRoles,
      permisos: newPermisos,
    });

    if (success) {
      setUser((prev: any) => {
        if (!prev) return prev;
        const updatedUserRoles = Array.isArray(prev.user_roles) 
          ? [{ ...prev.user_roles[0], roles: newRoles, permisos: newPermisos }]
          : { ...prev.user_roles, roles: newRoles, permisos: newPermisos };
        return { ...prev, user_roles: updatedUserRoles };
      });
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!user) return;

    if (roles.length <= 1) {
      toast({
        title: "Error",
        description: "El usuario debe tener al menos un rol asignado",
        variant: "destructive",
      });
      return;
    }

    const newRoles = roles.filter((r: string) => r !== role) as Database["public"]["Enums"]["user_role"][];
    
    // Recalcular permisos basados en los roles restantes
    const allPermissions = newRoles.flatMap((r: string) => getRolePermissions(r));
    const newPermisos = Array.from(new Set(allPermissions)) as Database["public"]["Enums"]["user_permission"][];

    const success = await updateUserRoles(user.id, {
      roles: newRoles,
      permisos: newPermisos,
    });

    if (success) {
      setUser((prev: any) => {
        if (!prev) return prev;
        const updatedUserRoles = Array.isArray(prev.user_roles) 
          ? [{ ...prev.user_roles[0], roles: newRoles, permisos: newPermisos }]
          : { ...prev.user_roles, roles: newRoles, permisos: newPermisos };
        return { ...prev, user_roles: updatedUserRoles };
      });
    }
  };

  const getUserType = (userRoles: any) => {
    if (!userRoles) return "Usuario";
    const roles = Array.isArray(userRoles) ? userRoles[0]?.roles || [] : userRoles.roles || [];
    return roles.includes("administrador") ? "Administrador" : "Usuario";
  };

  const loadUser = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const userData = await getUserById(id);
      if (userData) {
        setUser(userData);
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la información del usuario",
          variant: "destructive",
        });
        navigate("/usuarios");
      }
    } catch (error) {
      console.error("Error loading user:", error);
      toast({
        title: "Error",
        description: "Error al cargar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReportes = async () => {
    if (!id) return;
    
    setLoadingReportes(true);
    try {
      // Use the same query structure as getReports but filter by assigned_to
      const { data, error } = await supabase
        .from("reportes")
        .select("*, categories(nombre), tipo_categories(nombre), profiles!reportes_user_id_fkey(name), assigned_profiles:profiles!reportes_assigned_to_fkey(name)")
        .eq("assigned_to", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReportes(data || []);
    } catch (error) {
      console.error("Error loading reportes:", error);
    } finally {
      setLoadingReportes(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadReportes();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    
    setUpdatingStatus(true);
    try {
      const success = await toggleUserStatus(user.id, user.estado);
      if (success) {
        const newStatus = user.estado === "activo" ? "inactivo" : "activo";
        setUser((prev: any) => prev ? { ...prev, estado: newStatus } : prev);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    
    setBlockingUser(true);
    try {
      const success = await toggleBlockUser(user.id, user.estado);
      if (success) {
        const newStatus = user.estado === "bloqueado" ? "activo" : "bloqueado";
        setUser((prev: any) => prev ? { ...prev, estado: newStatus } : prev);
      }
    } catch (error) {
      console.error("Error toggling block:", error);
    } finally {
      setBlockingUser(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    
    setResendingEmail(true);
    try {
      await resendConfirmation(user.email);
    } catch (error) {
      console.error("Error resending confirmation:", error);
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Detalle del Usuario" icon={User}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Detalle del Usuario" icon={User}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Usuario no encontrado</p>
          </div>
        </div>
      </Layout>
    );
  }

  const roles = Array.isArray(user.user_roles) ? user.user_roles[0]?.roles || [] : user.user_roles?.roles || [];
  const permisos = Array.isArray(user.user_roles) ? user.user_roles[0]?.permisos || [] : user.user_roles?.permisos || [];

  return (
    <Layout title="Detalle del Usuario" icon={User}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/usuarios")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Detalle del Usuario</h1>
                <p className="text-muted-foreground">Información completa del usuario</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/usuarios/editar/${user.id}`)} className="w-full sm:w-auto sm:mt-8">
              <Edit className="h-4 w-4 mr-2" />
              Editar Usuario
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <UserSidebar
              user={user}
              getInitials={getInitials}
              getUserType={getUserType}
              handleToggleStatus={handleToggleStatus}
              handleToggleBlock={handleToggleBlock}
              handleResendConfirmation={handleResendConfirmation}
              updatingStatus={updatingStatus}
              blockingUser={blockingUser}
              resendingEmail={resendingEmail}
            />
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="reportes" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                <TabsTrigger value="reportes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Reportes
                </TabsTrigger>
                <TabsTrigger value="roles" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="permisos" className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Permisos
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="gap-2">
                  <History className="h-4 w-4" />
                  Auditoría
                </TabsTrigger>
                <TabsTrigger value="cambios" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Cambios
                </TabsTrigger>
                <TabsTrigger value="actividad" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Actividad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reportes" className="mt-6">
                <UserReportes
                  reportes={reportes}
                  loadingReportes={loadingReportes}
                  userName={user.name || user.username}
                />
              </TabsContent>

              <TabsContent value="roles" className="mt-6">
                <UserRoles
                  roles={roles}
                  onRemoveRole={handleRemoveRole}
                  onAddRole={handleAddRole}
                  getRoleLabel={getRoleLabel}
                  getRoleDescription={getRoleDescription}
                  getAvailableRoles={getAvailableRoles}
                />
              </TabsContent>

              <TabsContent value="permisos" className="mt-6">
                <UserPermisos
                  permisos={permisos}
                  onTogglePermission={handleTogglePermission}
                  onToggleAllCategory={handleToggleAllCategory}
                  getPermissionsByCategory={getPermissionsByCategory}
                  getCategoryLabel={getCategoryLabel}
                  getPermissionLabel={getPermissionLabel}
                />
              </TabsContent>

              <TabsContent value="auditoria" className="mt-6">
                <UserAuditoria userId={user.id} userEmail={user.email} />
              </TabsContent>

              <TabsContent value="cambios" className="mt-6">
                <UserCambios userId={user.id} userEmail={user.email} />
              </TabsContent>

              <TabsContent value="actividad" className="mt-6">
                <UserActivityStats 
                  userId={user.id}
                  userEmail={user.email || undefined}
                  userCreatedAt={user.created_at}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UsuarioDetalle;
