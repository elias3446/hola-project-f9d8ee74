import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useHashtagSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<Array<{ id: string; nombre: string; uso_count: number }>>([]);
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
          .from("hashtags")
          .select("id, nombre, uso_count")
          .ilike("nombre", `${query}%`)
          .order("uso_count", { ascending: false })
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error("Error fetching hashtag suggestions:", error);
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
