import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ImageModal } from "./ImageModal";
import { CommentSection } from "./CommentSection";
import { renderTextWithHashtags } from "@/lib/hashtagUtils";
import { Link } from "react-router-dom";
import { ShareDialog } from "./ShareDialog";
import { useState, useEffect } from "react";

interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    user_id?: string;
    author: {
      name: string;
      avatar: string | null;
      username: string;
    };
    content: string;
    image?: string;
    timestamp: Date;
    likes: number;
    comments: number;
    views: number;
    shares: number;
    isLiked?: boolean;
  };
  onToggleLike?: (postId: string) => void;
  onCommentCountChange?: (postId: string, increment: number) => void;
  onShareCountChange?: (postId: string, increment: number) => void;
  onHashtagClick?: (hashtag: string) => void;
  onImageOpen?: () => void;
  onRegisterView?: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onShareAsStatus?: (postId: string, content: string, images?: string[]) => Promise<void>;
}

export const PostDetailModal = ({
  open,
  onOpenChange,
  post,
  onToggleLike,
  onCommentCountChange,
  onShareCountChange,
  onHashtagClick,
  onImageOpen,
  onRegisterView,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  onShareAsStatus,
}: PostDetailModalProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [viewsCount, setViewsCount] = useState(post.views);
  const [isCloudinaryOpen, setIsCloudinaryOpen] = useState(false);
  
  // Sync with external updates from parent
  useEffect(() => {
    setLiked(!!post.isLiked);
    setLikesCount(post.likes);
    setCommentsCount(post.comments);
    setSharesCount(post.shares);
    setViewsCount(post.views);
  }, [post.isLiked, post.likes, post.comments, post.shares, post.views]);

  // Manage body class for Cloudinary z-index override
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
  const handleLike = () => {
    onRegisterView?.();
    // Optimistic UI update
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
      return next;
    });
    onToggleLike?.(post.id);
  };

  const handleCommentAdded = () => {
    onRegisterView?.();
    setCommentsCount((prev) => prev + 1);
    if (onCommentCountChange) {
      onCommentCountChange(post.id, 1);
    }
  };

  const handleCommentDeleted = (count?: number) => {
    const decrement = count || -1;
    setCommentsCount((prev) => Math.max(0, prev + decrement));
    if (onCommentCountChange) {
      onCommentCountChange(post.id, decrement);
    }
  };

  const handleShare = () => {
    setSharesCount((prev) => prev + 1);
    if (onShareCountChange) {
      onShareCountChange(post.id, 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPortal>
        <DialogOverlay className={isCloudinaryOpen ? "opacity-30" : ""} />
        <DialogContent
          className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden flex flex-col p-0"
          onInteractOutside={(e) => {
            // Prevent closing dialog when clicking outside if Cloudinary is open
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Prevent closing dialog when pointer down outside if Cloudinary is open
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing dialog with Escape if Cloudinary is open
            if (isCloudinaryOpen) {
              e.preventDefault();
            }
          }}
        >
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-semibold">Detalle de la publicación</DialogTitle>
            {/* Only show navigation buttons if navigation callbacks are provided */}
            {(onNavigatePrevious || onNavigateNext) && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNavigatePrevious}
                  disabled={!hasPrevious}
                  className="h-8 w-8"
                  title="Publicación anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNavigateNext}
                  disabled={!hasNext}
                  className="h-8 w-8"
                  title="Siguiente publicación"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogDescription className="sr-only">Acciones y comentarios de la publicación</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Post Header */}
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0">
                <UserAvatar
                  avatar={post.author.avatar}
                  name={post.author.name}
                  username={post.author.username}
                  size="md"
                  enableModal={true}
                  showName={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/usuario/${post.author.username}`}
                  className="hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  <p className="font-semibold truncate">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{post.author.username}
                  </p>
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(post.timestamp, {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-sm sm:text-base whitespace-pre-wrap mb-4 break-words">
                {renderTextWithHashtags(post.content, (hashtag) => {
                  onHashtagClick?.(hashtag);
                  onOpenChange(false);
                })}
              </p>

              {post.image && (
                <ImageModal
                  src={post.image}
                  alt="Contenido del post"
                  className="rounded-lg w-full object-cover max-h-[300px] sm:max-h-[500px]"
                  onOpen={onImageOpen}
                />
              )}
            </div>

            {/* Post Stats */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 py-3 border-y text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-foreground">{likesCount}</strong> Me gusta
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-foreground">{commentsCount}</strong>{" "}
                  Comentarios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-foreground">{sharesCount}</strong> Compartidos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">
                  <strong className="text-foreground">{viewsCount}</strong> Vistas
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 py-3 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex-1 hover:text-destructive text-xs sm:text-sm ${
                  liked ? "text-destructive" : ""
                }`}
              >
                <Heart
                  className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${liked ? "fill-current" : ""}`}
                />
                {liked ? "Te gusta" : "Me gusta"}
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 hover:text-accent text-xs sm:text-sm"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Compartir
              </Button>
            </div>

            {/* Comments Section */}
            <div className="mt-4">
        <CommentSection 
          postId={post.id} 
          onCommentAdded={handleCommentAdded} 
          onCommentDeleted={handleCommentDeleted}
          onCloudinaryOpenChange={setIsCloudinaryOpen}
        />
            </div>
          </div>
        </div>
      </DialogContent>
      </DialogPortal>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        postId={post.id}
        postContent={post.content}
        postImages={post.image ? [post.image] : undefined}
        postAuthor={post.author}
        postTimestamp={post.timestamp}
        onShareComplete={handleShare}
        onShareAsStatus={
          onShareAsStatus
            ? async () => {
                await onShareAsStatus(post.id, post.content, post.image ? [post.image] : undefined);
              }
            : undefined
        }
      />
    </Dialog>
  );
};
