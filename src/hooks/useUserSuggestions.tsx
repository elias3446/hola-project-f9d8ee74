import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSuggestion {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

export const useUserSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 1) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, name, avatar")
          .or(`username.ilike.${query}%,name.ilike.${query}%`)
          .eq("estado", "activo")
          .is("deleted_at", null)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error("Error fetching user suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { suggestions, loading };
};
