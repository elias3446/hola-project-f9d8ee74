import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileType, Plus } from "lucide-react";
import { useTipoCategoryManagement } from "@/hooks/useTipoCategoryManagement";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ICON_OPTIONS = ["📄", "📝", "📋", "📊", "🔧", "⚠️", "🚨", "💡", "🎯", "📌", "⭐", "🔥"];
const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
];

const CrearTipoReporte = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { createTipoCategory, updateTipoCategory, getTipoCategoryById } = useTipoCategoryManagement();
  const { getCategories } = useCategoryManagement();
  const isEditing = !!id;
  const fromPage = searchParams.get("from");
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    icono: "",
    color: "",
    category_id: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCategories();
    if (isEditing && id) {
      loadTipoReporteData();
    }
  }, [id, isEditing]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadTipoReporteData = async () => {
    if (!id) return;
    
    setLoadingData(true);
    try {
      const tipoReporteData = await getTipoCategoryById(id);
      setFormData({
        nombre: tipoReporteData.nombre,
        descripcion: tipoReporteData.descripcion || "",
        icono: tipoReporteData.icono || "",
        color: tipoReporteData.color || "",
        category_id: tipoReporteData.category_id || "",
      });
    } catch (error) {
      toast.error("No se pudo cargar el tipo de reporte");
      navigate("/tipos-reportes");
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

    if (!formData.category_id) {
      toast.error("La categoría es obligatoria");
      return;
    }

    setLoading(true);
    
    try {
      const dataToSubmit = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        icono: formData.icono || undefined,
        color: formData.color || undefined,
        category_id: formData.category_id, // Requerido, no undefined
      };

      if (isEditing && id) {
        await updateTipoCategory(id, dataToSubmit);
      } else {
        await createTipoCategory(dataToSubmit);
      }
      
      // Navegar a la página anterior
      navigate(-1);
    } catch (error) {
      // El error ya se muestra en el hook
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loadingData) {
    return (
      <Layout title={isEditing ? "Editar Tipo de Reporte" : "Crear Tipo de Reporte"} icon={FileType}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos del tipo de reporte...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Editar Tipo de Reporte" : "Crear Tipo de Reporte"} icon={isEditing ? FileType : Plus}>
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
              <FileType className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditing ? "Editar Tipo de Reporte" : "Crear Nuevo Tipo de Reporte"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing 
                  ? "Modifica los datos del tipo de reporte"
                  : "Completa los datos para crear un nuevo tipo de reporte"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-6 space-y-6 bg-card">
            <h3 className="font-semibold text-lg">Información del Tipo de Reporte</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ingresa el nombre del tipo de reporte"
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
                <Label htmlFor="category_id">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No hay categorías disponibles
                      </div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icono && `${category.icono} `}
                          {category.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona la categoría a la que pertenece este tipo de reporte
                </p>
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
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Tipo de Reporte"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CrearTipoReporte;
