import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateCategoryData {
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
}

export interface UpdateCategoryData {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo?: boolean;
}

export const useCategoryManagement = () => {
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

  // Obtener todas las categorías activas
  const getCategories = async () => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .order("nombre", { ascending: true });

    if (error) {
      toast.error("Error al obtener categorías");
      throw error;
    }

    return data as Category[];
  };

  // Obtener una categoría por ID
  const getCategoryById = async (id: string) => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      toast.error("Error al obtener la categoría");
      throw error;
    }

    return data as Category;
  };

  // Crear una nueva categoría
  const createCategory = async (categoryData: CreateCategoryData) => {
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
      .from("categories")
      .insert({
        ...categoryData,
        user_id: profile.id,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear la categoría");
      throw error;
    }

    toast.success("Categoría creada exitosamente");
    return data as Category;
  };

  // Actualizar una categoría
  const updateCategory = async (id: string, categoryData: UpdateCategoryData) => {
    // RLS policies handle permissions - no need to check here
    const { data, error } = await supabase
      .from("categories")
      .update(categoryData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      toast.error("Error al actualizar la categoría");
      throw error;
    }

    toast.success("Categoría actualizada exitosamente");
    return data as Category;
  };

  // Eliminar (soft delete) una categoría
  const deleteCategory = async (id: string, options?: { silent?: boolean }) => {
    // RLS policies handle permissions - no need to check here
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      if (!options?.silent) {
        toast.error("Error al eliminar la categoría");
      }
      throw error;
    }

    if (!options?.silent) {
      toast.success("Categoría eliminada exitosamente");
    }
  };

  return {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
