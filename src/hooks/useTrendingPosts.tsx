import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TrendingPost {
  id: string;
  contenido: string;
  imagenes: string[] | null;
  created_at: string;
  author: {
    name: string;
    avatar: string | null;
    username: string;
  };
  likes: number;
  comments: number;
  views: number;
  shares: number;
  trendingScore: number;
}

export const useTrendingPosts = (limit: number = 5, filterByCurrentUser: boolean = false, specificUserId?: string, timeRange: '24h' | '7d' | '30d' | 'all' = '30d') => {
  const { user, profile } = useAuth();
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTimeout = useRef<number | null>(null);
  // Mantiene la lista visible actual para recálculos rápidos
  const trendingRef = useRef<TrendingPost[]>([]);

  const fetchTrendingPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch recent posts based on time range
      const cutoffDate = new Date();
      switch (timeRange) {
        case '24h':
          cutoffDate.setHours(cutoffDate.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          break;
        case 'all':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 10); // Far back in time
          break;
      }

      let query = supabase
        .from("publicaciones")
        .select(`
          id,
          contenido,
          imagenes,
          created_at,
          user_id,
          profiles!publicaciones_user_id_fkey (
            name,
            avatar,
            username
          )
        `)
        .eq("activo", true)
        .is("deleted_at", null)
        .gte("created_at", cutoffDate.toISOString());

      // Filter by specific user if provided, otherwise by current user if requested
      if (specificUserId) {
        query = query.eq("user_id", specificUserId);
      } else if (filterByCurrentUser && profile?.id) {
        query = query.eq("user_id", profile.id);
      }

      const { data: publicaciones, error: postsError } = await query
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Calculate trending score for each post
      const postsWithScores = await Promise.all(
        (publicaciones || []).map(async (post) => {
          // Count likes
          const { count: likesCount } = await supabase
            .from("interacciones")
            .select("*", { count: "exact", head: true })
            .eq("publicacion_id", post.id)
            .eq("tipo_interaccion", "me_gusta");

          // Count comments
          const { count: commentsCount } = await supabase
            .from("comentarios")
            .select("*", { count: "exact", head: true })
            .eq("publicacion_id", post.id)
            .eq("activo", true)
            .is("deleted_at", null);

          // Count views
          const { count: viewsCount } = await supabase
            .from("publicacion_vistas")
            .select("*", { count: "exact", head: true })
            .eq("publicacion_id", post.id);

          // Count shares
          const { count: sharesCount } = await supabase
            .from("publicacion_compartidos")
            .select("*", { count: "exact", head: true })
            .eq("publicacion_id", post.id);

          // Trending score formula: simple sum of engagement metrics
          const likes = likesCount || 0;
          const comments = commentsCount || 0;
          const views = viewsCount || 0;
          const shares = sharesCount || 0;
          const trendingScore = likes + comments + views + shares;

          return {
            id: post.id,
            contenido: post.contenido || "",
            imagenes: post.imagenes,
            created_at: post.created_at,
            author: {
              name: post.profiles?.name || "Usuario",
              avatar: post.profiles?.avatar || null,
              username: post.profiles?.username || "usuario",
            },
            likes,
            comments,
            views,
            shares,
            trendingScore,
          };
        })
      );

      // Sort by trending score and limit
      const sortedPosts = postsWithScores
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      setTrendingPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching trending posts:", error);
    } finally {
      setLoading(false);
    }
  }, [limit, filterByCurrentUser, profile, specificUserId, timeRange]);

  const upsertTrendingPost = useCallback(async (postId: string) => {
    try {
      // Fetch updated stats for specific post
      const [likesResult, commentsResult, viewsResult, sharesResult] = await Promise.all([
        supabase
          .from("interacciones")
          .select("*", { count: "exact", head: true })
          .eq("publicacion_id", postId)
          .eq("tipo_interaccion", "me_gusta"),
        supabase
          .from("comentarios")
          .select("*", { count: "exact", head: true })
          .eq("publicacion_id", postId)
          .eq("activo", true)
          .is("deleted_at", null),
        supabase
          .from("publicacion_vistas")
          .select("*", { count: "exact", head: true })
          .eq("publicacion_id", postId),
        supabase
          .from("publicacion_compartidos")
          .select("*", { count: "exact", head: true })
          .eq("publicacion_id", postId)
      ]);

      const likes = likesResult.count || 0;
      const comments = commentsResult.count || 0;
      const views = viewsResult.count || 0;
      const shares = sharesResult.count || 0;

      // Check if post exists in current trending list
      let existingPost: TrendingPost | undefined;
      setTrendingPosts(prev => {
        existingPost = prev.find(p => p.id === postId);
        return prev;
      });

      // If not in list, fetch basic post data
      let postMeta: { id: string; contenido: string; imagenes: string[] | null; created_at: string; author: { name: string; avatar: string | null; username: string; } } | null = null;
      if (!existingPost) {
        const { data: postRow } = await supabase
          .from("publicaciones")
          .select(`
            id,
            contenido,
            imagenes,
            created_at,
            profiles!publicaciones_user_id_fkey (
              name,
              avatar,
              username
            )
          `)
          .eq("id", postId)
          .maybeSingle();

        if (postRow) {
          postMeta = {
            id: postRow.id,
            contenido: postRow.contenido || "",
            imagenes: postRow.imagenes,
            created_at: postRow.created_at,
            author: {
              name: postRow.profiles?.name || "Usuario",
              avatar: postRow.profiles?.avatar || null,
              username: postRow.profiles?.username || "usuario",
            },
          };
        }
      }

      // Compute score using simple sum of engagement metrics
      const trendingScore = likes + comments + views + shares;

      setTrendingPosts(prev => {
        const idx = prev.findIndex(p => p.id === postId);
        let next = [...prev];
        if (idx >= 0) {
          // Update existing
          next[idx] = {
            ...next[idx],
            likes,
            comments,
            views,
            shares,
            trendingScore,
          };
        } else if (postMeta) {
          // Consider inserting if qualifies
          const candidate: TrendingPost = {
            id: postMeta.id,
            contenido: postMeta.contenido,
            imagenes: postMeta.imagenes,
            created_at: postMeta.created_at,
            author: postMeta.author,
            likes,
            comments,
            views,
            shares,
            trendingScore,
          };

          if (next.length < limit || trendingScore > (next[next.length - 1]?.trendingScore || -Infinity)) {
            next.push(candidate);
          }
        }

        // Resort and enforce limit
        next = next.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
        return next;
      });
    } catch (error) {
      console.error('[TRENDING] Error upserting trending post:', error);
    }
  }, [limit]);

  // Recalcula los contadores (likes, comentarios, vistas) y el score
  // solo para las publicaciones actualmente visibles (sin recargar lista)
  const recalcVisibleTrending = useCallback(async () => {
    try {
      const current = trendingRef.current;
      if (!current.length) return;

      const recomputed = await Promise.all(
        current.map(async (p) => {
          const [likesResult, commentsResult, viewsResult, sharesResult] = await Promise.all([
            supabase
              .from("interacciones")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", p.id)
              .eq("tipo_interaccion", "me_gusta"),
            supabase
              .from("comentarios")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", p.id)
              .eq("activo", true)
              .is("deleted_at", null),
            supabase
              .from("publicacion_vistas")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", p.id),
            supabase
              .from("publicacion_compartidos")
              .select("*", { count: "exact", head: true })
              .eq("publicacion_id", p.id),
          ]);

          const likes = likesResult.count || 0;
          const comments = commentsResult.count || 0;
          const views = viewsResult.count || 0;
          const shares = sharesResult.count || 0;

          const trendingScore = likes + comments + views + shares;

          return { ...p, likes, comments, views, shares, trendingScore } as TrendingPost;
        })
      );

      setTrendingPosts(recomputed.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit));
    } catch (err) {
      console.error('[TRENDING] Error recalculating visible trending:', err);
    }
  }, [limit]);

  useEffect(() => {
    if (user && (!filterByCurrentUser || profile || specificUserId)) {
      fetchTrendingPosts();
    }
  }, [user, profile, fetchTrendingPosts, filterByCurrentUser, specificUserId, timeRange]);

  // Mantener referencia sincronizada para recálculos localizados
  useEffect(() => {
    trendingRef.current = trendingPosts;
  }, [trendingPosts]);

  // Real-time subscription for interactions (likes)
  useEffect(() => {
    if (!user) return;

    const channelName = `trending-likes-${Math.random().toString(36).substring(7)}`;
    const likesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interacciones'
        },
        (payload) => {
          console.log('[TRENDING] Interaccion detected:', payload);
          const ev = (payload as any)?.eventType;
          const newRow = (payload as any)?.new as any;
          const oldRow = (payload as any)?.old as any;

          const publicacionId = newRow?.publicacion_id || oldRow?.publicacion_id;
          const tipo = newRow?.tipo_interaccion || oldRow?.tipo_interaccion;

          // Si no podemos determinar la publicación (DELETE sin datos), recalc visible y salimos
          if (!publicacionId) {
            recalcVisibleTrending();
            return;
          }

          if (tipo !== 'me_gusta') {
            // No afecta likes directamente; asegurar consistencia
            upsertTrendingPost(publicacionId);
            return;
          }

          const delta = ev === 'INSERT' ? 1 : ev === 'DELETE' ? -1 : 0;

          if (delta !== 0) {
            setTrendingPosts(prev => {
              const next = [...prev];
              const idx = next.findIndex(p => p.id === publicacionId);
              if (idx >= 0) {
                const p = next[idx];
                const likes = Math.max(0, (p.likes || 0) + delta);
                const comments = p.comments || 0;
                const views = p.views || 0;
                const shares = p.shares || 0;
                const trendingScore = likes + comments + views + shares;
                next[idx] = { ...p, likes, trendingScore };
                return next.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
              }
              return prev;
            });
          }

          // Re-sync para asegurar consistencia y permitir nuevas entradas
          upsertTrendingPost(publicacionId);
        }
      )
      .subscribe((status) => {
        console.log('[TRENDING] Likes channel status:', status);
      });

    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [user, upsertTrendingPost]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!user) return;

    const channelName = `trending-comments-${Math.random().toString(36).substring(7)}`;
    const commentsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comentarios'
        },
        (payload) => {
          console.log('[TRENDING] Comment detected:', payload);
          const publicacionId = (payload.new as any)?.publicacion_id || (payload.old as any)?.publicacion_id;
          if (publicacionId) {
            upsertTrendingPost(publicacionId);
          }
        }
      )
      .subscribe((status) => {
        console.log('[TRENDING] Comments channel status:', status);
      });

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [user, upsertTrendingPost]);

  // Real-time subscription for views
  useEffect(() => {
    if (!user) return;

    const channelName = `trending-views-${Math.random().toString(36).substring(7)}`;
    const viewsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'publicacion_vistas'
        },
        (payload) => {
          console.log('[TRENDING] View detected:', payload);
          const newRow = (payload as any)?.new as any;
          const publicacionId = newRow?.publicacion_id;
          if (!publicacionId) return;

          setTrendingPosts(prev => {
            const next = [...prev];
            const idx = next.findIndex(p => p.id === publicacionId);
            if (idx >= 0) {
              const p = next[idx];
              const views = (p.views || 0) + 1;
              const likes = p.likes || 0;
              const comments = p.comments || 0;
              const shares = p.shares || 0;
              const trendingScore = likes + comments + views + shares;
              next[idx] = { ...p, views, trendingScore };
              return next.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
            }
            return prev;
          });

          // Re-sync de seguridad
          upsertTrendingPost(publicacionId);
        }
      )
      .subscribe((status) => {
        console.log('[TRENDING] Views channel status:', status);
      });

    return () => {
      supabase.removeChannel(viewsChannel);
    };
  }, [user, upsertTrendingPost]);

  // Real-time subscription for new posts - refetch all for new posts
  useEffect(() => {
    if (!user) return;

    const channelName = `trending-posts-${Math.random().toString(36).substring(7)}`;
    const postsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'publicaciones'
        },
        (payload) => {
          console.log('[TRENDING] New post detected:', payload);
          const newId = (payload.new as any)?.id;
          if (newId) {
            upsertTrendingPost(newId);
          }
        }
      )
      .subscribe((status) => {
        console.log('[TRENDING] Posts channel status:', status);
      });

    return () => {
      if (refreshTimeout.current) {
        window.clearTimeout(refreshTimeout.current);
      }
      supabase.removeChannel(postsChannel);
    };
  }, [user, upsertTrendingPost]);

  return {
    trendingPosts,
    loading,
    refreshTrending: fetchTrendingPosts,
  };
};
