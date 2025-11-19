import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GroupHistoryEvent {
  id: string;
  conversacion_id: string;
  action_type: 'member_added' | 'member_removed' | 'member_promoted' | 'member_demoted' | 'group_created' | 'group_renamed';
  performed_by: string | null;
  affected_user_id: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  performer?: {
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  affected_user?: {
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
}

export const useGroupHistory = (conversationId: string | null) => {
  const { profile } = useAuth();
  const [history, setHistory] = useState<GroupHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!conversationId || !profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: historyData, error } = await supabase
        .from("group_history")
        .select("*")
        .eq("conversacion_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      historyData.forEach(event => {
        if (event.performed_by) userIds.add(event.performed_by);
        if (event.affected_user_id) userIds.add(event.affected_user_id);
      });

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, avatar")
        .in("id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine data
      const eventsWithUsers = historyData.map(event => ({
        ...event,
        action_type: event.action_type as GroupHistoryEvent['action_type'],
        performer: event.performed_by ? profilesMap.get(event.performed_by) : undefined,
        affected_user: event.affected_user_id ? profilesMap.get(event.affected_user_id) : undefined,
      })) as GroupHistoryEvent[];

      setHistory(eventsWithUsers);
    } catch (error) {
      console.error("Error fetching group history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [conversationId, profile?.id]);

  // Real-time updates
  useEffect(() => {
    if (!conversationId || !profile?.id) return;

    const channel = supabase
      .channel(`group-history-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_history",
          filter: `conversacion_id=eq.${conversationId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profile?.id]);

  const logEvent = async (
    action_type: GroupHistoryEvent['action_type'],
    affected_user_id?: string | null,
    old_value?: string | null,
    new_value?: string | null
  ) => {
    if (!conversationId || !profile?.id) return false;

    try {
      const { error } = await supabase
        .from("group_history")
        .insert({
          conversacion_id: conversationId,
          action_type,
          performed_by: profile.id,
          affected_user_id: affected_user_id || null,
          old_value: old_value || null,
          new_value: new_value || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error logging group event:", error);
      return false;
    }
  };

  return {
    history,
    loading,
    logEvent,
    refetch: fetchHistory,
  };
};
