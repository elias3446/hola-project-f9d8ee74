import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Eye, Maximize2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ImageModal } from "./ImageModal";
import { CommentSection } from "./CommentSection";
import { PostDetailModal } from "./PostDetailModal";
import { ShareDialog } from "./ShareDialog";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { RepostedPostCard } from "./RepostedPostCard";
import { useState } from "react";
import { renderTextWithHashtags } from "@/lib/hashtagUtils";
import { useAuth } from "@/hooks/useAuth";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
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
    isSaved?: boolean;
    // Repost fields
    repost_of?: string | null;
    repost_comentario?: string | null;
    originalPost?: {
      author: {
        name: string;
        avatar: string | null;
        username: string;
      };
      content: string;
      timestamp: Date;
      image?: string;
    } | null;
  };
  onToggleLike?: (postId: string) => void;
  onCommentCountChange?: (postId: string, increment: number) => void;
  onShareCountChange?: (postId: string, increment: number) => void;
  onView?: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onDelete?: (postId: string) => void;
  onUpdate?: (postId: string, content: string, images?: string[]) => void;
  onToggleSave?: (postId: string) => void;
  onMuteUser?: (userId: string) => void;
  onUnmuteUser?: (userId: string) => void;
  isUserMuted?: boolean;
  onDetailModalOpen?: (postId: string) => void;
  onRepost?: (originalPostId: string, comment: string) => Promise<void>;
  onShareAsStatus?: (postId: string, content: string, images?: string[]) => Promise<void>;
}

export const PostCard = ({ post, onToggleLike, onCommentCountChange, onShareCountChange, onView, onHashtagClick, onDelete, onUpdate, onToggleSave, onMuteUser, onUnmuteUser, isUserMuted, onDetailModalOpen, onRepost, onShareAsStatus }: PostCardProps) => {
  const { profile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [hasRegisteredView, setHasRegisteredView] = useState(false);
  
  const isOwner = profile?.id === post.user_id;

  const registerViewOnce = () => {
    if (!hasRegisteredView && onView) {
      onView(post.id);
      setHasRegisteredView(true);
    }
  };

  const handleLike = () => {
    registerViewOnce();
    if (onToggleLike) {
      onToggleLike(post.id);
    }
  };

  const handleCommentClick = () => {
    registerViewOnce();
    setShowComments(!showComments);
  };

  const handleImageClick = () => {
    registerViewOnce();
  };

  const handleDetailModalOpen = () => {
    registerViewOnce();
    if (onDetailModalOpen) {
      onDetailModalOpen(post.id);
    } else {
      setShowDetailModal(true);
    }
  };

  const handleCommentAdded = () => {
    if (onCommentCountChange) {
      onCommentCountChange(post.id, 1);
    }
  };

  const handleCommentDeleted = (count?: number) => {
    if (onCommentCountChange) {
      onCommentCountChange(post.id, count || -1);
    }
  };

  return (
    <>
      <Card id={`post-${post.id}`} className="p-4 mb-4 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <UserAvatar
              avatar={post.author.avatar}
              name={post.author.name}
              username={post.author.username}
              size="sm"
              enableModal={true}
              showName={false}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <Link to={`/usuario/${post.author.username}`} className="hover:underline">
                <div>
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{post.author.username} · {formatDistanceToNow(post.timestamp, { addSuffix: true, locale: es })}
                  </p>
                </div>
              </Link>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleDetailModalOpen}
                  title="Ver detalles completos"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                {profile && (
                  <PostOptionsMenu
                    post={{
                      id: post.id,
                      user_id: post.user_id,
                      content: post.content,
                      image: post.image,
                      isSaved: post.isSaved,
                    }}
                    author={{
                      name: post.author.name,
                    }}
                    currentUserId={profile.id}
                    isUserMuted={isUserMuted}
                    onEdit={onUpdate}
                    onDelete={onDelete}
                    onToggleSave={onToggleSave}
                    onMuteUser={onMuteUser}
                    onUnmuteUser={onUnmuteUser}
                  />
                )}
              </div>
            </div>
          
          {/* Show repost comment if this is a repost */}
          {post.repost_of && post.repost_comentario && (
            <p className="text-sm mb-3 whitespace-pre-wrap">
              {renderTextWithHashtags(post.repost_comentario, onHashtagClick)}
            </p>
          )}

          {/* Show original post if this is a repost */}
          {post.repost_of && post.originalPost && (
            <RepostedPostCard
              originalPost={{
                author: post.originalPost.author,
                content: post.originalPost.content,
                timestamp: new Date(post.originalPost.timestamp),
                image: post.originalPost.image,
              }}
              onHashtagClick={onHashtagClick}
            />
          )}

          {/* Show regular content only if not a repost */}
          {!post.repost_of && (
            <>
              <p className="text-sm mb-3 whitespace-pre-wrap">
                {renderTextWithHashtags(post.content, onHashtagClick)}
              </p>
          
              {post.image && (
                <ImageModal
                  src={post.image}
                  alt="Contenido del post"
                  className="rounded-lg w-full object-cover max-h-96 mb-3"
                  onOpen={handleImageClick}
                />
              )}
            </>
          )}
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`hover:text-destructive ${post.isLiked ? "text-destructive" : ""}`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span className="ml-1 text-xs">{post.likes}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:text-primary"
              onClick={handleCommentClick}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1 text-xs">{post.comments}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:text-accent"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4" />
              <span className="ml-1 text-xs">{post.shares}</span>
            </Button>

            <div className="flex items-center gap-1 text-xs ml-auto">
              <Eye className="h-4 w-4" />
              <span>{post.views}</span>
            </div>
          </div>

          {showComments && (
            <CommentSection 
              postId={post.id} 
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          )}
        </div>
      </div>
    </Card>

    {!onDetailModalOpen && (
      <PostDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        post={post}
        onToggleLike={onToggleLike}
        onCommentCountChange={onCommentCountChange}
        onHashtagClick={onHashtagClick}
        onImageOpen={handleImageClick}
        onRegisterView={registerViewOnce}
      />
    )}

    <ShareDialog
      open={showShareDialog}
      onOpenChange={setShowShareDialog}
      postId={post.repost_of || post.id}
      postContent={post.repost_of ? (post.originalPost?.content || "") : post.content}
      postImages={post.repost_of ? (post.originalPost?.image ? [post.originalPost.image] : undefined) : (post.image ? [post.image] : undefined)}
      postAuthor={post.repost_of ? post.originalPost?.author : post.author}
      postTimestamp={post.repost_of ? (post.originalPost?.timestamp || post.timestamp) : post.timestamp}
      onShareComplete={() => onShareCountChange?.(post.repost_of || post.id, 1)}
      onRepost={
        onRepost && !post.repost_of
          ? async (comment: string) => {
              await onRepost(post.id, comment);
            }
          : undefined
      }
      onShareAsStatus={
        onShareAsStatus && !post.repost_of
          ? async () => {
              await onShareAsStatus(
                post.id, 
                post.content, 
                post.image ? [post.image] : undefined
              );
            }
          : onShareAsStatus && post.repost_of && post.originalPost
          ? async () => {
              await onShareAsStatus(
                post.repost_of!,
                post.originalPost!.content,
                post.originalPost!.image ? [post.originalPost!.image] : undefined
              );
            }
          : undefined
      }
    />
    </>
  );
};
