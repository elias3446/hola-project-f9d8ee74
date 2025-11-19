import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { MentionTextarea } from "./MentionTextarea";

interface CommentFormProps {
  onSubmit: (content: string, images?: string[]) => Promise<void>;
  placeholder?: string;
  onCancel?: () => void;
  initialValue?: string;
  initialImages?: string[];
  onCloudinaryOpenChange?: (open: boolean) => void;
}

export const CommentForm = ({
  onSubmit,
  placeholder = "Escribe un comentario...",
  onCancel,
  initialValue = "",
  initialImages = [],
  onCloudinaryOpenChange,
}: CommentFormProps) => {
  const [content, setContent] = useState(initialValue);
  const [images, setImages] = useState<string[]>(initialImages);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), images.length > 0 ? images : undefined);
      setContent("");
      setImages([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSuccess = (result: any) => {
    setImages((prev) => [...prev, result.secure_url]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <MentionTextarea
        value={content}
        onChange={setContent}
        placeholder={placeholder}
        className="min-h-[60px] resize-none"
        disabled={isSubmitting}
        enableHashtags={true}
        enableMentions={true}
      />
      
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Preview ${index + 1}`}
                className="h-16 w-16 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <CloudinaryUploadWidget
          onUploadSuccess={handleUploadSuccess}
          onOpenChange={onCloudinaryOpenChange}
          folder="social-comments"
          maxFiles={2}
          buttonText="Imagen"
          buttonVariant="ghost"
          buttonClassName="text-muted-foreground h-9"
          showLimits={true}
        />
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </div>
    </form>
  );
};
