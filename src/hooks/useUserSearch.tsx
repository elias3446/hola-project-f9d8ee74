import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SearchedUser {
  id: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
}

export const useUserSearch = (searchTerm: string) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!profile?.id || !searchTerm || searchTerm.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, name, avatar")
          .eq("estado", "activo")
          .is("deleted_at", null)
          .or(`username.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, profile?.id]);

  return { users, loading };
};
