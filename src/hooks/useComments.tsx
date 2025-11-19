import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { extractMentions, getMentionedUserIds } from "@/lib/mentionUtils";

export interface Comment {
  id: string;
  contenido: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  comentario_padre_id: string | null;
  imagenes?: string[] | null;
  author: {
    name: string;
    avatar: string | null;
    username: string;
  };
  replies?: Comment[];
}

export const useComments = (publicacionId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    username: string;
  } | null>(null);

  // Get current user profile info
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        console.log("❌ No hay usuario autenticado");
        return;
      }
      
      console.log("🔍 Buscando perfil para user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar, username")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          console.error("❌ Error al obtener perfil:", error);
          toast.error("Error al cargar tu perfil. Por favor recarga la página.");
          return;
        }
        
        if (!data) {
          console.error("❌ No se encontró perfil para el usuario");
          toast.error("No se encontró tu perfil. Por favor contacta al administrador.");
          return;
        }
        
        console.log("✅ Perfil cargado:", data);
        setCurrentUserProfile(data);
      } catch (error) {
        console.error("❌ Error inesperado al cargar perfil:", error);
        toast.error("Error al cargar tu perfil");
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const { data: comentariosData, error } = await supabase
        .from("comentarios")
        .select(`
          id,
          contenido,
          created_at,
          updated_at,
          user_id,
          comentario_padre_id,
          imagenes,
          profiles!comentarios_user_id_fkey (
            name,
            avatar,
            username
          )
        `)
        .eq("publicacion_id", publicacionId)
        .eq("activo", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create all comment objects
      comentariosData?.forEach((comment) => {
        const commentObj: Comment = {
          id: comment.id,
          contenido: comment.contenido,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user_id: comment.user_id,
          comentario_padre_id: comment.comentario_padre_id,
          imagenes: comment.imagenes,
          author: {
            name: comment.profiles?.name || "Usuario",
            avatar: comment.profiles?.avatar || null,
            username: comment.profiles?.username || "usuario",
          },
          replies: [],
        };
        commentsMap.set(comment.id, commentObj);
      });

      // Second pass: organize into threads
      commentsMap.forEach((comment) => {
        if (comment.comentario_padre_id) {
          const parent = commentsMap.get(comment.comentario_padre_id);
          if (parent) {
            parent.replies!.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error al cargar los comentarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicacionId) {
      fetchComments();
    }
  }, [publicacionId]);

  const addComment = async (contenido: string, comentarioPadreId?: string, imagenes?: string[]) => {
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      toast.error("Debes iniciar sesión para comentar");
      return;
    }
    
    if (!currentUserProfile) {
      console.error("❌ Perfil de usuario no cargado");
      toast.error("Tu perfil aún no se ha cargado. Por favor espera un momento e intenta de nuevo.");
      return;
    }
    
    console.log("📝 Agregando comentario con perfil:", currentUserProfile.id);

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create optimistic comment
    const optimisticComment: Comment = {
      id: tempId,
      contenido,
      created_at: now,
      updated_at: now,
      user_id: currentUserProfile.id,
      comentario_padre_id: comentarioPadreId || null,
      imagenes: imagenes || null,
      author: {
        name: currentUserProfile.name || "Usuario",
        avatar: currentUserProfile.avatar,
        username: currentUserProfile.username || "usuario",
      },
      replies: [],
    };

    // Add optimistically to state
    if (comentarioPadreId) {
      // Add as a reply
      setComments((prevComments) => {
        const addReplyToComment = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === comentarioPadreId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment],
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToComment(comment.replies),
              };
            }
            return comment;
          });
        };
        return addReplyToComment(prevComments);
      });
    } else {
      // Add as root comment
      setComments((prevComments) => [...prevComments, optimisticComment]);
    }

    // Retry logic with exponential backoff
    const insertCommentWithRetry = async (attempt = 1, maxAttempts = 3): Promise<any> => {
      try {
        console.log(`🔄 Intento ${attempt}/${maxAttempts} de insertar comentario...`);
        console.log("Datos a insertar:", {
          publicacion_id: publicacionId,
          user_id: currentUserProfile.id,
          contenido: contenido.substring(0, 50),
          comentario_padre_id: comentarioPadreId || null,
        });
        
        const { data: insertedComment, error } = await supabase
          .from("comentarios")
          .insert({
            publicacion_id: publicacionId,
            user_id: currentUserProfile.id,
            contenido,
            comentario_padre_id: comentarioPadreId || null,
            imagenes: imagenes || null,
          })
          .select(`
            id,
            contenido,
            created_at,
            updated_at,
            user_id,
            comentario_padre_id,
            imagenes
          `)
          .single();

        if (error) {
          console.error(`❌ Error en intento ${attempt}:`, error);
          throw error;
        }
        
      console.log("✅ Comentario insertado exitosamente:", insertedComment);
        
        // Save mentions
        const mentions = extractMentions(contenido);
        if (mentions.length > 0) {
          await saveCommentMentions(insertedComment.id, mentions, currentUserProfile.id, publicacionId);
        }
        
        return insertedComment;
      } catch (error: any) {
        console.error(`❌ Error detallado en intento ${attempt}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          console.log(`⏳ Reintentando en ${delay}ms...`);
          toast.info(`Reintentando envío (${attempt}/${maxAttempts})...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return insertCommentWithRetry(attempt + 1, maxAttempts);
        }
        throw error;
      }
    };

    try {
      const insertedComment = await insertCommentWithRetry();

      // Replace temporary comment with real one
      setComments((prevComments) => {
        const replaceComment = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === tempId) {
              return {
                ...optimisticComment,
                id: insertedComment.id,
                created_at: insertedComment.created_at,
                updated_at: insertedComment.updated_at,
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: replaceComment(comment.replies),
              };
            }
            return comment;
          });
        };
        return replaceComment(prevComments);
      });

      toast.success("Comentario agregado");
    } catch (error) {
      console.error("Error adding comment after retries:", error);
      toast.error("No se pudo agregar el comentario después de varios intentos");
      
      // Remove optimistic comment on error
      setComments((prevComments) => {
        const removeComment = (comments: Comment[]): Comment[] => {
          return comments
            .filter((comment) => comment.id !== tempId)
            .map((comment) => {
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: removeComment(comment.replies),
                };
              }
              return comment;
            });
        };
        return removeComment(prevComments);
      });
      
      throw error;
    }
  };

  const updateComment = async (commentId: string, contenido: string, imagenes?: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comentarios")
        .update({ 
          contenido, 
          imagenes: imagenes || null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comentario actualizado");
      
      // Refetch comments but don't let it block the success response
      fetchComments().catch(err => {
        console.error("Error refreshing comments:", err);
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error al actualizar el comentario");
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comentarios")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comentario eliminado");
      
      // Refetch comments but don't let it block the success response
      fetchComments().catch(err => {
        console.error("Error refreshing comments:", err);
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error al eliminar el comentario");
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const saveCommentMentions = async (
    commentId: string,
    usernames: string[],
    authorId: string,
    publicacionId: string
  ) => {
    try {
      const mentionedUserIds = await getMentionedUserIds(usernames, supabase);
      
      if (mentionedUserIds.length === 0) return;

      // Save mentions
      const mentionPromises = mentionedUserIds.map((userId) =>
        supabase.from("comentario_menciones").insert({
          comentario_id: commentId,
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
            title: "Te mencionaron en un comentario",
            message: "Alguien te mencionó en un comentario",
            data: { publicacion_id: publicacionId, comentario_id: commentId },
          })
        );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error("Error saving comment mentions:", error);
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    refreshComments: fetchComments,
  };
};
