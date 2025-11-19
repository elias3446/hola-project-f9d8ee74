import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionTextarea } from "./MentionTextarea";

export const CreatePost = ({ onPost }: { onPost: (content: string, images?: string[]) => void }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const { profile } = useProfile();

  const handleSubmit = () => {
    if (content.trim()) {
      onPost(content, images.length > 0 ? images : undefined);
      setContent("");
      setImages([]);
    }
  };

  const handleUploadSuccess = (result: any) => {
    setImages((prev) => [...prev, result.secure_url]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0">
          <UserAvatar
            avatar={profile?.avatar}
            name={profile?.name}
            username={profile?.username}
            email={profile?.email}
            size="sm"
            showName={false}
            enableModal={true}
          />
        </div>
        <div className="flex-1 relative">
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="¿Qué está pasando? Usa # para hashtags y @ para mencionar"
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0"
            enableHashtags={true}
            enableMentions={true}
          />
          
          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <CloudinaryUploadWidget
              onUploadSuccess={handleUploadSuccess}
              folder="social-posts"
              maxFiles={4}
              buttonText="Imagen"
              buttonVariant="ghost"
              buttonClassName="text-muted-foreground"
              showLimits={true}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
