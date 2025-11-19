import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  reference?: string;
  building?: string;
  floor?: string;
  room?: string;
  additional_info?: string;
}

export interface Report {
  id: string;
  nombre: string;
  descripcion?: string;
  status: string;
  priority: string;
  visibility: string;
  categoria_id?: string;
  tipo_reporte_id?: string;
  user_id: string;
  assigned_to?: string;
  location?: any;
  imagenes?: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateReportData {
  nombre: string;
  descripcion?: string;
  status?: string;
  priority?: string;
  visibility?: string;
  categoria_id?: string;
  tipo_reporte_id?: string;
  assigned_to?: string;
  location?: any;
  imagenes?: string[];
}

export interface UpdateReportData {
  nombre?: string;
  descripcion?: string;
  status?: string;
  priority?: string;
  visibility?: string;
  categoria_id?: string;
  tipo_reporte_id?: string;
  assigned_to?: string;
  location?: any;
  imagenes?: string[];
  activo?: boolean;
}

export const useReportManagement = () => {
  // Verificar si el usuario tiene un permiso específico
  const checkPermission = async (permission: "ver_reporte" | "crear_reporte" | "editar_reporte" | "eliminar_reporte"): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuario no autenticado");
      return false;
    }

    // Obtener el profile_id del usuario autenticado
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      console.error("Perfil no encontrado");
      return false;
    }

    const { data, error } = await supabase.rpc("has_permission", {
      _user_id: profile.id,
      _permission: permission,
    });

    if (error) {
      console.error("Error verificando permiso:", error);
      return false;
    }

    return data || false;
  };

  // Obtener todos los reportes activos con distancia
  const getReports = async (userLat?: number, userLng?: number) => {
    // RLS policies handle permissions - no need to check here
    // Si se proporciona la ubicación del usuario, usar la función RPC para calcular distancias
    if (userLat !== undefined && userLng !== undefined) {
      const { data, error } = await supabase.rpc("get_reportes_with_distance", {
        user_lat: userLat,
        user_lng: userLng,
      });

      if (error) {
        console.error("Error al obtener reportes con distancia:", error);
        toast.error("Error al obtener reportes");
        throw error;
      }

      return data as any[];
    }

    // Fallback: obtener reportes sin calcular distancia
    const { data, error } = await supabase
      .from("reportes")
      .select("*, categories(nombre), tipo_categories(nombre), profiles!reportes_user_id_fkey(name), assigned_profiles:profiles!reportes_assigned_to_fkey(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al obtener reportes");
      throw error;
    }

    return data as any[];
  };

  // Obtener un reporte por ID
  const getReportById = async (id: string) => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("reportes")
      .select("*, categories(nombre), tipo_categories(nombre), profiles!reportes_user_id_fkey(name, email, avatar), assigned_profiles:profiles!reportes_assigned_to_fkey(name, email, avatar)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      toast.error("Error al obtener el reporte");
      throw error;
    }

    return data as any;
  };

  // Crear un nuevo reporte
  const createReport = async (reportData: CreateReportData) => {
    // RLS policies handle permissions - no need to check here
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuario no autenticado");
      throw new Error("Usuario no autenticado");
    }

    // Obtener el profile_id del usuario autenticado
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      toast.error("Perfil de usuario no encontrado");
      throw new Error("Perfil no encontrado");
    }

    const { data, error } = await supabase
      .from("reportes")
      .insert([{
        nombre: reportData.nombre,
        descripcion: reportData.descripcion,
        categoria_id: reportData.categoria_id,
        tipo_reporte_id: reportData.tipo_reporte_id,
        assigned_to: reportData.assigned_to,
        location: reportData.location,
        imagenes: reportData.imagenes,
        user_id: profile.id,
        activo: true,
        status: (reportData.status || 'pendiente') as any,
        priority: (reportData.priority || 'medio') as any,
        visibility: (reportData.visibility || 'publico') as any,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error al crear reporte:", error);
      toast.error(`Error al crear el reporte: ${error.message || 'Desconocido'}`);
      throw error;
    }

    return data as any;
  };

  // Actualizar un reporte
  const updateReport = async (id: string, reportData: UpdateReportData, options?: { silent?: boolean }) => {
    // RLS policies handle permissions - no need to check here
    const updateData: any = {
      nombre: reportData.nombre,
      descripcion: reportData.descripcion,
      categoria_id: reportData.categoria_id,
      tipo_reporte_id: reportData.tipo_reporte_id,
      assigned_to: reportData.assigned_to,
      location: reportData.location,
      imagenes: reportData.imagenes,
      activo: reportData.activo,
      status: reportData.status as any,
      priority: reportData.priority as any,
      visibility: reportData.visibility as any,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from("reportes")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (!options?.silent) {
        toast.error("Error al actualizar el reporte");
      }
      throw error;
    }

    if (!options?.silent) {
      toast.success("Reporte actualizado exitosamente");
    }
    return data as Report;
  };

  // Eliminar (soft delete) un reporte
  const deleteReport = async (id: string, options?: { silent?: boolean }) => {
    // RLS policies handle permissions - no need to check here
    const { error } = await supabase
      .from("reportes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      if (!options?.silent) {
        toast.error("Error al eliminar el reporte");
      }
      throw error;
    }

    if (!options?.silent) {
      toast.success("Reporte eliminado exitosamente");
    }
  };

  return {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
  };
};
