import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserPresence {
  user_id: string;
  username: string;
  online_at: string;
}

export const useActiveUsers = (channelName: string = 'red-social') => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(channelName);

    // Get user profile info
    const setupPresence = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, name")
        .eq("user_id", user.id)
        .single();

      const userStatus: UserPresence = {
        user_id: user.id,
        username: profile?.username || profile?.name || "Usuario",
        online_at: new Date().toISOString(),
      };

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<UserPresence>();
          const users = Object.values(state).flat();
          setActiveUsers(users);
          setActiveCount(users.length);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('User left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track(userStatus);
          }
        });
    };

    setupPresence();

    return () => {
      channel.unsubscribe();
    };
  }, [user, channelName]);

  return { activeUsers, activeCount };
};
