import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Tag, Plus } from "lucide-react";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ICON_OPTIONS = ["📁", "📊", "🔧", "🏢", "🏗️", "⚡", "🔥", "💡", "🎯", "📌", "⭐", "🚀"];
const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
];

const CrearCategoria = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { createCategory, updateCategory, getCategoryById } = useCategoryManagement();
  const isEditing = !!id;
  const fromPage = searchParams.get("from");
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    icono: "",
    color: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showCreateTipoReporteDialog, setShowCreateTipoReporteDialog] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadCategoryData();
    }
  }, [id, isEditing]);

  const loadCategoryData = async () => {
    if (!id) return;
    
    setLoadingData(true);
    try {
      const categoryData = await getCategoryById(id);
      setFormData({
        nombre: categoryData.nombre,
        descripcion: categoryData.descripcion || "",
        icono: categoryData.icono || "",
        color: categoryData.color || "",
      });
    } catch (error) {
      toast.error("No se pudo cargar la categoría");
      navigate("/categorias");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && id) {
        await updateCategory(id, formData);
        navigate("/categorias");
      } else {
        await createCategory(formData);
        
        // Si viene desde tipos-reportes, ir directo a crear tipo de reporte
        if (fromPage === "tipos-reportes") {
          navigate("/tipos-reportes/crear");
        } else {
          // Si no viene de tipos-reportes, preguntar si quiere crear tipo de reporte
          setShowCreateTipoReporteDialog(true);
        }
      }
    } catch (error) {
      // El error ya se muestra en el hook
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTipoReporte = () => {
    setShowCreateTipoReporteDialog(false);
    navigate("/tipos-reportes/crear?from=categorias");
  };

  const handleCancelCreateTipoReporte = () => {
    setShowCreateTipoReporteDialog(false);
    navigate("/categorias");
  };

  const handleBack = () => {
    if (fromPage === "tipos-reportes") {
      navigate("/tipos-reportes");
    } else {
      navigate("/categorias");
    }
  };

  if (loadingData) {
    return (
      <Layout title={isEditing ? "Editar Categoría" : "Crear Categoría"} icon={Tag}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos de la categoría...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Editar Categoría" : "Crear Categoría"} icon={isEditing ? Tag : Plus}>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditing ? "Editar Categoría" : "Crear Nueva Categoría"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing 
                  ? "Modifica los datos de la categoría"
                  : "Completa los datos para crear una nueva categoría"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-6 space-y-6 bg-card">
            <h3 className="font-semibold text-lg">Información de la Categoría</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ingresa el nombre de la categoría"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Ingresa una descripción (opcional)"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono: icon })}
                      className={`h-12 w-12 rounded border-2 flex items-center justify-center text-2xl hover:border-primary transition-colors ${
                        formData.icono === icon ? "border-primary bg-primary/10" : "border-input"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {formData.icono && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, icono: "" })}
                  >
                    Limpiar selección
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-12 w-12 rounded border-2 transition-all ${
                        formData.color === color ? "border-primary scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {formData.color && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-8 w-8 rounded border"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm text-muted-foreground">{formData.color}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, color: "" })}
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </div>
        </form>
      </div>

      {/* Dialog para crear tipo de reporte */}
      <AlertDialog open={showCreateTipoReporteDialog} onOpenChange={setShowCreateTipoReporteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear Tipo de Reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Categoría creada exitosamente. ¿Deseas crear un nuevo tipo de reporte para esta categoría?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCreateTipoReporte}>
              No, ir a Categorías
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateTipoReporte}>
              Sí, crear Tipo de Reporte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CrearCategoria;
