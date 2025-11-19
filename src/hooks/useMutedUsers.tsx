import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useMutedUsers = () => {
  const { user } = useAuth();
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMutedUserIds([]);
      setLoading(false);
      return;
    }

    fetchMutedUsers();
  }, [user]);

  const fetchMutedUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get current user's profile ID
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) return;

      // Get muted users
      const { data, error } = await supabase
        .from("usuarios_silenciados")
        .select("silenciado_user_id")
        .eq("user_id", profileData.id);

      if (error) throw error;

      setMutedUserIds(data?.map((item) => item.silenciado_user_id) || []);
    } catch (error) {
      console.error("Error fetching muted users:", error);
    } finally {
      setLoading(false);
    }
  };

  const muteUser = async (silenciadoUserId: string) => {
    if (!user) return;

    try {
      // Get current user's profile ID
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) throw new Error("Profile not found");

      // Insert muted user
      const { error } = await supabase
        .from("usuarios_silenciados")
        .insert({
          user_id: profileData.id,
          silenciado_user_id: silenciadoUserId,
        });

      if (error) throw error;

      // Update local state
      setMutedUserIds((prev) => [...prev, silenciadoUserId]);
      toast.success("Usuario silenciado exitosamente");
    } catch (error: any) {
      console.error("Error muting user:", error);
      if (error.code === "23505") {
        toast.error("Este usuario ya está silenciado");
      } else {
        toast.error("Error al silenciar usuario");
      }
    }
  };

  const unmuteUser = async (silenciadoUserId: string) => {
    if (!user) return;

    try {
      // Get current user's profile ID
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) throw new Error("Profile not found");

      // Delete muted user
      const { error } = await supabase
        .from("usuarios_silenciados")
        .delete()
        .eq("user_id", profileData.id)
        .eq("silenciado_user_id", silenciadoUserId);

      if (error) throw error;

      // Update local state
      setMutedUserIds((prev) => prev.filter((id) => id !== silenciadoUserId));
      toast.success("Usuario desilenciado exitosamente");
    } catch (error) {
      console.error("Error unmuting user:", error);
      toast.error("Error al desilenciar usuario");
    }
  };

  const isUserMuted = (userId: string): boolean => {
    return mutedUserIds.includes(userId);
  };

  return {
    mutedUserIds,
    loading,
    muteUser,
    unmuteUser,
    isUserMuted,
    refreshMutedUsers: fetchMutedUsers,
  };
};
