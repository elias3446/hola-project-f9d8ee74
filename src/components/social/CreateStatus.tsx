import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface CreateStatusProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStatus: (
    contenido: string | null,
    imagenes: string[],
    tipo: 'imagen' | 'texto' | 'video',
    compartirEnOtraPlataforma: boolean,
    visibilidad: 'todos' | 'contactos' | 'privado'
  ) => Promise<void>;
  origen: 'mensajes' | 'social';
}

export const CreateStatus = ({ open, onOpenChange, onCreateStatus, origen }: CreateStatusProps) => {
  const [contenido, setContenido] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [visibilidad, setVisibilidad] = useState<'todos' | 'contactos' | 'privado'>('todos');
  const [compartirEnOtraPlataforma, setCompartirEnOtraPlataforma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCloudinaryOpen, setIsCloudinaryOpen] = useState(false);

  // Manage body class for Cloudinary z-index override (same pattern as PostDetailModal)
  useEffect(() => {
    if (isCloudinaryOpen) {
      document.documentElement.classList.add('cloudinary-open');
    } else {
      document.documentElement.classList.remove('cloudinary-open');
    }
    return () => {
      document.documentElement.classList.remove('cloudinary-open');
    };
  }, [isCloudinaryOpen]);

  const handleUploadSuccess = (result: any) => {
    if (result?.secure_url) {
      setImagenes([...imagenes, result.secure_url]);
    }
  };

  const removeImage = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!contenido.trim() && imagenes.length === 0) {
      toast.error("Agrega contenido o imágenes");
      return;
    }

    setLoading(true);
    try {
      const tipo = imagenes.length > 0 ? 'imagen' : 'texto';
      await onCreateStatus(
        contenido.trim() || null,
        imagenes,
        tipo,
        compartirEnOtraPlataforma,
        visibilidad
      );
      
      // Reset form
      setContenido("");
      setImagenes([]);
      setVisibilidad('todos');
      setCompartirEnOtraPlataforma(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPortal>
        <DialogOverlay className={isCloudinaryOpen ? "opacity-30" : ""} />
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Crear Estado</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          {/* Contenido */}
          <div>
            <Label>Contenido</Label>
            <Textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe algo..."
              className="min-h-[100px]"
            />
          </div>

          {/* Imágenes */}
          <div>
            <Label>Imágenes</Label>
            {imagenes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {imagenes.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <CloudinaryUploadWidget
              onUploadSuccess={handleUploadSuccess}
              onOpenChange={setIsCloudinaryOpen}
              folder="estados"
              maxFiles={1}
              buttonText="Agregar Imagen"
              buttonVariant="outline"
              buttonClassName="w-full"
              showLimits={true}
            />
          </div>

          {/* Visibilidad */}
          <div>
            <Label>Visibilidad</Label>
            <RadioGroup value={visibilidad} onValueChange={(v: any) => setVisibilidad(v)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="todos" />
                <Label htmlFor="todos" className="cursor-pointer">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contactos" id="contactos" />
                <Label htmlFor="contactos" className="cursor-pointer">Solo Contactos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="privado" id="privado" />
                <Label htmlFor="privado" className="cursor-pointer">Privado</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Compartir en otra plataforma */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="compartir" className="cursor-pointer">
              {origen === 'mensajes' 
                ? 'Compartir también en Red Social' 
                : 'Compartir también en Mensajes'}
            </Label>
            <Switch
              id="compartir"
              checked={compartirEnOtraPlataforma}
              onCheckedChange={setCompartirEnOtraPlataforma}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || (!contenido.trim() && imagenes.length === 0)}
            >
              {loading ? "Publicando..." : "Publicar Estado"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tu estado será visible por 24 horas
          </p>
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
