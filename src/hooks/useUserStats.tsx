import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export const useUserStats = (userId?: string) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const profileId = userId;

  useEffect(() => {
    if (!user || !profileId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Get posts count
        const { count: postsCount } = await supabase
          .from("publicaciones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileId)
          .eq("activo", true)
          .is("deleted_at", null);

        // Get followers count (users following this profile)
        const { count: followersCount } = await supabase
          .from("relaciones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileId)
          .eq("estado", "aceptado");

        // Get following count (users this profile is following)
        const { count: followingCount } = await supabase
          .from("relaciones")
          .select("*", { count: "exact", head: true })
          .eq("seguidor_id", profileId)
          .eq("estado", "aceptado");

        setStats({
          postsCount: postsCount || 0,
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time updates for posts
    const postsChannel = supabase
      .channel(`user-posts-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "publicaciones",
          filter: `user_id=eq.${profileId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for relationships
    const relationsChannel = supabase
      .channel(`user-relations-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "relaciones",
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          
          // Only refetch if this user is involved
          if (
            newRow?.user_id === profileId ||
            newRow?.seguidor_id === profileId ||
            oldRow?.user_id === profileId ||
            oldRow?.seguidor_id === profileId
          ) {
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(relationsChannel);
    };
  }, [user, profileId]);

  return { stats, loading };
};
