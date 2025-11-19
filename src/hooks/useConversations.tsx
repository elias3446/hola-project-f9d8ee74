import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  nombre: string | null;
  es_grupo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  ultimo_mensaje?: {
    contenido: string;
    created_at: string;
    user_id: string;
    deleted_at?: string | null;
  };
  participante?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    online: boolean;
  };
  unread_count: number;
  muted?: boolean;
  my_role?: 'miembro' | 'administrador';
  hidden?: boolean; // hidden_at - usuario salió del grupo
  hidden_from_all?: boolean; // eliminado completamente
  hidden_from_todos?: boolean; // solo oculto de "Todos"
}

export const useConversations = () => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!profile?.id) return;

    try {
      // Get user's conversations with role (including hidden ones for groups)
      const { data: participantes, error: partError } = await supabase
        .from("participantes_conversacion")
        .select("conversacion_id, ultimo_leido_at, muted, role, hidden_at, hidden_from_all, hidden_from_todos")
        .eq("user_id", profile.id);

      if (partError) throw partError;
      if (!participantes || participantes.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversacionIds = participantes.map(p => p.conversacion_id);

      // Get conversations details
      const { data: convs, error: convsError } = await supabase
        .from("conversaciones")
        .select("*")
        .in("id", conversacionIds)
        .order("updated_at", { ascending: false });

      if (convsError) throw convsError;

      // For each conversation, get last message and unread count
      const conversationsWithData = await Promise.all(
        (convs || []).map(async (conv) => {
          // Get last message (excluding hidden ones for current user)
          const { data: lastMsg } = await supabase
            .from("mensajes")
            .select("contenido, created_at, user_id, deleted_at")
            .eq("conversacion_id", conv.id)
            .not('hidden_by_users', 'cs', `["${profile.id}"]`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (excluding hidden messages)
          const participante = participantes.find(p => p.conversacion_id === conv.id);
          const { count } = await supabase
            .from("mensajes")
            .select("*", { count: "exact", head: true })
            .eq("conversacion_id", conv.id)
            .neq("user_id", profile.id)
            .is("deleted_at", null)
            .not('hidden_by_users', 'cs', `["${profile.id}"]`)
            .gt("created_at", participante?.ultimo_leido_at || "1970-01-01");

          // If not group, get other participant info
          let participanteInfo = null;
          if (!conv.es_grupo) {
            const { data: otherParticipantes } = await supabase
              .from("participantes_conversacion")
              .select("user_id")
              .eq("conversacion_id", conv.id)
              .neq("user_id", profile.id);

            // Check if it's a self-conversation
            let targetUserId = profile.id;
            if (otherParticipantes && otherParticipantes[0]) {
              targetUserId = otherParticipantes[0].user_id;
            }

            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, name, username, avatar")
              .eq("id", targetUserId)
              .single();

            if (profileData) {
              participanteInfo = {
                ...profileData,
                online: false, // Will be updated by presence
              };
            }
          }

          const currentParticipante = participantes.find(p => p.conversacion_id === conv.id);
          
          return {
            ...conv,
            ultimo_mensaje: lastMsg || undefined,
            participante: participanteInfo || undefined,
            unread_count: count || 0,
            muted: currentParticipante?.muted || false,
            my_role: currentParticipante?.role || 'miembro',
            hidden: !!currentParticipante?.hidden_at, // salió del grupo
            hidden_from_all: !!(currentParticipante as any)?.hidden_from_all, // eliminado completamente
            hidden_from_todos: !!(currentParticipante as any)?.hidden_from_todos, // solo oculto de "Todos"
          };
        })
      );

      setConversations(conversationsWithData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [profile?.id]);

  // Real-time updates for new messages
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensajes",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversaciones",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const createConversation = async (otherUserId: string) => {
    if (!profile?.id) return null;

    try {
      // Check if conversation already exists between these two users (including hidden ones)
      const { data: myParticipations } = await supabase
        .from("participantes_conversacion")
        .select("conversacion_id, hidden_at, conversaciones!inner(es_grupo)")
        .eq("user_id", profile.id);

      if (myParticipations && myParticipations.length > 0) {
        // Check each conversation to see if the other user is also a participant
        for (const conv of myParticipations) {
          // Skip group conversations
          if ((conv as any).conversaciones?.es_grupo) continue;

          const { data: otherUserPart } = await supabase
            .from("participantes_conversacion")
            .select("conversacion_id, hidden_at")
            .eq("conversacion_id", conv.conversacion_id)
            .eq("user_id", otherUserId)
            .maybeSingle();

          if (otherUserPart) {
            // Found existing conversation - unhide it for both users
            await supabase
              .from("participantes_conversacion")
              .update({ 
                hidden_at: null, 
                hidden_from_all: false,
                hidden_from_todos: false 
              })
              .eq("conversacion_id", conv.conversacion_id)
              .in("user_id", [profile.id, otherUserId]);

            await fetchConversations();
            return conv.conversacion_id;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversaciones")
        .insert({
          es_grupo: false,
          created_by: profile.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants individually to avoid partial unique index conflicts
      // 1) Ensure the other user is added
      const { error: otherPartError } = await supabase
        .from("participantes_conversacion")
        .insert({ conversacion_id: newConv.id, user_id: otherUserId, role: 'miembro' });
      if (otherPartError) throw otherPartError;

      // 2) Add current user if not already present (some DB triggers may auto-add)
      const { data: existingSelf } = await supabase
        .from("participantes_conversacion")
        .select("id")
        .eq("conversacion_id", newConv.id)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!existingSelf) {
        const { error: selfPartError } = await supabase
          .from("participantes_conversacion")
          .insert({ conversacion_id: newConv.id, user_id: profile.id, role: 'miembro' });

        // Ignore duplicate error from partial unique constraint
        if (selfPartError && selfPartError.code !== '23505') {
          throw selfPartError;
        }
      }

      await fetchConversations();
      return newConv.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const createGroupConversation = async (userIds: string[], groupName: string) => {
    if (!profile?.id || userIds.length === 0) return null;

    try {
      // Create new group conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversaciones")
        .insert({
          es_grupo: true,
          nombre: groupName,
          created_by: profile.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants safely (dedupe and ignore existing)
      const uniqueUserIds = Array.from(new Set(userIds.filter((id) => id && id !== profile.id)));

      // 1) Ensure creator is added as admin (ignore duplicate errors)
      const { error: creatorErr } = await supabase
        .from("participantes_conversacion")
        .insert({ conversacion_id: newConv.id, user_id: profile.id, role: 'administrador' });
      if (creatorErr && (creatorErr as any).code !== '23505') throw creatorErr;

      // 2) Add each member as 'miembro', ignoring duplicates
      for (const uid of uniqueUserIds) {
        const { error: memberErr } = await supabase
          .from("participantes_conversacion")
          .insert({ conversacion_id: newConv.id, user_id: uid, role: 'miembro' });
        if (memberErr && (memberErr as any).code !== '23505') throw memberErr;
      }

      // Log group creation event
      await supabase.from("group_history").insert({
        conversacion_id: newConv.id,
        action_type: 'group_created',
        performed_by: profile.id,
        new_value: groupName,
      });

      await fetchConversations();
      return newConv.id;
    } catch (error) {
      console.error("Error creating group conversation:", error);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!profile?.id) return false;

    try {
      // Use the secure RPC function to hide the conversation (removes from "Todos")
      const { error } = await supabase
        .rpc('hide_conversation_for_user', {
          _conversation_id: conversationId
        });

      if (error) throw error;

      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error hiding conversation:", error);
      return false;
    }
  };

  const muteConversation = async (conversationId: string) => {
    if (!profile?.id) return false;

    try {
      // First check current muted status
      const { data: currentData, error: fetchError } = await supabase
        .from("participantes_conversacion")
        .select("muted")
        .eq("conversacion_id", conversationId)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !currentData) {
        console.error("Error fetching muted status:", fetchError);
        return false;
      }

      // Toggle muted status
      const newMutedStatus = !currentData.muted;

      const { error: updateError } = await supabase
        .from("participantes_conversacion")
        .update({ muted: newMutedStatus })
        .eq("conversacion_id", conversationId)
        .eq("user_id", profile.id);

      if (updateError) {
        console.error("Error updating muted status:", updateError);
        throw updateError;
      }

      await fetchConversations();
      return newMutedStatus;
    } catch (error) {
      console.error("Error muting conversation:", error);
      return false;
    }
  };

  const addParticipant = async (conversationId: string, userId: string) => {
    if (!profile?.id) return false;

    try {
      // Check if user is already a participant
      const { data: existing } = await supabase
        .from("participantes_conversacion")
        .select("id")
        .eq("conversacion_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        return false;
      }

      // Add participant with default miembro role
      const { error } = await supabase
        .from("participantes_conversacion")
        .insert({
          conversacion_id: conversationId,
          user_id: userId,
          role: 'miembro',
        });

      if (error) throw error;

      // Log event to group history
      await supabase.from("group_history").insert({
        conversacion_id: conversationId,
        action_type: 'member_added',
        performed_by: profile.id,
        affected_user_id: userId,
      });

      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error adding participant:", error);
      return false;
    }
  };

  const removeParticipant = async (conversationId: string, userId: string) => {
    if (!profile?.id) return false;

    try {
      // Delete participant
      const { error } = await supabase
        .from("participantes_conversacion")
        .delete()
        .eq("conversacion_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;

      // Log event to group history
      await supabase.from("group_history").insert({
        conversacion_id: conversationId,
        action_type: 'member_removed',
        performed_by: profile.id,
        affected_user_id: userId,
      });

      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error removing participant:", error);
      return false;
    }
  };

  const updateParticipantRole = async (conversationId: string, userId: string, role: 'miembro' | 'administrador') => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from("participantes_conversacion")
        .update({ role })
        .eq("conversacion_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;

      // Log event to group history
      const actionType = role === 'administrador' ? 'member_promoted' : 'member_demoted';
      await supabase.from("group_history").insert({
        conversacion_id: conversationId,
        action_type: actionType,
        performed_by: profile.id,
        affected_user_id: userId,
        old_value: role === 'administrador' ? 'miembro' : 'administrador',
        new_value: role,
      });

      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error updating participant role:", error);
      return false;
    }
  };

  const updateGroupName = async (conversationId: string, newName: string) => {
    if (!profile?.id) return false;

    try {
      // Get current name
      const { data: currentConv } = await supabase
        .from("conversaciones")
        .select("nombre")
        .eq("id", conversationId)
        .single();

      const oldName = currentConv?.nombre || "";

      // Update group name
      const { error } = await supabase
        .from("conversaciones")
        .update({ nombre: newName })
        .eq("id", conversationId);

      if (error) throw error;

      // Log event to group history
      await supabase.from("group_history").insert({
        conversacion_id: conversationId,
        action_type: 'group_renamed',
        performed_by: profile.id,
        old_value: oldName,
        new_value: newName,
      });

      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error updating group name:", error);
      return false;
    }
  };

  const clearMessages = async (conversationId: string) => {
    if (!profile?.id) return false;

    try {
      // Use the secure RPC function to clear messages
      const { error } = await supabase
        .rpc('clear_messages_for_user', {
          _conversation_id: conversationId
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error clearing messages:", error);
      return false;
    }
  };

  const leaveGroup = async (conversationId: string) => {
    if (!profile?.id) return false;

    try {
      // Use secure function to leave group
      const { data, error } = await supabase
        .rpc('leave_group_safe', {
          _conversation_id: conversationId
        });

      if (error) throw error;

      await fetchConversations();
      return data === true;
    } catch (error) {
      console.error("Error leaving group:", error);
      return false;
    }
  };

  // Filter conversations for "Todos" view
  // Excluye: conversaciones ocultadas de "Todos" (hidden_from_todos) y eliminadas (hidden_from_all)
  const allConversations = conversations.filter(c => 
    !c.hidden_from_all && !c.hidden_from_todos
  );
  
  // Filter conversations for "Mis Grupos":
  // Muestra TODOS los grupos (incluso si el usuario salió) excepto los eliminados (hidden_from_all)
  // El usuario puede haber salido (hidden = true) pero la conversación debe permanecer hasta eliminarla
  const myGroups = conversations.filter(c => 
    c.es_grupo && !c.hidden_from_all
  );
  
  // Debug log
  console.log('All conversations:', allConversations.length);
  console.log('My groups:', myGroups.length);
  console.log('Hidden from Todos:', conversations.filter(c => c.hidden_from_todos).length);

  return {
    conversations: allConversations,
    myGroups,
    loading,
    createConversation,
    createGroupConversation,
    deleteConversation,
    clearMessages,
    muteConversation,
    addParticipant,
    removeParticipant,
    updateParticipantRole,
    updateGroupName,
    leaveGroup,
    refetch: fetchConversations,
  };
};
