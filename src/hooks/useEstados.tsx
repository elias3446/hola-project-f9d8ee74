import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface EstadoReaccion {
  id: string;
  estado_id?: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
}

export interface Estado {
  id: string;
  user_id: string;
  contenido: string | null;
  imagenes: string[];
  tipo: string;
  compartido_en_mensajes: boolean;
  compartido_en_social: boolean;
  visibilidad: string;
  vistas: { user_id: string; viewed_at: string }[];
  created_at: string;
  expires_at: string;
  activo: boolean;
  profiles?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  reacciones?: EstadoReaccion[];
}

export const useEstados = (origen?: 'mensajes' | 'social') => {
  const { profile, user } = useAuth();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [misEstados, setMisEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstados = async () => {
    if (!profile?.id) return;

    try {
      let query = supabase
        .from("estados")
        .select(`
          *,
          profiles (
            id,
            name,
            username,
            avatar
          ),
          reacciones:estado_reacciones (
            id,
            emoji,
            user_id,
            created_at,
            profiles (
              id,
              name,
              username,
              avatar
            )
          )
        `)
        .eq("activo", true)
        .gte("expires_at", new Date().toISOString());

      // Filtrar según el origen
      if (origen === 'mensajes') {
        query = query.eq("compartido_en_mensajes", true);
      } else if (origen === 'social') {
        query = query.eq("compartido_en_social", true);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Obtener las vistas para todos los estados
      const estadosConVistas = await Promise.all(
        (data || []).map(async (estado) => {
          const { data: vistas } = await supabase
            .from("estado_vistas")
            .select("user_id, created_at")
            .eq("estado_id", estado.id);

          return {
            ...estado,
            vistas: vistas?.map(v => ({ user_id: v.user_id, viewed_at: v.created_at })) || []
          };
        })
      );

      // Separar mis estados y estados de otros
      const my = estadosConVistas.filter((e: Estado) => e.user_id === profile.id) || [];
      const others = estadosConVistas.filter((e: Estado) => e.user_id !== profile.id) || [];

      setMisEstados(my);
      setEstados(others);
    } catch (error: any) {
      console.error("Error fetching estados:", error);
      toast.error("Error al cargar estados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstados();

    // Suscripción en tiempo real para estados
    const estadosChannel = supabase
      .channel("estados_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estados" },
        () => {
          fetchEstados();
        }
      )
      .subscribe();

    // Suscripción en tiempo real para reacciones
    const reaccionesChannel = supabase
      .channel("estado_reacciones_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "estado_reacciones" },
        (payload) => {
          const newReaction = payload.new as any;
          
          // Ignorar eventos del usuario actual (ya manejados por actualización optimista)
          if (newReaction.user_id === profile?.id) return;
          
          // Actualizar estados localmente
          setEstados(prev => prev.map(estado => {
            if (estado.id === newReaction.estado_id) {
              return {
                ...estado,
                reacciones: [...(estado.reacciones || []), {
                  id: newReaction.id,
                  estado_id: newReaction.estado_id,
                  user_id: newReaction.user_id,
                  emoji: newReaction.emoji,
                  created_at: newReaction.created_at
                }]
              };
            }
            return estado;
          }));

          setMisEstados(prev => prev.map(estado => {
            if (estado.id === newReaction.estado_id) {
              return {
                ...estado,
                reacciones: [...(estado.reacciones || []), {
                  id: newReaction.id,
                  estado_id: newReaction.estado_id,
                  user_id: newReaction.user_id,
                  emoji: newReaction.emoji,
                  created_at: newReaction.created_at
                }]
              };
            }
            return estado;
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "estado_reacciones" },
        (payload) => {
          const oldReaction = payload.old as any;
          
          // Ignorar eventos del usuario actual (ya manejados por actualización optimista)
          if (oldReaction.user_id === profile?.id) return;
          
          // Actualizar estados localmente
          setEstados(prev => prev.map(estado => {
            if (estado.id === oldReaction.estado_id) {
              return {
                ...estado,
                reacciones: (estado.reacciones || []).filter(r => r.id !== oldReaction.id)
              };
            }
            return estado;
          }));

          setMisEstados(prev => prev.map(estado => {
            if (estado.id === oldReaction.estado_id) {
              return {
                ...estado,
                reacciones: (estado.reacciones || []).filter(r => r.id !== oldReaction.id)
              };
            }
            return estado;
          }));
        }
      )
      .subscribe();

    // Suscripción en tiempo real para vistas
    const vistasChannel = supabase
      .channel("estado_vistas_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "estado_vistas" },
        (payload) => {
          const newView = payload.new as any;
          
          // Actualizar estados localmente
          setEstados(prev => prev.map(estado => {
            if (estado.id === newView.estado_id) {
              return {
                ...estado,
                vistas: [...(estado.vistas || []), {
                  user_id: newView.user_id,
                  viewed_at: newView.created_at
                }]
              };
            }
            return estado;
          }));

          setMisEstados(prev => prev.map(estado => {
            if (estado.id === newView.estado_id) {
              return {
                ...estado,
                vistas: [...(estado.vistas || []), {
                  user_id: newView.user_id,
                  viewed_at: newView.created_at
                }]
              };
            }
            return estado;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(estadosChannel);
      supabase.removeChannel(reaccionesChannel);
      supabase.removeChannel(vistasChannel);
    };
  }, [profile?.id]);

  const createEstado = async (
    contenido: string | null,
    imagenes: string[],
    tipo: 'imagen' | 'texto' | 'video',
    compartirEnMensajes: boolean,
    compartirEnSocial: boolean,
    visibilidad: 'todos' | 'contactos' | 'privado' = 'todos'
  ) => {
    if (!profile?.id) {
      toast.error("Debes iniciar sesión");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("estados")
        .insert({
          user_id: profile.id,
          contenido,
          imagenes,
          tipo,
          compartido_en_mensajes: compartirEnMensajes,
          compartido_en_social: compartirEnSocial,
          visibilidad,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Estado publicado exitosamente");
      fetchEstados();
      return data;
    } catch (error: any) {
      console.error("Error creating estado:", error);
      toast.error("Error al publicar estado");
      return null;
    }
  };

  const registerView = async (estadoId: string) => {
    try {
      // Obtener profile.id (clave foránea en estado_vistas)
      let viewerProfileId = profile?.id || null;
      if (!viewerProfileId) {
        const { data: authData } = await supabase.auth.getUser();
        const authUid = authData?.user?.id;
        if (authUid) {
          const { data: p, error: pErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", authUid)
            .maybeSingle();
          if (pErr) console.warn("registerView: fetch profile by auth uid error", pErr);
          viewerProfileId = p?.id || null;
        }
      }

      if (!viewerProfileId) {
        console.log("registerView: no profile id yet, retrying soon", { estadoId });
        setTimeout(() => registerView(estadoId), 400);
        return;
      }

      // Evitar duplicados locales
      const estado = estados.find(e => e.id === estadoId) || misEstados.find(e => e.id === estadoId);
      const yaVio = estado?.vistas?.some((v: any) => v.user_id === viewerProfileId);
      if (yaVio) {
        console.log("registerView: already viewed", { estadoId, viewerProfileId });
        return;
      }

      const { error } = await supabase
        .from("estado_vistas")
        .insert({ estado_id: estadoId, user_id: viewerProfileId });

      if (error) {
        console.error("registerView: insert error", error);
      } else {
        // Actualización local inmediata
        const nuevaVista = { user_id: viewerProfileId, viewed_at: new Date().toISOString() } as const;
        setEstados(prev => prev.map(e => e.id === estadoId ? { ...e, vistas: [...(e.vistas || []), nuevaVista] } : e));
        setMisEstados(prev => prev.map(e => e.id === estadoId ? { ...e, vistas: [...(e.vistas || []), nuevaVista] } : e));
      }
    } catch (error: any) {
      console.error("registerView: unexpected error", error);
    }
  };

  const deleteEstado = async (estadoId: string) => {
    try {
      const { error } = await supabase
        .from("estados")
        .delete()
        .eq("id", estadoId);

      if (error) throw error;

      toast.success("Estado eliminado");
      fetchEstados();
    } catch (error: any) {
      console.error("Error deleting estado:", error);
      toast.error("Error al eliminar estado");
    }
  };

  const addReaction = async (estadoId: string, emoji: string) => {
    if (!profile?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }

    // Actualización optimista
    const updateEstadosOptimistically = (estados: Estado[]) => {
      return estados.map(estado => {
        if (estado.id === estadoId) {
          // Eliminar reacción existente del usuario
          const reaccionesSinUsuario = (estado.reacciones || []).filter(r => r.user_id !== profile.id);
          // Agregar nueva reacción
          return {
            ...estado,
            reacciones: [...reaccionesSinUsuario, {
              id: `temp-${Date.now()}`,
              estado_id: estadoId,
              user_id: profile.id,
              emoji,
              created_at: new Date().toISOString()
            }]
          };
        }
        return estado;
      });
    };

    const prevEstados = estados;
    const prevMisEstados = misEstados;
    
    setEstados(updateEstadosOptimistically(estados));
    setMisEstados(updateEstadosOptimistically(misEstados));

    try {
      // Primero eliminar cualquier reacción existente del usuario
      await supabase
        .from("estado_reacciones")
        .delete()
        .eq("estado_id", estadoId)
        .eq("user_id", profile.id);

      // Luego insertar la nueva reacción
      const { error } = await supabase
        .from("estado_reacciones")
        .insert({
          estado_id: estadoId,
          user_id: profile.id,
          emoji,
        });

      if (error) throw error;

      // Refetch para obtener datos completos
      fetchEstados();
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      toast.error("Error al agregar reacción");
      // Revertir en caso de error
      setEstados(prevEstados);
      setMisEstados(prevMisEstados);
    }
  };

  const removeReaction = async (estadoId: string) => {
    if (!profile?.id) return;

    // Actualización optimista
    const updateEstadosOptimistically = (estados: Estado[]) => {
      return estados.map(estado => {
        if (estado.id === estadoId) {
          return {
            ...estado,
            reacciones: (estado.reacciones || []).filter(r => r.user_id !== profile.id)
          };
        }
        return estado;
      });
    };

    const prevEstados = estados;
    const prevMisEstados = misEstados;
    
    setEstados(updateEstadosOptimistically(estados));
    setMisEstados(updateEstadosOptimistically(misEstados));

    try {
      const { error } = await supabase
        .from("estado_reacciones")
        .delete()
        .eq("estado_id", estadoId)
        .eq("user_id", profile.id);

      if (error) throw error;

      // Refetch para obtener datos completos
      fetchEstados();
    } catch (error: any) {
      console.error("Error removing reaction:", error);
      toast.error("Error al eliminar reacción");
      // Revertir en caso de error
      setEstados(prevEstados);
      setMisEstados(prevMisEstados);
    }
  };

  return {
    estados,
    misEstados,
    loading,
    createEstado,
    registerView,
    deleteEstado,
    addReaction,
    removeReaction,
    refetch: fetchEstados,
  };
};
