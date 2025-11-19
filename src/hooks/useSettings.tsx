import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

type Settings = Database["public"]["Tables"]["settings"]["Row"];

export const useSettings = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", profile.id)
          .single();

        if (error && error.code === "PGRST116") {
          // No settings found, create default
          const { data: newSettings, error: insertError } = await supabase
            .from("settings")
            .insert({
              user_id: profile.id,
              real_time_tracking_enabled: true,
              enabled: true,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newSettings);
        } else if (error) {
          throw error;
        } else {
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to settings changes
    const channel = supabase
      .channel(`settings-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setSettings(payload.new as Settings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("settings")
        .update(updates)
        .eq("user_id", profile.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  };

  return { settings, loading, updateSettings };
};
