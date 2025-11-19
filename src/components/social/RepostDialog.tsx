import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RepostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    author: {
      name: string;
      avatar: string | null;
      username: string;
    };
    content: string;
    timestamp: Date;
  };
  onRepost: (comment: string) => Promise<void>;
}

export const RepostDialog = ({
  open,
  onOpenChange,
  post,
  onRepost,
}: RepostDialogProps) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    setLoading(true);
    try {
      await onRepost(comment);
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error reposting:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5" />
            Compartir en tu perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Añade un comentario (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500
            </p>
          </div>

          {/* Original post preview */}
          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <div className="flex gap-3">
              <UserAvatar
                avatar={post.author.avatar}
                name={post.author.name}
                username={post.author.username}
                size="sm"
                showName={false}
              />
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{post.author.username} ·{" "}
                    {formatDistanceToNow(post.timestamp, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-3">
                  {post.content}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleRepost} disabled={loading}>
            {loading ? "Compartiendo..." : "Compartir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
