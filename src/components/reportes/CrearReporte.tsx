import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Upload, MapPin, Navigation, FileText, Plus } from 'lucide-react';
import { Layout } from "@/components/Layout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { useTipoCategoryManagement } from '@/hooks/useTipoCategoryManagement';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useReportManagement } from '@/hooks/useReportManagement';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ReportFormMap } from '@/components/Map';
import type { LocationData } from '@/hooks/useReportManagement';

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function CrearReporte() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { profile, roles } = useAuth();
  const { currentLocation, isTracking } = useLocation();
  const { createReport, updateReport, getReportById } = useReportManagement();
  
  // Check if user has administrator role
  const isAdmin = roles?.roles?.includes('administrador') || false;
  const { getCategories } = useCategoryManagement();
  const { getTipoCategories } = useTipoCategoryManagement();
  const { getUsersForAssignment } = useUserManagement();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tipoReportes, setTipoReportes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    tipo_reporte_id: '',
    priority: 'medio' as Database['public']['Enums']['report_priority'],
    status: 'pendiente' as Database['public']['Enums']['report_status'],
    visibility: 'publico' as Database['public']['Enums']['report_visibility'],
    assigned_to: 'unassigned',
    activo: true,
    imagenes: [] as string[],
    location: null as LocationData | null,
  });

  useEffect(() => {
    loadCategories();
    loadUsers();
  }, []);

  useEffect(() => {
    if (formData.categoria_id) {
      loadTipoReportes(formData.categoria_id);
    }
  }, [formData.categoria_id]);

  // Load existing report data when editing
  useEffect(() => {
    if (isEditing && id) {
      loadReportData();
    }
  }, [isEditing, id]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadTipoReportes = async (categoryId: string) => {
    try {
      const data = await getTipoCategories(categoryId);
      setTipoReportes(data);
    } catch (error) {
      console.error("Error loading tipo reportes:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsersForAssignment();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadReportData = async () => {
    if (!id) return;
    
    setLoadingData(true);
    try {
      const reportData = await getReportById(id);
      setFormData({
        nombre: reportData.nombre || '',
        descripcion: reportData.descripcion || '',
        categoria_id: reportData.categoria_id || '',
        tipo_reporte_id: reportData.tipo_reporte_id || '',
        priority: reportData.priority || 'medio',
        status: reportData.status || 'pendiente',
        visibility: reportData.visibility || 'publico',
        assigned_to: reportData.assigned_to || 'unassigned',
        activo: reportData.activo ?? true,
        imagenes: reportData.imagenes || [],
        location: reportData.location ? reportData.location as unknown as LocationData : null,
      });
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error("No se pudo cargar el reporte");
      navigate("/reportes");
    } finally {
      setLoadingData(false);
    }
  };

  const openCloudinaryWidget = () => {
    if (window.cloudinary) {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      // Validate Cloudinary credentials
      if (!cloudName || typeof cloudName !== 'string' || cloudName.length > 100) {
        console.error("Invalid Cloudinary cloud name");
        return;
      }
      if (!uploadPreset || typeof uploadPreset !== 'string' || uploadPreset.length > 100) {
        console.error("Invalid Cloudinary upload preset");
        return;
      }

      window.cloudinary.openUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: true,
          resourceType: 'image',
          clientAllowedFormats: ['jpg', 'png', 'gif', 'webp'],
          maxImageFileSize: 5000000, // 5MB
          maxFiles: 5,
          theme: 'minimal',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            const imageUrl = result.info.secure_url;
            if (!formData.imagenes.includes(imageUrl)) {
              setFormData(prev => ({
                ...prev,
                imagenes: [...prev.imagenes, imageUrl]
              }));
            }
          }
        }
      );
    } else {
      console.error('Cloudinary widget not loaded');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load Cloudinary script
  useEffect(() => {
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !profile?.id) return;

    setLoading(true);
    try {
      if (isEditing && id) {
        await updateReport(id, {
          ...formData,
          categoria_id: formData.categoria_id || null,
          tipo_reporte_id: formData.tipo_reporte_id || null,
          assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
          location: formData.location as any,
        });

        toast.success("Reporte actualizado exitosamente");
      } else {
        await createReport({
          ...formData,
          categoria_id: formData.categoria_id || null,
          tipo_reporte_id: formData.tipo_reporte_id || null,
          assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
          location: formData.location as any,
        });

        toast.success("Reporte creado exitosamente");
      }

      navigate('/reportes');
    } catch (error) {
      console.error('Error saving reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout title={isEditing ? "Editar Reporte" : "Crear Reporte"} icon={FileText}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos del reporte...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Editar Reporte" : "Crear Reporte"} icon={isEditing ? FileText : Plus}>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditing ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Modifica los datos del reporte' : 'Completa los datos para crear un nuevo reporte'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Información del Reporte</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Título del Reporte <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ingresa el título del reporte"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ingresa una descripción detallada (opcional)"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData({ ...formData, categoria_id: value, tipo_reporte_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.activo).map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Reporte</Label>
                  <Select
                    value={formData.tipo_reporte_id}
                    onValueChange={(value) => setFormData({ ...formData, tipo_reporte_id: value })}
                    disabled={!formData.categoria_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoReportes.filter(t => t.activo).map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Estado y Configuración - Solo para administradores */}
          {isAdmin && (
            <div className="border rounded-lg p-6 space-y-4 bg-card">
              <h3 className="font-semibold text-lg">Estado y Configuración</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Database['public']['Enums']['report_priority']) => 
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Database['public']['Enums']['report_status']) => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="resuelto">Resuelto</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibilidad</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: Database['public']['Enums']['report_visibility']) => 
                      setFormData({ ...formData, visibility: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Asignar a</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Reporte activo</Label>
              </div>
            </div>
          )}

          {/* Imágenes */}
          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Imágenes</h3>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={openCloudinaryWidget}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir Imágenes
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Máximo 5 imágenes, 5MB cada una
              </span>
            </div>
            
            {formData.imagenes.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Imágenes subidas:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.imagenes.map((imagen, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border">
                        <img 
                          src={imagen} 
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Ubicación
              </h3>
              <Button
                type="button"
                onClick={async () => {
                  if (!currentLocation) {
                    toast.error("Ubicación no disponible", {
                      description: "Por favor, permite el acceso a tu ubicación en la configuración del navegador"
                    });
                    return;
                  }
                  
                  setLoadingLocation(true);
                  try {
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&accept-language=es`
                    );
                    const data = await response.json();
                    const address = (data.display_name && data.display_name.trim()) 
                      ? data.display_name 
                      : `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
                    const locationData = {
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng,
                      address: address,
                    };
                    handleInputChange('location', locationData);
                    toast.success("Ubicación obtenida desde segundo plano");
                  } catch (_err) {
                    const fallback = {
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng,
                      address: `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
                    };
                    handleInputChange('location', fallback);
                    toast.success("Ubicación obtenida desde segundo plano");
                  } finally {
                    setLoadingLocation(false);
                  }
                }}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                disabled={loadingLocation || !currentLocation}
              >
                {loadingLocation ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Obteniendo ubicación...
                  </>
                ) : !currentLocation ? (
                  <>
                    <Navigation className="h-4 w-4" />
                    Ubicación no disponible
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    Usar mi ubicación
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <ReportFormMap
                selectedLocation={formData.location}
                onLocationSelect={(location) => handleInputChange('location', location)}
              />

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input 
                  id="address" 
                  value={formData.location?.address || ''}
                  readOnly
                  placeholder="La dirección se mostrará automáticamente al seleccionar en el mapa"
                  className="bg-muted/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Punto de Referencia</Label>
                  <Input 
                    id="reference" 
                    value={formData.location?.reference || ''}
                    onChange={(e) => handleInputChange('location', {
                      ...formData.location,
                      reference: e.target.value
                    })}
                    placeholder="Ej: Cerca del auditorio principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building">Edificio</Label>
                  <Input 
                    id="building" 
                    value={formData.location?.building || ''}
                    onChange={(e) => handleInputChange('location', {
                      ...formData.location,
                      building: e.target.value
                    })}
                    placeholder="Ej: Edificio A, Torre Norte"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Piso</Label>
                  <Input 
                    id="floor" 
                    value={formData.location?.floor || ''}
                    onChange={(e) => handleInputChange('location', {
                      ...formData.location,
                      floor: e.target.value
                    })}
                    placeholder="Ej: 3er piso, Planta baja"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Aula/Sala</Label>
                  <Input 
                    id="room" 
                    value={formData.location?.room || ''}
                    onChange={(e) => handleInputChange('location', {
                      ...formData.location,
                      room: e.target.value
                    })}
                    placeholder="Ej: Aula 301, Laboratorio 2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_info">Información Adicional</Label>
                <Textarea 
                  id="additional_info" 
                  value={formData.location?.additional_info || ''}
                  onChange={(e) => handleInputChange('location', {
                    ...formData.location,
                    additional_info: e.target.value
                  })}
                  placeholder="Cualquier información adicional que ayude a ubicar el incidente..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/reportes')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Reporte'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}