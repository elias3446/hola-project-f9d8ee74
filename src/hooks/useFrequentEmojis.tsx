import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const LOCAL_STORAGE_KEY = "user_emoji_reactions";
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface LocalReaction {
  emoji: string;
  count: number;
}

// Helper function to add reaction to local storage (can be called from anywhere)
export const addReactionToLocal = (emoji: string) => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const reactions: LocalReaction[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = reactions.findIndex(r => r.emoji === emoji);
    if (existingIndex >= 0) {
      reactions[existingIndex].count++;
    } else {
      reactions.push({ emoji, count: 1 });
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reactions));
  } catch (error) {
    console.error("Error adding local reaction:", error);
  }
};

export const useFrequentEmojis = () => {
  const [frequentEmojis, setFrequentEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  // Load from local storage on mount
  useEffect(() => {
    const loadFromLocal = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const reactions: LocalReaction[] = JSON.parse(stored);
          const topEmojis = reactions
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(r => r.emoji);
          setFrequentEmojis(topEmojis);
        }
      } catch (error) {
        console.error("Error loading local emoji reactions:", error);
      }
    };

    loadFromLocal();
  }, []);

  // Sync with database and update local storage
  const syncWithDatabase = useCallback(async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mensaje_reacciones")
        .select("emoji")
        .eq("user_id", profile.id);

      if (error) throw error;

      // Count emoji occurrences
      const emojiCounts = (data || []).reduce((acc, { emoji }) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to array format
      const reactions: LocalReaction[] = Object.entries(emojiCounts).map(
        ([emoji, count]) => ({ emoji, count })
      );

      // Store in localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reactions));

      // Update state with top 10
      const topEmojis = reactions
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(r => r.emoji);

      setFrequentEmojis(topEmojis);
    } catch (error) {
      console.error("Error syncing emoji reactions:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Add reaction locally
  const addReactionLocal = useCallback((emoji: string) => {
    addReactionToLocal(emoji);
    
    // Update state
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const reactions: LocalReaction[] = stored ? JSON.parse(stored) : [];
      const topEmojis = reactions
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(r => r.emoji);
      setFrequentEmojis(topEmojis);
    } catch (error) {
      console.error("Error updating frequent emojis state:", error);
    }
  }, []);

  return { 
    frequentEmojis, 
    loading, 
    refetch: syncWithDatabase,
    addReactionLocal 
  };
};
