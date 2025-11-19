import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

type UserPermission = Database["public"]["Enums"]["user_permission"];

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  permission: UserPermission;
  redirectTo?: string;
}

export const PermissionProtectedRoute = ({
  children,
  permission,
  redirectTo = "/",
}: PermissionProtectedRouteProps) => {
  const { hasPermission } = usePermissions();
  const { loading, roles } = useAuth();

  // Wait for auth and roles to load before checking permissions
  if (loading || roles === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
