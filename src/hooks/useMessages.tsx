import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  conversacion_id: string;
  contenido: string;
  imagenes: string[] | null;
  leido: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_id: string | null;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  readStatus?: 'sent' | 'delivered' | 'read';
}

export interface Participante {
  user_id: string;
  ultimo_leido_at: string | null;
}

export interface TypingUser {
  user_id: string;
  name: string;
  username: string;
}

export const useMessages = (conversacionId: string | null) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const calculateReadStatus = (message: Message, participantes: Participante[], isGroup: boolean): 'sent' | 'delivered' | 'read' => {
    // Only for own messages
    if (message.user_id !== profile?.id) return 'sent';

    // Get other participants (not the sender)
    const otherParticipants = participantes.filter(p => p.user_id !== message.user_id);
    
    // If no other participants (self-chat), mark as read
    if (otherParticipants.length === 0) {
      return 'read';
    }

    // Check how many participants have read (ultimo_leido_at >= message created_at)
    const readByCount = otherParticipants.filter(p => {
      if (!p.ultimo_leido_at) return false;
      return new Date(p.ultimo_leido_at) >= new Date(message.created_at);
    }).length;

    // Check how many participants have the conversation open (received but not necessarily read)
    // We consider "delivered" if they have ANY ultimo_leido_at (even if before this message)
    const deliveredToCount = otherParticipants.filter(p => {
      return p.ultimo_leido_at !== null;
    }).length;

    // For individual chats:
    if (!isGroup) {
      // All read by the single recipient
      if (readByCount === 1) return 'read';
      // Delivered to recipient (they've been in the chat before)
      if (deliveredToCount === 1) return 'delivered';
      // Not yet delivered
      return 'sent';
    }

    // For group chats:
    // All participants have read the message
    if (readByCount === otherParticipants.length) return 'read';
    // All participants have received it (been in chat) but not all have read
    if (deliveredToCount === otherParticipants.length) return 'delivered';
    // At least one has received/read it
    if (readByCount > 0 || deliveredToCount > 0) return 'delivered';
    // Not yet delivered to anyone
    return 'sent';
  };

  const fetchMessages = async () => {
    if (!conversacionId || !profile?.id) return;

    try {
      // Fetch conversation info
      const { data: convData } = await supabase
        .from("conversaciones")
        .select("es_grupo")
        .eq("id", conversacionId)
        .single();

      setIsGroupChat(convData?.es_grupo || false);

      // Get current user's participation (including hidden_at)
      const { data: myParticipation } = await supabase
        .from("participantes_conversacion")
        .select("hidden_at")
        .eq("conversacion_id", conversacionId)
        .eq("user_id", profile.id)
        .single();

      // Fetch participants with their read status (only active ones)
      const { data: participantesData } = await supabase
        .from("participantes_conversacion")
        .select("user_id, ultimo_leido_at")
        .eq("conversacion_id", conversacionId)
        .is("hidden_at", null);

      setParticipantes(participantesData || []);

      // Build query for messages
      let messagesQuery = supabase
        .from("mensajes")
        .select(`
          *,
          user:profiles!mensajes_user_id_fkey(id, name, username, avatar)
        `)
        .eq("conversacion_id", conversacionId)
        .is("deleted_at", null)
        .not("hidden_by_users", "cs", `["${profile.id}"]`);

      // If user left the group, only show messages before leaving
      if (myParticipation?.hidden_at) {
        messagesQuery = messagesQuery.lte("created_at", myParticipation.hidden_at);
      }

      const { data, error } = await messagesQuery.order("created_at", { ascending: true });

      if (error) throw error;

      // Calculate read status for each message
      const messagesWithStatus = (data || []).map(msg => ({
        ...msg,
        readStatus: calculateReadStatus(msg, participantesData || [], convData?.es_grupo || false)
      }));

      setMessages(messagesWithStatus);

      // Mark messages as read
      await supabase
        .from("participantes_conversacion")
        .update({ ultimo_leido_at: new Date().toISOString() })
        .eq("conversacion_id", conversacionId)
        .eq("user_id", profile.id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversacionId) {
      setLoading(true);
      fetchMessages();
    }
  }, [conversacionId, profile?.id]);

  // Real-time updates
  useEffect(() => {
    if (!conversacionId || !profile?.id) return;

    // Check if user has left the group
    const checkParticipation = async () => {
      const { data: myParticipation } = await supabase
        .from("participantes_conversacion")
        .select("hidden_at")
        .eq("conversacion_id", conversacionId)
        .eq("user_id", profile.id)
        .single();

      return myParticipation?.hidden_at;
    };

    const channel = supabase
      .channel(`messages-${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Don't add new messages if user has left the group
          const hiddenAt = await checkParticipation();
          if (hiddenAt) return;
          
          // Skip if message is hidden by current user
          if ((newMessage as any).hidden_by_users?.includes(profile.id)) {
            return;
          }
          
          // Fetch user data for the new message
          const { data: userData } = await supabase
            .from("profiles")
            .select("id, name, username, avatar")
            .eq("id", newMessage.user_id)
            .single();

          const messageWithUser = { ...newMessage, user: userData };
          const readStatus = calculateReadStatus(messageWithUser, participantes, isGroupChat);

          setMessages((prev) => [...prev, { ...messageWithUser, readStatus }]);

          // Mark as read if I'm viewing
          if (newMessage.user_id !== profile.id) {
            await supabase
              .from("participantes_conversacion")
              .update({ ultimo_leido_at: new Date().toISOString() })
              .eq("conversacion_id", conversacionId)
              .eq("user_id", profile.id);

            // Refetch participants to update read status
            const { data: participantesData } = await supabase
              .from("participantes_conversacion")
              .select("user_id, ultimo_leido_at")
              .eq("conversacion_id", conversacionId)
              .is("hidden_at", null);

            setParticipantes(participantesData || []);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as Message;
          
          // If message is now hidden by current user, remove it
          if ((updatedMessage as any).hidden_by_users?.includes(profile.id)) {
            setMessages((prev) => prev.filter(msg => msg.id !== updatedMessage.id));
            return;
          }
          
          // If message was deleted, fetch user data for display
          if (updatedMessage.deleted_at && !updatedMessage.user) {
            const { data: userData } = await supabase
              .from("profiles")
              .select("id, name, username, avatar")
              .eq("id", updatedMessage.user_id)
              .single();
            
            updatedMessage.user = userData;
          }
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? { 
                ...msg, 
                ...updatedMessage,
                user: updatedMessage.user || msg.user,
                readStatus: calculateReadStatus({ ...msg, ...updatedMessage }, participantes, isGroupChat)
              } : msg
            )
          );
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        
        // Track typing users (include self for debugging purposes)
        const typingUsers = Object.values(state)
          .flat()
          .filter((presence: any) => presence.typing)
          .map((presence: any) => ({
            user_id: presence.user_id,
            name: presence.name || presence.username,
            username: presence.username,
          }));
        setTyping(typingUsers);

        // Track online users (include everyone)
        const online = Object.values(state)
          .flat()
          .map((presence: any) => presence.user_id);
        setOnlineUsers(online);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participantes_conversacion",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        async (payload) => {
          // When any participant updates their ultimo_leido_at, refresh read status
          const { data: participantesData } = await supabase
            .from("participantes_conversacion")
            .select("user_id, ultimo_leido_at")
            .eq("conversacion_id", conversacionId)
            .is("hidden_at", null);

          setParticipantes(participantesData || []);

          // Recalculate read status for all messages
          setMessages(prev => prev.map(msg => ({
            ...msg,
            readStatus: calculateReadStatus(msg, participantesData || [], isGroupChat)
          })));
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track my presence when subscribed
          await channel.track({
            user_id: profile.id,
            name: profile.name,
            username: profile.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversacionId, profile?.id]);

  const sendMessage = async (contenido: string, imagenes?: string[]) => {
    if (!conversacionId || !profile?.id || !contenido.trim()) return;

    try {
      const { error } = await supabase.from("mensajes").insert({
        conversacion_id: conversacionId,
        contenido: contenido.trim(),
        imagenes: imagenes || null,
        user_id: profile.id,
        leido: false,
      });

      if (error) throw error;

      // Unhide conversation if it was hidden (so it reappears in "Todos")
      await supabase
        .from("participantes_conversacion")
        .update({ 
          hidden_at: null,
          hidden_from_all: false,
          hidden_from_todos: false
        })
        .eq("conversacion_id", conversacionId)
        .eq("user_id", profile.id);

      // Update conversation timestamp
      await supabase
        .from("conversaciones")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversacionId);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const setTypingStatus = async (isTyping: boolean) => {
    if (!conversacionId || !profile?.id || !channelRef.current) return;

    if (isTyping) {
      await channelRef.current.track({
        user_id: profile.id,
        name: profile.name,
        username: profile.username,
        typing: true,
      });
    } else {
      await channelRef.current.untrack();
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!conversacionId || !profile?.id || !newContent.trim()) return;

    try {
      const { error } = await supabase
        .from("mensajes")
        .update({ 
          contenido: newContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", messageId)
        .eq("user_id", profile.id); // Only allow editing own messages

      if (error) throw error;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    if (!conversacionId || !profile?.id) return;

    try {
      if (deleteForEveryone) {
        // Delete for everyone using secure RPC
        const { error } = await supabase.rpc('delete_message_for_everyone', { 
          p_message_id: messageId 
        });
        if (error) throw error;
        
        // Update local state immediately
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                deleted_at: new Date().toISOString(),
                contenido: "Este mensaje fue eliminado",
                updated_at: new Date().toISOString()
              }
            : msg
        ));
      } else {
        // Delete only for me - use secure RPC to bypass RLS safely
        const { error } = await supabase.rpc('hide_message_for_user', { p_message_id: messageId });
        if (error) throw error;
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    typing,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    setTypingStatus,
    refetch: fetchMessages,
  };
};
