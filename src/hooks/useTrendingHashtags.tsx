import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TrendingHashtag {
  id: string;
  nombre: string;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

export type TimeFilter = '24h' | '7d' | '30d' | 'all';

export const useTrendingHashtags = (limit: number = 10, timeFilter: TimeFilter = '7d') => {
  const { user } = useAuth();
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingHashtags = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate time range based on filter
      const startDate = new Date();
      switch (timeFilter) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'all':
          startDate.setFullYear(startDate.getFullYear() - 10); // Far back in time
          break;
      }

      // Get hashtags with usage count in the time period
      const { data: hashtagUsage, error } = await supabase
        .from("publicacion_hashtags")
        .select(`
          hashtag_id,
          hashtags!inner (
            id,
            nombre,
            created_at,
            updated_at
          )
        `)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Count usage per hashtag
      const hashtagCounts = new Map<string, { hashtag: any; count: number }>();
      
      hashtagUsage?.forEach((item: any) => {
        const hashtagId = item.hashtag_id;
        const hashtag = item.hashtags;
        
        if (!hashtagCounts.has(hashtagId)) {
          hashtagCounts.set(hashtagId, { hashtag, count: 0 });
        }
        hashtagCounts.get(hashtagId)!.count++;
      });

      // Convert to array and sort
      const trending = Array.from(hashtagCounts.values())
        .map(({ hashtag, count }) => ({
          id: hashtag.id,
          nombre: hashtag.nombre,
          uso_count: count,
          created_at: hashtag.created_at,
          updated_at: hashtag.updated_at,
        }))
        .sort((a, b) => b.uso_count - a.uso_count)
        .slice(0, limit);

      setTrendingHashtags(trending);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
    } finally {
      setLoading(false);
    }
  }, [limit, timeFilter]);

  useEffect(() => {
    if (user) {
      fetchTrendingHashtags();
    }
  }, [user, fetchTrendingHashtags]);

  // Real-time subscription for hashtag updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('hashtags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashtags'
        },
        () => {
          fetchTrendingHashtags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    trendingHashtags,
    loading,
    refreshHashtags: fetchTrendingHashtags,
  };
};
