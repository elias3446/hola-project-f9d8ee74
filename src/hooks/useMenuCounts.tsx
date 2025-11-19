import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface MenuCounts {
  reportes: number;
  mensajes: number;
  notificaciones: number;
  redSocial: number;
}

export const useMenuCounts = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<MenuCounts>({
    reportes: 0,
    mensajes: 0,
    notificaciones: 0,
    redSocial: 0,
  });

  const fetchCounts = async () => {
    if (!user) return;

    try {
      // Obtener profile.id del usuario autenticado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error obteniendo profile:", profileError);
        return;
      }

      if (!profile) {
        console.log("No se encontró profile para user:", user.id);
        return;
      }

      console.log("Profile ID encontrado:", profile.id);

      // Contar reportes pendientes
      const { count: reportesCount, error: reportesError } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente")
        .is("deleted_at", null);

      if (reportesError) {
        console.error("Error contando reportes:", reportesError);
      } else {
        console.log("Reportes pendientes:", reportesCount);
      }

      // Contar mensajes no leídos en conversaciones activas del usuario
      const { data: conversacionesActivas, error: convError } = await supabase
        .from("participantes_conversacion")
        .select("conversacion_id")
        .eq("user_id", profile.id)
        .is("hidden_at", null);

      if (convError) {
        console.error("Error obteniendo conversaciones:", convError);
      } else {
        console.log("Conversaciones activas:", conversacionesActivas?.length || 0);
      }

      const conversacionIds = conversacionesActivas?.map(p => p.conversacion_id) || [];
      
      let mensajesCount = 0;
      if (conversacionIds.length > 0) {
        const { count, error: mensajesError } = await supabase
          .from("mensajes")
          .select("*", { count: "exact", head: true })
          .in("conversacion_id", conversacionIds)
          .eq("leido", false)
          .neq("user_id", profile.id);
        
        if (mensajesError) {
          console.error("Error contando mensajes:", mensajesError);
        } else {
          console.log("Mensajes no leídos:", count);
        }
        mensajesCount = count || 0;
      }

      // Contar notificaciones no leídas
      const { count: notificacionesCount, error: notifError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("read", false);

      if (notifError) {
        console.error("Error contando notificaciones:", notifError);
      } else {
        console.log("Notificaciones no leídas:", notificacionesCount);
      }

      // Contar solicitudes de amistad pendientes para red social
      const { count: redSocialCount, error: redSocialError } = await supabase
        .from("relaciones")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("estado", "pendiente");

      if (redSocialError) {
        console.error("Error contando relaciones:", redSocialError);
      } else {
        console.log("Solicitudes de amistad pendientes:", redSocialCount);
      }

      const newCounts = {
        reportes: reportesCount || 0,
        mensajes: mensajesCount,
        notificaciones: notificacionesCount || 0,
        redSocial: redSocialCount || 0,
      };

      console.log("Actualizando counts:", newCounts);
      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching menu counts:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchCounts();

    // Obtener profile.id para las suscripciones
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data: profile }) => {
        if (!profile) return;

        // Suscribirse a cambios en reportes
        const reportesChannel = supabase
          .channel("reportes-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "reportes",
            },
            () => fetchCounts()
          )
          .subscribe();

        // Suscribirse a cambios en mensajes
        const mensajesChannel = supabase
          .channel("mensajes-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "mensajes",
            },
            () => fetchCounts()
          )
          .subscribe();

        // Suscribirse a cambios en notificaciones
        const notificacionesChannel = supabase
          .channel("notifications-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
            },
            () => fetchCounts()
          )
          .subscribe();

        // Suscribirse a cambios en relaciones
        const relacionesChannel = supabase
          .channel("relaciones-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "relaciones",
            },
            () => fetchCounts()
          )
          .subscribe();

        return () => {
          supabase.removeChannel(reportesChannel);
          supabase.removeChannel(mensajesChannel);
          supabase.removeChannel(notificacionesChannel);
          supabase.removeChannel(relacionesChannel);
        };
      });
  }, [user]);

  return { counts, fetchCounts };
};
