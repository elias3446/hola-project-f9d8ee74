import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface UserSuggestion {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  isFollowing: boolean;
}

export const useUserSuggestionsReal = (limit: number = 5) => {
  const { profile } = useProfile();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!profile?.id) return;

      setLoading(true);
      try {
        // Get users that the current user is NOT following
        const { data: followingData } = await supabase
          .from("relaciones")
          .select("user_id")
          .eq("seguidor_id", profile.id);

        const followingIds = followingData?.map(r => r.user_id) || [];

        // Get random users excluding current user and already followed users
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, username, name, avatar")
          .eq("estado", "activo")
          .is("deleted_at", null)
          .neq("id", profile.id)
          .not("id", "in", `(${followingIds.length > 0 ? followingIds.join(",") : "'00000000-0000-0000-0000-000000000000'"})`)
          .limit(limit);

        if (usersError) throw usersError;

        const suggestionsWithFollowStatus = (usersData || []).map(user => ({
          ...user,
          isFollowing: false,
        }));

        setSuggestions(suggestionsWithFollowStatus);
      } catch (error) {
        console.error("Error fetching user suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [profile?.id, limit]);

  const updateFollowStatus = (userId: string, isFollowing: boolean) => {
    setSuggestions(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
  };

  const removeFromSuggestions = (userId: string) => {
    setSuggestions(prev => prev.filter(user => user.id !== userId));
  };

  return {
    suggestions,
    loading,
    updateFollowStatus,
    removeFromSuggestions,
  };
};
