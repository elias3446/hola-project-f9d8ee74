import { useAuth } from "./useAuth";
import { Database } from "@/integrations/supabase/types";

type UserPermission = Database["public"]["Enums"]["user_permission"];

export const usePermissions = () => {
  const { roles } = useAuth();

  const hasPermission = (permission: UserPermission): boolean => {
    if (!roles || !roles.permisos) return false;
    return roles.permisos.includes(permission);
  };

  const hasAnyPermission = (permissions: UserPermission[]): boolean => {
    if (!roles || !roles.permisos) return false;
    return permissions.some(permission => roles.permisos.includes(permission));
  };

  const hasAllPermissions = (permissions: UserPermission[]): boolean => {
    if (!roles || !roles.permisos) return false;
    return permissions.every(permission => roles.permisos.includes(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: roles?.permisos || [],
  };
};
