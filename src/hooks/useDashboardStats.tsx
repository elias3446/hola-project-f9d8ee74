import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DashboardStats {
  totalReportes: number;
  reportesPendientes: number;
  reportesEnProceso: number;
  reportesResueltos: number;
  totalUsuarios: number;
  usuariosActivos: number;
  totalPublicaciones: number;
  totalEstados: number;
  totalConversaciones: number;
  reportesPorDia: { fecha: string; count: number }[];
  reportesPorPrioridad: { prioridad: string; count: number }[];
  publicacionesPorDia: { fecha: string; count: number }[];
  usuariosPorRol: { rol: string; count: number }[];
}

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReportes: 0,
    reportesPendientes: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalPublicaciones: 0,
    totalEstados: 0,
    totalConversaciones: 0,
    reportesPorDia: [],
    reportesPorPrioridad: [],
    publicacionesPorDia: [],
    usuariosPorRol: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Total de reportes
      const { count: totalReportes } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      // Reportes por estado
      const { count: reportesPendientes } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente")
        .eq("activo", true);

      const { count: reportesEnProceso } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("status", "en_progreso")
        .eq("activo", true);

      const { count: reportesResueltos } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("status", "resuelto")
        .eq("activo", true);

      // Total de usuarios
      const { count: totalUsuarios } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      // Usuarios activos (estado activo)
      const { count: usuariosActivos } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activo")
        .is("deleted_at", null);

      // Total de publicaciones
      const { count: totalPublicaciones } = await supabase
        .from("publicaciones")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      // Total de estados activos
      const { count: totalEstados } = await supabase
        .from("estados")
        .select("*", { count: "exact", head: true })
        .eq("activo", true)
        .gte("expires_at", new Date().toISOString());

      // Total de conversaciones
      const { count: totalConversaciones } = await supabase
        .from("conversaciones")
        .select("*", { count: "exact", head: true });

      // Reportes por día (últimos 7 días)
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);

      const { data: reportesPorDia } = await supabase
        .from("reportes")
        .select("created_at")
        .eq("activo", true)
        .gte("created_at", hace7Dias.toISOString());

      const reportesDiarios = reportesPorDia?.reduce((acc, reporte) => {
        const fecha = new Date(reporte.created_at).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        });
        const existente = acc.find((item) => item.fecha === fecha);
        if (existente) {
          existente.count++;
        } else {
          acc.push({ fecha, count: 1 });
        }
        return acc;
      }, [] as { fecha: string; count: number }[]);

      // Reportes por prioridad
      const { data: prioridadData } = await supabase
        .from("reportes")
        .select("priority")
        .eq("activo", true);

      const reportesPorPrioridad = prioridadData?.reduce((acc, reporte) => {
        const prioridad = reporte.priority || "medio";
        const existente = acc.find((item) => item.prioridad === prioridad);
        if (existente) {
          existente.count++;
        } else {
          acc.push({ prioridad, count: 1 });
        }
        return acc;
      }, [] as { prioridad: string; count: number }[]);

      // Publicaciones por día (últimos 7 días)
      const { data: publicacionesPorDia } = await supabase
        .from("publicaciones")
        .select("created_at")
        .eq("activo", true)
        .gte("created_at", hace7Dias.toISOString());

      const publicacionesDiarias = publicacionesPorDia?.reduce((acc, publicacion) => {
        const fecha = new Date(publicacion.created_at).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        });
        const existente = acc.find((item) => item.fecha === fecha);
        if (existente) {
          existente.count++;
        } else {
          acc.push({ fecha, count: 1 });
        }
        return acc;
      }, [] as { fecha: string; count: number }[]);

      // Usuarios por rol
      const { data: rolesData } = await supabase
        .from("profiles")
        .select("role")
        .is("deleted_at", null);

      const usuariosPorRol = rolesData?.reduce((acc, usuario) => {
        const rol = usuario.role || "usuario";
        const existente = acc.find((item) => item.rol === rol);
        if (existente) {
          existente.count++;
        } else {
          acc.push({ rol, count: 1 });
        }
        return acc;
      }, [] as { rol: string; count: number }[]);

      setStats({
        totalReportes: totalReportes || 0,
        reportesPendientes: reportesPendientes || 0,
        reportesEnProceso: reportesEnProceso || 0,
        reportesResueltos: reportesResueltos || 0,
        totalUsuarios: totalUsuarios || 0,
        usuariosActivos: usuariosActivos || 0,
        totalPublicaciones: totalPublicaciones || 0,
        totalEstados: totalEstados || 0,
        totalConversaciones: totalConversaciones || 0,
        reportesPorDia: reportesDiarios || [],
        reportesPorPrioridad: reportesPorPrioridad || [],
        publicacionesPorDia: publicacionesDiarias || [],
        usuariosPorRol: usuariosPorRol || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Suscribirse a cambios en tiempo real
    const reportesChannel = supabase
      .channel("dashboard_reportes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reportes" }, fetchStats)
      .subscribe();

    const publicacionesChannel = supabase
      .channel("dashboard_publicaciones")
      .on("postgres_changes", { event: "*", schema: "public", table: "publicaciones" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(reportesChannel);
      supabase.removeChannel(publicacionesChannel);
    };
  }, [profile?.id]);

  return { stats, loading, refetch: fetchStats };
};
