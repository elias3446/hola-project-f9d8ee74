import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { addReactionToLocal } from "./useFrequentEmojis";

export interface MessageReaction {
  id: string;
  mensaje_id: string;
  user_id: string | null;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export const useMessageReactions = (messageIds: string[]) => {
  const { profile } = useAuth();
  const [reactions, setReactions] = useState<Map<string, ReactionGroup[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const groupReactions = (data: MessageReaction[], currentUserId?: string) => {
    const grouped = new Map<string, ReactionGroup[]>();
    
    messageIds.forEach(msgId => {
      const msgReactions = data?.filter(r => r.mensaje_id === msgId) || [];
      const emojiMap = new Map<string, ReactionGroup>();

      msgReactions.forEach(reaction => {
        const existing = emojiMap.get(reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user_id || "");
          if (reaction.user_id === currentUserId) {
            existing.hasReacted = true;
          }
        } else {
          emojiMap.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user_id || ""],
            hasReacted: reaction.user_id === currentUserId,
          });
        }
      });

      grouped.set(msgId, Array.from(emojiMap.values()));
    });

    return grouped;
  };

  const fetchReactions = async () => {
    if (messageIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      console.log("[useMessageReactions] Fetching reactions for messages:", messageIds);
      const { data, error } = await supabase
        .from("mensaje_reacciones")
        .select("*")
        .in("mensaje_id", messageIds);

      if (error) throw error;

      console.log("[useMessageReactions] Fetched reactions:", data);
      const grouped = groupReactions(data || [], profile?.id);
      setReactions(grouped);
    } catch (error) {
      console.error("[useMessageReactions] Error fetching reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    if (messageIds.length > 0 && profile?.id) {
      fetchReactions();
    }
  }, [messageIds.join(","), profile?.id]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (messageIds.length === 0 || !profile?.id) return;

    console.log("[useMessageReactions] Setting up realtime subscription for messages:", messageIds);
    
    const channel: RealtimeChannel = supabase
      .channel("message-reactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensaje_reacciones",
        },
        (payload) => {
          console.log("[useMessageReactions] INSERT event:", payload);
          const newReaction = payload.new as MessageReaction;
          
          // Ignorar eventos del usuario actual (ya manejados por actualización optimista)
          if (newReaction.user_id === profile.id) {
            console.log("[useMessageReactions] Ignoring own INSERT event");
            return;
          }
          
          // Solo procesar si es para uno de nuestros mensajes
          if (messageIds.includes(newReaction.mensaje_id)) {
            setReactions(prevReactions => {
              const newReactions = new Map(prevReactions);
              const msgReactions = [...(newReactions.get(newReaction.mensaje_id) || [])];
              
              const existingEmojiIndex = msgReactions.findIndex(r => r.emoji === newReaction.emoji);
              
              if (existingEmojiIndex >= 0) {
                // Incrementar contador del emoji existente
                msgReactions[existingEmojiIndex] = {
                  ...msgReactions[existingEmojiIndex],
                  count: msgReactions[existingEmojiIndex].count + 1,
                  users: [...msgReactions[existingEmojiIndex].users, newReaction.user_id || ""],
                };
              } else {
                // Agregar nuevo emoji
                msgReactions.push({
                  emoji: newReaction.emoji,
                  count: 1,
                  users: [newReaction.user_id || ""],
                  hasReacted: false
                });
              }
              
              newReactions.set(newReaction.mensaje_id, msgReactions);
              return newReactions;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "mensaje_reacciones",
        },
        (payload) => {
          console.log("[useMessageReactions] DELETE event:", payload);
          const oldReaction = payload.old as MessageReaction;
          
          // Ignorar eventos del usuario actual (ya manejados por actualización optimista)
          if (oldReaction.user_id === profile.id) {
            console.log("[useMessageReactions] Ignoring own DELETE event");
            return;
          }
          
          // Solo procesar si es para uno de nuestros mensajes
          if (messageIds.includes(oldReaction.mensaje_id)) {
            setReactions(prevReactions => {
              const newReactions = new Map(prevReactions);
              let msgReactions = [...(newReactions.get(oldReaction.mensaje_id) || [])];
              
              msgReactions = msgReactions.map(r => {
                if (r.emoji === oldReaction.emoji) {
                  return {
                    ...r,
                    count: r.count - 1,
                    users: r.users.filter(u => u !== oldReaction.user_id),
                  };
                }
                return r;
              }).filter(r => r.count > 0); // Eliminar emojis con count 0
              
              newReactions.set(oldReaction.mensaje_id, msgReactions);
              return newReactions;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[useMessageReactions] Subscription status:", status);
      });

    return () => {
      console.log("[useMessageReactions] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [messageIds.join(","), profile?.id]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile?.id) {
      console.warn("[useMessageReactions] No profile ID available");
      return;
    }

    console.log("[useMessageReactions] Toggle reaction:", { messageId, emoji, userId: profile.id });

    const messageReactions = reactions.get(messageId) || [];
    const clickedReaction = messageReactions.find(r => r.emoji === emoji);
    const userHasReaction = messageReactions.find(r => r.hasReacted);

    // Actualización optimista del UI
    setReactions(prevReactions => {
      const newReactions = new Map(prevReactions);
      let msgReactions = [...(newReactions.get(messageId) || [])];
      
      // Si el usuario ya tiene una reacción, la removemos del estado
      if (userHasReaction) {
        msgReactions = msgReactions.map(r => {
          if (r.emoji === userHasReaction.emoji) {
            return {
              ...r,
              count: r.count - 1,
              hasReacted: false,
              users: r.users.filter(u => u !== profile.id)
            };
          }
          return r;
        }).filter(r => r.count > 0);
      }
      
      // Si no es la misma reacción, agregamos la nueva
      if (!clickedReaction?.hasReacted) {
        const existing = msgReactions.find(r => r.emoji === emoji);
        if (existing) {
          msgReactions = msgReactions.map(r => {
            if (r.emoji === emoji) {
              return {
                ...r,
                count: r.count + 1,
                hasReacted: true,
                users: [...r.users, profile.id]
              };
            }
            return r;
          });
        } else {
          msgReactions.push({
            emoji,
            count: 1,
            hasReacted: true,
            users: [profile.id]
          });
        }
      }
      
      newReactions.set(messageId, msgReactions);
      return newReactions;
    });

    try {
      // Primero eliminar cualquier reacción existente del usuario en este mensaje
      const { error: deleteError } = await supabase
        .from("mensaje_reacciones")
        .delete()
        .eq("mensaje_id", messageId)
        .eq("user_id", profile.id);

      if (deleteError) {
        console.error("[useMessageReactions] Error deleting reaction:", deleteError);
        throw deleteError;
      }

      console.log("[useMessageReactions] Deleted existing reactions");

      // Si no es la misma reacción, agregar la nueva
      if (!clickedReaction?.hasReacted) {
        const { error: insertError } = await supabase
          .from("mensaje_reacciones")
          .insert({
            mensaje_id: messageId,
            user_id: profile.id,
            emoji,
          });

        if (insertError) {
          console.error("[useMessageReactions] Error inserting reaction:", insertError);
          throw insertError;
        }

        console.log("[useMessageReactions] Inserted new reaction:", emoji);
        
        // Update local cache
        addReactionToLocal(emoji);
      } else {
        console.log("[useMessageReactions] Removed reaction (clicked same emoji)");
      }
    } catch (error) {
      console.error("[useMessageReactions] Error toggling reaction:", error);
      // Revertir en caso de error
      fetchReactions();
      throw error;
    }
  };

  return {
    reactions,
    loading,
    toggleReaction,
  };
};
