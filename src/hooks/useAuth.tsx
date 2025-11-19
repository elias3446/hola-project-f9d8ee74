import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Settings = Database["public"]["Tables"]["settings"]["Row"];
type UserRoles = Database["public"]["Tables"]["user_roles"]["Row"];

export type UserData = {
  profile: Profile;
  settings: Settings | null;
  roles: UserRoles | null;
};

// Global handler for auth errors
let authErrorHandler: ((error: any) => void) | null = null;

export const setGlobalAuthErrorHandler = (handler: (error: any) => void) => {
  authErrorHandler = handler;
};

export const handleAuthError = (error: any) => {
  if (authErrorHandler) {
    authErrorHandler(error);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const navigate = useNavigate();

  const handleInvalidSession = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    navigate("/auth", { 
      state: { 
        message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente." 
      } 
    });
  }, [navigate]);

  useEffect(() => {
    // Set global auth error handler
    setGlobalAuthErrorHandler((error: any) => {
      if (error?.message?.includes("User from sub claim in JWT does not exist") ||
          error?.code === "user_not_found" ||
          error?.status === 403) {
        handleInvalidSession();
      }
    });

    return () => {
      setGlobalAuthErrorHandler(() => {});
    };
  }, [handleInvalidSession]);

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          handleAuthError(profileError);
          setProfile(null);
          setSettings(null);
          setRoles(null);
          return;
        }
        
        setProfile(profileData ?? null);
        setMustChangePassword(profileData?.must_change_password || false);

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", profileData.id)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error fetching settings:", settingsError);
        } else if (!settingsData && profileData.id) {
          // Create default settings if none exist
          const { data: newSettings } = await supabase
            .from("settings")
            .insert({
              user_id: profileData.id,
              real_time_tracking_enabled: true,
              enabled: true,
            })
            .select()
            .single();
          setSettings(newSettings);
        } else {
          setSettings(settingsData);
        }

        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", profileData.id)
          .single();

        if (rolesError && rolesError.code !== "PGRST116") {
          console.error("Error fetching roles:", rolesError);
        } else {
          setRoles(rolesData);
        }
      } catch (e: any) {
        console.error("Error fetching user data:", e);
        handleAuthError(e);
        setProfile(null);
        setSettings(null);
        setRoles(null);
      }
    };

    // Set up auth state listener FIRST (sync callback to avoid deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT' || !session) {
          // Limpiar datos de rastreo del localStorage al cerrar sesión
          localStorage.removeItem('liveTracking_isActive');
          localStorage.removeItem('liveTracking_history');
          localStorage.removeItem('liveTracking_notified');
          
          setProfile(null);
          setSettings(null);
          setRoles(null);
          setMustChangePassword(false);
          navigate("/auth");
        } else if (session?.user) {
          // Defer any Supabase calls outside the callback
          setTimeout(() => {
            fetchUserData(session.user!.id);
          }, 0);
        } else {
          setProfile(null);
          setSettings(null);
          setRoles(null);
          setMustChangePassword(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          return fetchUserData(session.user.id);
        }
      })
      .catch((err) => {
        console.error("getSession error:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, handleInvalidSession]);

  // Suscripción en tiempo real para detectar cambios en el perfil
  useEffect(() => {
    if (!profile?.id || !user?.id) return;

    const channel = supabase
      .channel(`profile-changes-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          
          // Si el user_id cambió o se volvió NULL, el usuario fue desconectado
          if (!updatedProfile.user_id || updatedProfile.user_id !== user.id) {
            console.log('Sesión invalidada por cambio en perfil');
            handleInvalidSession();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, user?.id, handleInvalidSession]);

  const signOut = async () => {
    try {
      // Limpiar datos de rastreo del localStorage
      localStorage.removeItem('liveTracking_isActive');
      localStorage.removeItem('liveTracking_history');
      localStorage.removeItem('liveTracking_notified');
      
      // Registrar logout en auditoría antes de cerrar sesión
      await supabase.rpc('audit_logout');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Sesión cerrada exitosamente");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar sesión");
    }
  };

  const changeOwnEmail = async (
    currentPassword: string,
    newEmail: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      if (!profile?.id || !profile?.email) {
        toast.error("No se pudo obtener la información del perfil");
        return false;
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("La contraseña actual es incorrecta");
        return false;
      }

      // Paso 1: Preparar el cambio y eliminar usuario viejo
      const { error: changeError } = await supabase.rpc(
        "complete_email_change",
        {
          p_profile_id: profile.id,
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
            existing_profile_id: profile.id,
            password: newPassword,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("No se pudo crear el nuevo usuario");

      // Paso 3: Reconectar el perfil con el nuevo usuario
      const { error: reconnectError } = await supabase.rpc(
        "reconnect_profile_after_email_change",
        {
          p_profile_id: profile.id,
          p_new_user_id: signUpData.user.id,
          p_new_email: newEmail,
        }
      );

      if (reconnectError) throw reconnectError;

      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el email");
      return false;
    }
  };

  return { user, session, profile, settings, roles, loading, mustChangePassword, signOut, changeOwnEmail };
};
