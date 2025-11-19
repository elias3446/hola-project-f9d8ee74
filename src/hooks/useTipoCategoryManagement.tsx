import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TipoCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  user_id: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateTipoCategoryData {
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  category_id?: string;
}

export interface UpdateTipoCategoryData {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  category_id?: string;
  activo?: boolean;
}

export const useTipoCategoryManagement = () => {
  // Verificar si el usuario tiene un permiso específico
  const checkPermission = async (permission: "ver_categoria" | "crear_categoria" | "editar_categoria" | "eliminar_categoria"): Promise<boolean> => {
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
      .single();

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

  // Obtener todos los tipos de categorías activos
  const getTipoCategories = async (categoryId?: string) => {
    // RLS policies handle permissions - no need to check here
    let query = supabase
      .from("tipo_categories")
      .select("*")
      .is("deleted_at", null)
      .order("nombre", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al obtener tipos de categorías");
      throw error;
    }

    return data as TipoCategory[];
  };

  // Obtener un tipo de categoría por ID
  const getTipoCategoryById = async (id: string) => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("tipo_categories")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      toast.error("Error al obtener el tipo de categoría");
      throw error;
    }

    return data as TipoCategory;
  };

  // Crear un nuevo tipo de categoría
  const createTipoCategory = async (tipoCategoryData: CreateTipoCategoryData) => {
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
      .single();

    if (!profile) {
      toast.error("Perfil de usuario no encontrado");
      throw new Error("Perfil no encontrado");
    }

    const { data, error } = await supabase
      .from("tipo_categories")
      .insert({
        ...tipoCategoryData,
        user_id: profile.id,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el tipo de categoría");
      throw error;
    }

    toast.success("Tipo de categoría creado exitosamente");
    return data as TipoCategory;
  };

  // Actualizar un tipo de categoría
  const updateTipoCategory = async (id: string, tipoCategoryData: UpdateTipoCategoryData) => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("tipo_categories")
      .update(tipoCategoryData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      toast.error("Error al actualizar el tipo de categoría");
      throw error;
    }

    toast.success("Tipo de categoría actualizado exitosamente");
    return data as TipoCategory;
  };

  // Eliminar (soft delete) un tipo de categoría
  const deleteTipoCategory = async (id: string, options?: { silent?: boolean }) => {
    // RLS policies handle permissions - no need to check here
    const { error } = await supabase
      .from("tipo_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      if (!options?.silent) {
        toast.error("Error al eliminar el tipo de categoría");
      }
      throw error;
    }

    if (!options?.silent) {
      toast.success("Tipo de categoría eliminado exitosamente");
    }
  };

  return {
    getTipoCategories,
    getTipoCategoryById,
    createTipoCategory,
    updateTipoCategory,
    deleteTipoCategory,
  };
};
