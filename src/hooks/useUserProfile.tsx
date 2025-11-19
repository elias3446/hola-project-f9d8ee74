import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
}

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

type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

export const useUserProfile = (username: string) => {
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>("none");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, username, avatar, bio")
        .eq("username", username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch relationship status if not own profile
      if (currentUserProfile && profileData.id !== currentUserProfile.id) {
        await fetchRelationshipStatus(profileData.id);
      }

      // Fetch user posts
      await fetchPosts(profileData.id);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationshipStatus = async (targetUserId: string) => {
    if (!currentUserProfile) return;

    try {
      // Check if there's a relationship
      const { data: relationship } = await supabase
        .from("relaciones")
        .select("*")
        .or(`and(user_id.eq.${currentUserProfile.id},seguidor_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},seguidor_id.eq.${currentUserProfile.id})`)
        .single();

      if (!relationship) {
        setRelationshipStatus("none");
        return;
      }

      if (relationship.estado === "aceptado") {
        setRelationshipStatus("friends");
      } else if (relationship.estado === "pendiente") {
        // Check who sent the request
        if (relationship.seguidor_id === currentUserProfile.id) {
          setRelationshipStatus("pending_sent");
        } else {
          setRelationshipStatus("pending_received");
        }
      }
    } catch (error) {
      console.error("Error fetching relationship:", error);
      setRelationshipStatus("none");
    }
  };

  const fetchPosts = async (userId: string) => {
    try {
      console.log('[useUserProfile] Fetching posts for userId:', userId);
      console.log('[useUserProfile] Current profile ID:', currentUserProfile?.id);
      
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
        .eq("user_id", userId)
        .eq("activo", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Get current user's profile ID
      const currentProfileId = currentUserProfile?.id;

      if (!currentProfileId) {
        console.warn('[useUserProfile] No current profile ID available');
      }

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
          const { data: userLike } = currentProfileId
            ? await supabase
                .from("interacciones")
                .select("id")
                .eq("publicacion_id", post.id)
                .eq("user_id", currentProfileId)
                .eq("tipo_interaccion", "me_gusta")
                .maybeSingle()
            : { data: null };

          // Check if current user saved this post
          const { data: userSaved, error: savedError } = currentProfileId
            ? await supabase
                .from("publicacion_guardadas")
                .select("id")
                .eq("publicacion_id", post.id)
                .eq("user_id", currentProfileId)
                .maybeSingle()
            : { data: null, error: null };

          if (savedError) {
            console.error('[useUserProfile] Error checking saved status:', savedError);
          }

          const isSaved = !!userSaved;
          console.log(`[useUserProfile] Post ${post.id.substring(0, 8)} saved status:`, isSaved, 'userSaved:', userSaved);

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
            isSaved: isSaved,
          };
        })
      );

      console.log('[useUserProfile] Posts with stats:', postsWithStats.length, 'posts');
      setPosts(postsWithStats);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Error al cargar las publicaciones");
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUserProfile || !profile) return;

    try {
      const { error } = await supabase.from("relaciones").insert({
        user_id: profile.id,
        seguidor_id: currentUserProfile.id,
        tipo: "amigo",
        estado: "pendiente",
      });

      if (error) throw error;

      toast.success("Solicitud de amistad enviada");
      setRelationshipStatus("pending_sent");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Error al enviar solicitud de amistad");
    }
  };

  const acceptFriendRequest = async () => {
    if (!currentUserProfile || !profile) return;

    try {
      const { error } = await supabase
        .from("relaciones")
        .update({ estado: "aceptado" })
        .eq("user_id", currentUserProfile.id)
        .eq("seguidor_id", profile.id);

      if (error) throw error;

      toast.success("Solicitud aceptada");
      setRelationshipStatus("friends");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Error al aceptar solicitud");
    }
  };

  const rejectFriendRequest = async () => {
    if (!currentUserProfile || !profile) return;

    try {
      const { error } = await supabase
        .from("relaciones")
        .delete()
        .eq("user_id", currentUserProfile.id)
        .eq("seguidor_id", profile.id);

      if (error) throw error;

      toast.success("Solicitud rechazada");
      setRelationshipStatus("none");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Error al rechazar solicitud");
    }
  };

  const unfriend = async () => {
    if (!currentUserProfile || !profile) return;

    try {
      const { error } = await supabase
        .from("relaciones")
        .delete()
        .or(`and(user_id.eq.${currentUserProfile.id},seguidor_id.eq.${profile.id}),and(user_id.eq.${profile.id},seguidor_id.eq.${currentUserProfile.id})`);

      if (error) throw error;

      toast.success("Amistad eliminada");
      setRelationshipStatus("none");
    } catch (error) {
      console.error("Error unfriending:", error);
      toast.error("Error al eliminar amistad");
    }
  };

  const toggleLike = async (postId: string) => {
    if (!currentUserProfile) return;

    try {
      // Optimistic update
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );

      // Check if already liked
      const { data: existingLike } = await supabase
        .from("interacciones")
        .select("id")
        .eq("publicacion_id", postId)
        .eq("user_id", currentUserProfile.id)
        .eq("tipo_interaccion", "me_gusta")
        .maybeSingle();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from("interacciones")
          .delete()
          .eq("id", existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase.from("interacciones").insert({
          publicacion_id: postId,
          user_id: currentUserProfile.id,
          tipo_interaccion: "me_gusta",
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Error al procesar la interacción");
      // Revert optimistic update on error
      if (profile) {
        await fetchPosts(profile.id);
      }
    }
  };

  const toggleSave = async (postId: string) => {
    if (!currentUserProfile) return;
    try {
      const { data: existingSave } = await supabase
        .from("publicacion_guardadas")
        .select("id")
        .eq("publicacion_id", postId)
        .eq("user_id", currentUserProfile.id)
        .maybeSingle();

      if (existingSave) {
        const { error } = await supabase
          .from("publicacion_guardadas")
          .delete()
          .eq("id", existingSave.id);
        if (error) throw error;
        toast.success("Publicación eliminada de guardados");
      } else {
        const { error } = await supabase.from("publicacion_guardadas").insert({
          publicacion_id: postId,
          user_id: currentUserProfile.id,
        });
        if (error) throw error;
        toast.success("Publicación guardada");
      }

      // Optimistic update of this hook's posts list
      setPosts((current) => current.map((p) => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Error al guardar publicación");
    }
  };

  useEffect(() => {
    if (user && username && currentUserProfile) {
      fetchProfile();
    }
  }, [user, username, currentUserProfile?.id]);

  // Real-time subscription for saved posts changes
  useEffect(() => {
    if (!currentUserProfile || !profile) return;

    const channel = supabase
      .channel('profile-saved-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'publicacion_guardadas',
          filter: `user_id=eq.${currentUserProfile.id}`
        },
        async (payload) => {
          console.log('Saved post changed:', payload);
          
          if (payload.eventType === 'INSERT') {
            const postId = payload.new.publicacion_id;
            setPosts((current) => 
              current.map((p) => p.id === postId ? { ...p, isSaved: true } : p)
            );
          } else if (payload.eventType === 'DELETE') {
            const postId = payload.old.publicacion_id;
            setPosts((current) => 
              current.map((p) => p.id === postId ? { ...p, isSaved: false } : p)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserProfile?.id, profile?.id]);

  return {
    profile,
    posts,
    relationshipStatus,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    toggleLike,
    toggleSave,
    refetchPosts: () => profile ? fetchPosts(profile.id) : Promise.resolve(),
  };
};
