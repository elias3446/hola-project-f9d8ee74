import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { extractHashtags } from "@/lib/hashtagUtils";
import { extractMentions, getMentionedUserIds } from "@/lib/mentionUtils";

export interface Post {
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
  // Repost fields
  repost_of?: string | null;
  repost_comentario?: string | null;
  originalPost?: {
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
  } | null;
}

export const useSocialFeed = (mutedUserIds: string[] = []) => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedInitially = useRef(false);

  const fetchPosts = async () => {
    if (!profile?.id) {
      console.warn('[useSocialFeed] No profile available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('[useSocialFeed] Starting to fetch posts');
      
      // Fetch posts with author info
      const { data: publicaciones, error: postsError } = await supabase
        .from("publicaciones")
        .select(`
          id,
          user_id,
          contenido,
          imagenes,
          created_at,
          repost_of,
          repost_comentario,
          profiles!publicaciones_user_id_fkey (
            name,
            avatar,
            username
          )
        `)
        .eq("activo", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      const currentProfileId = profile.id;
      console.log('[useSocialFeed] Current profile ID:', currentProfileId);

      if (!currentProfileId) {
        console.warn('[useSocialFeed] No current profile ID available');
      }

      // Fetch interactions count and user's likes
      const postsWithStats = await Promise.all(
        (publicaciones || []).map(async (post) => {
          // If this is a repost, fetch the original post
          let originalPost = null;
          if (post.repost_of) {
            const { data: originalData } = await supabase
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
              .eq("id", post.repost_of)
              .single();

            if (originalData) {
              originalPost = {
                id: originalData.id,
                user_id: originalData.user_id,
                contenido: originalData.contenido || "",
                imagenes: originalData.imagenes,
                created_at: originalData.created_at,
                author: {
                  name: originalData.profiles?.name || "Usuario",
                  avatar: originalData.profiles?.avatar || null,
                  username: originalData.profiles?.username || "usuario",
                },
              };
            }
          }

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
            console.error('[useSocialFeed] Error checking saved status:', savedError);
          }

          const isSaved = !!userSaved;
          console.log(`[useSocialFeed] Post ${post.id.substring(0, 8)} saved status:`, isSaved);

          return {
            id: post.id,
            user_id: post.user_id,
            contenido: post.contenido || "",
            imagenes: post.imagenes,
            created_at: post.created_at,
            repost_of: post.repost_of,
            repost_comentario: post.repost_comentario,
            originalPost: originalPost,
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

      // Filter out muted users' posts
      const filteredPosts = postsWithStats.filter(
        (post) => !mutedUserIds.includes(post.user_id)
      );

      console.log('[useSocialFeed] Setting posts:', filteredPosts.length, 'posts');
      setPosts(filteredPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Error al cargar las publicaciones");
    } finally {
      setLoading(false);
    }
  };

  const prevMutedUserIds = useRef<string[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    // Only fetch on initial load or when mutedUserIds actually changes
    const mutedIdsChanged = 
      prevMutedUserIds.current.length !== mutedUserIds.length ||
      prevMutedUserIds.current.some((id, index) => id !== mutedUserIds[index]);

    if (!hasLoadedInitially.current || mutedIdsChanged) {
      hasLoadedInitially.current = true;
      prevMutedUserIds.current = mutedUserIds;
      fetchPosts();
    }
  }, [profile?.id, mutedUserIds]);

  // Real-time subscription for likes
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('publicaciones-likes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interacciones',
          filter: `tipo_interaccion=eq.me_gusta`
        },
        async (payload) => {
          console.log('Like added:', payload);
          const newLike = payload.new;
          
          const isCurrentUser = profile.id === newLike.user_id;
          
          // Update the post with the new like count
          setPosts((currentPosts) =>
            currentPosts.map((post) => {
              if (post.id === newLike.publicacion_id) {
                return {
                  ...post,
                  likes: isCurrentUser ? post.likes : post.likes + 1,
                  isLiked: isCurrentUser ? true : post.isLiked,
                };
              }
              return post;
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'interacciones',
          filter: `tipo_interaccion=eq.me_gusta`
        },
        async (payload) => {
          console.log('Like removed:', payload);
          const oldLike = payload.old;
          
          const isCurrentUser = profile.id === oldLike.user_id;
          
          // Update the post with decreased like count
          setPosts((currentPosts) =>
            currentPosts.map((post) => {
              if (post.id === oldLike.publicacion_id) {
                return {
                  ...post,
                  likes: isCurrentUser ? post.likes : Math.max(0, post.likes - 1),
                  isLiked: isCurrentUser ? false : post.isLiked,
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Real-time subscription for views
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('publicaciones-views-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'publicacion_vistas'
        },
        (payload) => {
          console.log('View added:', payload);
          const newView = payload.new;
          
          // Update the post with the new view count
          setPosts((currentPosts) =>
            currentPosts.map((post) => {
              if (post.id === newView.publicacion_id) {
                return {
                  ...post,
                  views: post.views + 1,
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Real-time subscription for saved posts changes
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('social-feed-saved-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'publicacion_guardadas'
        },
        async (payload) => {
          console.log('[useSocialFeed] Saved post changed:', payload);
          
          const currentProfileId = profile.id;
          
          if (payload.eventType === 'INSERT') {
            const newSave = payload.new;
            // Only update if it's the current user who saved
            if (newSave.user_id === currentProfileId) {
              setPosts((currentPosts) =>
                currentPosts.map((post) => {
                  if (post.id === newSave.publicacion_id) {
                    console.log('[useSocialFeed] Updating post to saved:', post.id.substring(0, 8));
                    return {
                      ...post,
                      isSaved: true,
                    };
                  }
                  return post;
                })
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const oldSave = payload.old;
            // Only update if it's the current user who unsaved
            if (oldSave.user_id === currentProfileId) {
              setPosts((currentPosts) =>
                currentPosts.map((post) => {
                  if (post.id === oldSave.publicacion_id) {
                    console.log('[useSocialFeed] Updating post to unsaved:', post.id.substring(0, 8));
                    return {
                      ...post,
                      isSaved: false,
                    };
                  }
                  return post;
                })
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const registerView = async (postId: string) => {
    if (!profile?.id) return;

    try {
      // Insert view (will be ignored if already exists due to UNIQUE constraint)
      await supabase
        .from("publicacion_vistas")
        .insert({
          publicacion_id: postId,
          user_id: profile.id,
        });
    } catch (error) {
      // Silently fail if view already exists
      if (error.code !== "23505") {
        console.error("Error registering view:", error);
      }
    }
  };

  const createPost = async (contenido: string, imagenes?: string[]) => {
    if (!profile?.id) return;

    try {
      const { data: newPost, error: postError } = await supabase
        .from("publicaciones")
        .insert({
          user_id: profile.id,
          contenido,
          imagenes: imagenes || null,
          visibilidad: "publico",
        })
        .select()
        .single();

      if (postError) throw postError;

      // Extract and save hashtags
      const hashtags = extractHashtags(contenido);
      if (hashtags.length > 0 && newPost) {
        await saveHashtags(newPost.id, hashtags);
      }

      // Extract and save mentions
      const mentions = extractMentions(contenido);
      if (mentions.length > 0 && newPost) {
        await saveMentions(newPost.id, mentions, profile.id);
      }

      toast.success("Publicación creada exitosamente");
      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error al crear la publicación");
    }
  };

  const saveHashtags = async (publicacionId: string, hashtags: string[]) => {
    try {
      for (const hashtagName of hashtags) {
        // Check if hashtag exists
        let { data: existingHashtag } = await supabase
          .from("hashtags")
          .select("id")
          .eq("nombre", hashtagName)
          .single();

        let hashtagId: string;

        if (!existingHashtag) {
          // Create new hashtag
          const { data: newHashtag, error: createError } = await supabase
            .from("hashtags")
            .insert({ nombre: hashtagName })
            .select()
            .single();

          if (createError) throw createError;
          hashtagId = newHashtag.id;
        } else {
          hashtagId = existingHashtag.id;
        }

        // Link hashtag to post
        await supabase
          .from("publicacion_hashtags")
          .insert({
            publicacion_id: publicacionId,
            hashtag_id: hashtagId,
          });
      }
    } catch (error) {
      console.error("Error saving hashtags:", error);
    }
  };

  const saveMentions = async (publicacionId: string, usernames: string[], authorId: string) => {
    try {
      const mentionedUserIds = await getMentionedUserIds(usernames, supabase);
      
      if (mentionedUserIds.length === 0) return;

      // Save mentions
      const mentionPromises = mentionedUserIds.map((userId) =>
        supabase.from("publicacion_menciones").insert({
          publicacion_id: publicacionId,
          mentioned_user_id: userId,
        })
      );

      await Promise.all(mentionPromises);

      // Create notifications for mentioned users (excluding the author)
      const notificationPromises = mentionedUserIds
        .filter((userId) => userId !== authorId)
        .map((userId) =>
          supabase.from("notifications").insert({
            user_id: userId,
            type: "comentario",
            title: "Te mencionaron en una publicación",
            message: "Alguien te mencionó en una publicación",
            data: { publicacion_id: publicacionId },
          })
        );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error("Error saving mentions:", error);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!profile?.id) return;

    try {

      // Optimistic update: Update UI immediately
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
        .eq("user_id", profile.id)
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
          user_id: profile.id,
          tipo_interaccion: "me_gusta",
        });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Error al procesar la interacción");
      // Revert optimistic update on error
      await fetchPosts();
    }
  };

  const updatePostComments = (postId: string, increment: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments + increment }
          : post
      )
    );
  };

  const updatePostShares = (postId: string, increment: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, shares: post.shares + increment }
          : post
      )
    );
  };

  const deletePost = async (postId: string) => {
    // Remove from state immediately (optimistic update)
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  };

  const toggleSavePost = async (postId: string) => {
    if (!profile?.id) return;

    try {

      // Optimistic update: Update UI immediately
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, isSaved: !post.isSaved }
            : post
        )
      );

      // Check if already saved
      const { data: existingSaved } = await supabase
        .from("publicacion_guardadas")
        .select("id")
        .eq("publicacion_id", postId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingSaved) {
        // Unsave
        await supabase
          .from("publicacion_guardadas")
          .delete()
          .eq("id", existingSaved.id);
      } else {
        // Save
        await supabase.from("publicacion_guardadas").insert({
          publicacion_id: postId,
          user_id: profile.id,
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      // Revert optimistic update on error
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, isSaved: !post.isSaved }
            : post
        )
      );
    }
  };

  const updatePost = async (postId: string, contenido: string, imagenes?: string[]) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from("publicaciones")
        .update({
          contenido,
          imagenes: imagenes || null,
        })
        .eq("id", postId);

      if (error) throw error;

      // Extract and update hashtags
      const hashtags = extractHashtags(contenido);
      
      // Delete old hashtags
      await supabase
        .from("publicacion_hashtags")
        .delete()
        .eq("publicacion_id", postId);

      // Save new hashtags
      if (hashtags.length > 0) {
        await saveHashtags(postId, hashtags);
      }

      // Extract and update mentions
      const mentions = extractMentions(contenido);
      
      // Delete old mentions
      await supabase
        .from("publicacion_menciones")
        .delete()
        .eq("publicacion_id", postId);

      // Save new mentions
      if (mentions.length > 0) {
        await saveMentions(postId, mentions, profile.id);
      }

      toast.success("Publicación actualizada exitosamente");
      await fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Error al actualizar la publicación");
    }
  };

  const repostPost = async (originalPostId: string, comment: string) => {
    if (!profile?.id) return;

    try {
      const { data: newRepost, error: repostError } = await supabase
        .from("publicaciones")
        .insert({
          user_id: profile.id,
          contenido: comment || "", // Empty if no comment
          repost_of: originalPostId,
          repost_comentario: comment || null,
          visibilidad: "publico",
        })
        .select()
        .single();

      if (repostError) throw repostError;

      // Register share in compartidos table
      await supabase.from("publicacion_compartidos").insert({
        publicacion_id: originalPostId,
        user_id: profile.id,
        tipo_compartido: "repost",
      });

      // Extract and save hashtags from comment if any
      if (comment) {
        const hashtags = extractHashtags(comment);
        if (hashtags.length > 0 && newRepost) {
          await saveHashtags(newRepost.id, hashtags);
        }

        // Extract and save mentions from comment
        const mentions = extractMentions(comment);
        if (mentions.length > 0 && newRepost) {
          await saveMentions(newRepost.id, mentions, profile.id);
        }
      }

      toast.success("Publicación compartida exitosamente");
      await fetchPosts();
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Error al compartir la publicación");
      throw error;
    }
  };

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    refreshPosts: fetchPosts,
    updatePostComments,
    updatePostShares,
    registerView,
    deletePost,
    updatePost,
    toggleSavePost,
    repostPost,
  };
};
