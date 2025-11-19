import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"];
type UserPermission = Database["public"]["Enums"]["user_permission"];

interface UserWithRoles extends Profile {
  user_roles?: UserRole[] | UserRole | null;
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);

  // Verificar permisos del usuario actual
  const checkPermission = async (permission: UserPermission): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return false;

      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: profile.id,
        _permission: permission,
      });

      if (error) {
        console.error("Error checking permission:", error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error("Error in checkPermission:", error);
      return false;
    }
  };

  // Obtener todos los usuarios con sus roles
  const getUsers = async (): Promise<UserWithRoles[]> => {
    try {
      setLoading(true);
      console.log("Starting getUsers...");

      // Timeout para evitar cargas infinitas
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout al cargar usuarios")), 15000)
      );

      const fetchData = async () => {
        // Obtener el ID del usuario actual primero
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Error getting auth user:", authError);
          throw new Error("Error de autenticación");
        }
        
        if (!user) {
          console.error("No authenticated user found");
          throw new Error("Usuario no autenticado");
        }

        const { data: currentProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching current profile:", profileError);
          throw new Error("Error al obtener perfil del usuario");
        }

        if (!currentProfile) {
          console.error("No profile found for user:", user.id);
          throw new Error("Perfil no encontrado");
        }

        // RLS policies handle permissions - no need to check here
        console.log("Fetching users from database...");
        
        // Check if user is admin to determine if email should be included
        const isAdmin = await checkPermission("editar_usuario");
        
        // Fetch all users with roles first
        const { data: rawData, error } = await supabase
          .from("profiles")
          .select(`
            *,
            user_roles!user_roles_user_id_fkey (*)
          `)
          .is("deleted_at", null)
          .neq("id", currentProfile.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }
        
        // Security: Remove email field for non-admins to prevent exposure
        const data = isAdmin 
          ? rawData 
          : rawData?.map(user => {
              const { email, ...userWithoutEmail } = user;
              return userWithoutEmail;
            }) as any[];

        console.log("Users fetched successfully:", data?.length || 0);
        return (data || []) as UserWithRoles[];
      };

      return await Promise.race([fetchData(), timeout]);
    } catch (error: any) {
      console.error("Error in getUsers:", error);
      toast.error(error.message || "Error al obtener usuarios");
      return [];
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  // Obtener un usuario por ID
  const getUserById = async (id: string): Promise<UserWithRoles | null> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      // Get current user's profile to check ownership
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id || '')
        .maybeSingle();

      const isOwnProfile = currentProfile?.id === id;
      const isAdmin = await checkPermission("editar_usuario");
      
      // Fetch user with all data
      const { data: rawData, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!user_roles_user_id_fkey (*)
        `)
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      
      // Security: Remove email field if not own profile and not admin
      if (!isOwnProfile && !isAdmin && rawData) {
        const { email, ...dataWithoutEmail } = rawData;
        return dataWithoutEmail as UserWithRoles;
      }

      return rawData as UserWithRoles;
    } catch (error: any) {
      toast.error(error.message || "Error al obtener usuario");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear un nuevo usuario
  const createUser = async (
    email: string,
    password: string,
    userData: {
      name: string;
      username?: string;
      roles?: Database["public"]["Enums"]["user_role"][];
      permisos?: UserPermission[];
    }
  ): Promise<UserWithRoles | null> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      // Obtener el profile_id del usuario actual para registrar quién crea el usuario
      const { data: { user } } = await supabase.auth.getUser();
      let creatorProfileId = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          creatorProfileId = profile.id;
        }
      }

      // SECURITY NOTE: Creating user with auth metadata
      // The roles and permissions in metadata are NOT trusted for authorization.
      // They are only hints for the backend trigger (handle_new_user) which:
      // 1. Runs as SECURITY DEFINER (privileged context)
      // 2. Validates and stores roles in the separate user_roles table
      // 3. All authorization checks use has_permission() which queries the database
      // Client-provided metadata cannot escalate privileges - only admins can assign roles.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            password: password,
            // Metadata hints for backend trigger (not trusted for authorization)
            roles: userData.roles || ["usuario_regular"],
            permisos: userData.permisos || ["ver_reporte", "crear_reporte"],
            creator_profile_id: creatorProfileId,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Esperar a que se cree el perfil automáticamente (trigger)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Obtener el perfil creado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      toast.success("Usuario creado exitosamente");
      return await getUserById(profile.id);
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un usuario
  const updateUser = async (
    id: string,
    updates: ProfileUpdate
  ): Promise<UserWithRoles | null> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          user_roles!user_roles_user_id_fkey (*)
        `)
        .single();

      if (error) throw error;

      toast.success("Usuario actualizado exitosamente");
      return data as UserWithRoles;
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar usuario");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar roles de un usuario
  const updateUserRoles = async (
    userId: string,
    rolesUpdate: UserRoleUpdate
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      const { error } = await supabase
        .from("user_roles")
        .update(rolesUpdate)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Roles actualizados exitosamente");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar roles");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un usuario (soft delete)
  const deleteUser = async (id: string, options?: { silent?: boolean }): Promise<boolean> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      if (!options?.silent) {
        toast.success("Usuario eliminado exitosamente");
      }
      return true;
    } catch (error: any) {
      if (!options?.silent) {
        toast.error(error.message || "Error al eliminar usuario");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reenviar confirmación de email
  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      // No usamos setLoading aquí para evitar recargar toda la tabla

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Email de confirmación reenviado");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al reenviar confirmación");
      return false;
    }
  };

  // Cambiar estado de usuario (activo/inactivo)
  const toggleUserStatus = async (
    userId: string,
    currentStatus: string
  ): Promise<boolean> => {
    try {
      // RLS policies handle permissions - no need to check here
      const newStatus = currentStatus === "activo" ? "inactivo" : "activo";

      const { error } = await supabase
        .from("profiles")
        .update({ estado: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Usuario ${newStatus === "activo" ? "activado" : "desactivado"} exitosamente`);
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado del usuario");
      return false;
    }
  };

  // Bloquear/Desbloquear usuario
  const toggleBlockUser = async (
    userId: string,
    currentStatus: string
  ): Promise<boolean> => {
    try {
      // RLS policies handle permissions - no need to check here
      const newStatus = currentStatus === "bloqueado" ? "activo" : "bloqueado";

      const { error } = await supabase
        .from("profiles")
        .update({ estado: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Usuario ${newStatus === "bloqueado" ? "bloqueado" : "desbloqueado"} exitosamente`);
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al bloquear/desbloquear usuario");
      return false;
    }
  };

  // Cambiar email de usuario usando función de base de datos
  const changeUserEmail = async (
    profileId: string,
    oldEmail: string,
    newEmail: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // RLS policies handle permissions - no need to check here
      // Paso 0: Obtener el user_id del usuario viejo para cerrar sus sesiones
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      
      const oldUserId = profileData?.user_id;

      // Paso 0.5: Cerrar todas las sesiones del usuario VIEJO antes de eliminarlo
      if (oldUserId) {
        try {
          const { error: signOutError } = await supabase.rpc(
            "admin_sign_out_user",
            { user_id_to_sign_out: oldUserId }
          );
          
          if (signOutError) {
            console.warn("Error al cerrar sesiones del usuario:", signOutError);
          }
        } catch (signOutErr) {
          console.warn("Error al intentar cerrar sesiones:", signOutErr);
        }
      }

      // Paso 1: Preparar el cambio y eliminar usuario viejo (usando función de BD)
      const { data: changeData, error: changeError } = await supabase.rpc(
        "complete_email_change",
        {
          p_profile_id: profileId,
          p_new_email: newEmail,
        }
      );

      if (changeError) throw changeError;

      // Paso 2: Crear nuevo usuario con el nuevo email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            // Mantener el mismo perfil
            existing_profile_id: profileId,
            password: newPassword,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("No se pudo crear el nuevo usuario");
      }

      // Paso 3: Reconectar el perfil con el nuevo usuario
      const { error: reconnectError } = await supabase.rpc(
        "reconnect_profile_after_email_change",
        {
          p_profile_id: profileId,
          p_new_user_id: signUpData.user.id,
          p_new_email: newEmail,
        }
      );

      if (reconnectError) throw reconnectError;

      toast.success("Email actualizado exitosamente. El usuario debe confirmar su nuevo email y todas sus sesiones han sido cerradas por seguridad.");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar email del usuario");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtener usuarios asignables (confirmados, activos, con rol admin o mantenimiento)
  const getUsersForAssignment = async (): Promise<UserWithRoles[]> => {
    try {
      setLoading(true);

      // Obtener el usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Error getting auth user:", authError);
        return [];
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !currentProfile) {
        console.error("Error fetching current profile:", profileError);
        return [];
      }

      // Obtener usuarios confirmados, activos y con roles apropiados
      // Use profiles_public for non-sensitive data access
      const { data, error } = await supabase
        .from("profiles_public")
        .select(`
          *,
          user_roles!user_roles_user_id_fkey (
            roles
          )
        `)
        .is("deleted_at", null)
        .eq("confirmed", true)
        .eq("estado", "activo")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching assignable users:", error);
        return [];
      }

      // Filtrar usuarios que tengan rol administrador o mantenimiento
      const assignableUsers = (data || []).filter((profile: any) => {
        const userRoles = profile.user_roles;
        if (!userRoles) return false;
        
        const roles = Array.isArray(userRoles) 
          ? userRoles[0]?.roles || []
          : userRoles?.roles || [];
        
        return roles.includes("administrador") || roles.includes("mantenimiento");
      });

      return assignableUsers as UserWithRoles[];
    } catch (error: any) {
      console.error("Error in getUsersForAssignment:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkPermission,
    getUsers,
    getUsersForAssignment,
    getUserById,
    createUser,
    updateUser,
    updateUserRoles,
    deleteUser,
    resendConfirmation,
    toggleUserStatus,
    toggleBlockUser,
    changeUserEmail,
  };
};
