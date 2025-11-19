import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { X } from "lucide-react";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    image?: string;
  };
  onUpdate?: (postId: string, content: string, images?: string[]) => void;
}

export const EditPostDialog = ({ open, onOpenChange, post, onUpdate }: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState<string[]>(post.image ? [post.image] : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloudinaryOpen, setIsCloudinaryOpen] = useState(false);

  // Sincroniza la clase global para que las reglas de Cloudinary se apliquen de forma consistente
  useEffect(() => {
    if (isCloudinaryOpen) {
      document.documentElement.classList.add("cloudinary-open");
    } else {
      document.documentElement.classList.remove("cloudinary-open");
    }
    return () => {
      document.documentElement.classList.remove("cloudinary-open");
    };
  }, [isCloudinaryOpen]);

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setContent(post.content);
      setImages(post.image ? [post.image] : []);
    }
    onOpenChange(newOpen);
  };

  const handleImageUpload = (url: string) => {
    setImages([...images, url]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (content.trim() && onUpdate) {
      setIsSubmitting(true);
      try {
        await onUpdate(post.id, content, images.length > 0 ? images : undefined);
        handleOpenChange(false);
      } catch (error) {
        console.error("Error updating post:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        className="sm:max-w-[500px]"
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
          <DialogTitle>Editar publicación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="¿Qué estás pensando?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <CloudinaryUploadWidget 
              onUploadSuccess={(result) => handleImageUpload(result.secure_url)}
              onOpenChange={setIsCloudinaryOpen}
              buttonText="Agregar imagen"
              buttonVariant="outline"
              showLimits={true}
            />
            <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
