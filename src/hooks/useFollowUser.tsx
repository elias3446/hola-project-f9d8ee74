import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export const useFollowUser = () => {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);

  const followUser = async (targetUserId: string) => {
    if (!profile?.id) {
      toast.error("Debes iniciar sesión para seguir usuarios");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("relaciones").insert({
        user_id: targetUserId,
        seguidor_id: profile.id,
        tipo: "seguidor",
        estado: "aceptado",
      });

      if (error) throw error;
      toast.success("Ahora sigues a este usuario");
    } catch (error: any) {
      console.error("Error following user:", error);
      if (error.code === "23505") {
        toast.error("Ya sigues a este usuario");
      } else {
        toast.error("Error al seguir usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!profile?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("relaciones")
        .delete()
        .eq("user_id", targetUserId)
        .eq("seguidor_id", profile.id);

      if (error) throw error;
      toast.success("Has dejado de seguir a este usuario");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Error al dejar de seguir");
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async (targetUserId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const { data, error } = await supabase
        .from("relaciones")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("seguidor_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };

  return {
    followUser,
    unfollowUser,
    checkIfFollowing,
    loading,
  };
};
