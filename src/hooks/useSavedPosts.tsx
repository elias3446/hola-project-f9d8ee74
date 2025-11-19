import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
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
  isLiked: boolean;
  isSaved: boolean;
}

export const useSavedPosts = () => {
  const { profile } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPosts = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Fetch saved post IDs
      const { data: savedPostIds, error: savedError } = await supabase
        .from("publicacion_guardadas")
        .select("publicacion_id")
        .eq("user_id", profile.id);

      if (savedError) throw savedError;

      if (!savedPostIds || savedPostIds.length === 0) {
        setSavedPosts([]);
        return;
      }

      const postIds = savedPostIds.map((sp) => sp.publicacion_id);

      // Fetch posts with author info
      const { data: publicaciones, error: postsError } = await supabase
        .from("publicaciones")
        .select(`
          id,
          user_id,
          contenido,
          imagenes,
          created_at,
          profiles!publicaciones_user_id_fkey (
            name,
            avatar,
            username
          )
        `)
        .in("id", postIds)
        .eq("activo", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch interactions count and user's likes
      const postsWithStats = await Promise.all(
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

          // Check if current user liked this post
          const { data: userLike } = await supabase
            .from("interacciones")
            .select("id")
            .eq("publicacion_id", post.id)
            .eq("user_id", profile.id)
            .eq("tipo_interaccion", "me_gusta")
            .maybeSingle();

          return {
            id: post.id,
            user_id: post.user_id,
            contenido: post.contenido || "",
            imagenes: post.imagenes,
            created_at: post.created_at,
            author: {
              name: post.profiles?.name || "Usuario",
              avatar: post.profiles?.avatar || null,
              username: post.profiles?.username || "usuario",
            },
            likes: likesCount || 0,
            comments: commentsCount || 0,
            views: viewsCount || 0,
            shares: sharesCount || 0,
            isLiked: !!userLike,
            isSaved: true, // All posts in this list are saved
          };
        })
      );

      setSavedPosts(postsWithStats);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      toast.error("Error al cargar publicaciones guardadas");
    } finally {
      setLoading(false);
    }
  };

  const toggleSavePost = async (postId: string) => {
    if (!profile) return;

    try {
      // Check if already saved
      const { data: existingSave } = await supabase
        .from("publicacion_guardadas")
        .select("id")
        .eq("publicacion_id", postId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingSave) {
        // Unsave
        const { error } = await supabase
          .from("publicacion_guardadas")
          .delete()
          .eq("id", existingSave.id);

        if (error) throw error;
        
        toast.success("Publicación eliminada de guardados");
        setSavedPosts((posts) => posts.filter((post) => post.id !== postId));
      } else {
        // Save
        const { error } = await supabase.from("publicacion_guardadas").insert({
          publicacion_id: postId,
          user_id: profile.id,
        });

        if (error) throw error;
        
        toast.success("Publicación guardada");
        await fetchSavedPosts();
      }
    } catch (error) {
      console.error("Error toggling save post:", error);
      toast.error("Error al guardar publicación");
    }
  };

  const checkIfSaved = async (postId: string): Promise<boolean> => {
    if (!profile) return false;

    try {
      const { data } = await supabase
        .from("publicacion_guardadas")
        .select("id")
        .eq("publicacion_id", postId)
        .eq("user_id", profile.id)
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSavedPosts();
    }
  }, [profile]);

  // Real-time subscription for saved posts changes
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('saved-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'publicacion_guardadas',
          filter: `user_id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Saved posts list changed:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Refetch to get the new saved post with all its data
            await fetchSavedPosts();
          } else if (payload.eventType === 'DELETE') {
            const postId = payload.old.publicacion_id;
            setSavedPosts((posts) => posts.filter((post) => post.id !== postId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return {
    savedPosts,
    loading,
    toggleSavePost,
    checkIfSaved,
    refetch: fetchSavedPosts,
  };
};
