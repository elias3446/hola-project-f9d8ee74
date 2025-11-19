import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { EmojiPicker } from "./EmojiPicker";

interface MessageInputProps {
  onSend: (contenido: string, imagenes?: string[]) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean; // Si el usuario salió del grupo
}

export const MessageInput = ({ onSend, onTyping, disabled = false }: MessageInputProps) => {
  const { profile } = useAuth();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const handleTyping = () => {
    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  };

  const handleImageUpload = (result: any) => {
    if (result?.secure_url) {
      setImages([...images, result.secure_url]);
    }
  };

  const handleImageError = (error: any) => {
    console.error("Error uploading image:", error);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(message + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = async () => {
    if (!message.trim() && images.length === 0) return;

    try {
      await onSend(message || "Imagen", images);
      setMessage("");
      setImages([]);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      toast.error("Error al enviar mensaje");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div className="border-t bg-background p-3 sm:p-4">
        <div className="text-center text-sm text-muted-foreground p-2 bg-muted rounded-md">
          Has salido de este grupo. Elimina la conversación si ya no deseas verla.
        </div>
      </div>
    );
  }

  return (
    <div className="border-t bg-background p-3 sm:p-4">
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0 group">
              <img
                src={img}
                alt="Preview"
                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-lg border-2 border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(img, '_blank')}
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2">
        <CloudinaryUploadWidget
          onUploadSuccess={handleImageUpload}
          onUploadError={handleImageError}
          folder="mensajes"
          maxFiles={1}
          maxFileSize={5242880}
          allowedFormats={["jpg", "png", "jpeg", "gif", "webp"]}
          buttonText=""
          buttonVariant="ghost"
          buttonClassName="flex-shrink-0 h-10 w-10 p-0"
          showLimits={true}
        />

        <div className="flex-1 relative min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="min-h-[40px] sm:min-h-[44px] max-h-28 sm:max-h-32 resize-none pr-10 text-sm sm:text-base"
            rows={1}
          />
          <EmojiPicker 
            onEmojiSelect={handleEmojiSelect}
            className="absolute right-1 bottom-1 h-7 w-7 sm:h-8 sm:w-8"
          />
        </div>

        <Button
          onClick={handleSend}
          size="icon"
          disabled={!message.trim() && images.length === 0}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
};
