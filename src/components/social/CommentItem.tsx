import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Comment } from "@/hooks/useComments";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageModal } from "./ImageModal";
import { z } from "zod";
import { toast } from "sonner";

const commentSchema = z.object({
  contenido: z.string()
    .trim()
    .min(1, { message: "El comentario no puede estar vacío" })
    .max(2000, { message: "El comentario no puede exceder 2000 caracteres" })
});

interface CommentItemProps {
  comment: Comment;
  postId: string;
  level?: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: (count?: number) => void;
  onCloudinaryOpenChange?: (open: boolean) => void;
  addComment: (contenido: string, comentarioPadreId?: string, imagenes?: string[]) => Promise<void>;
  updateComment: (commentId: string, contenido: string, imagenes?: string[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export const CommentItem = ({ comment, postId, level = 0, onCommentAdded, onCommentDeleted, onCloudinaryOpenChange, addComment, updateComment, deleteComment }: CommentItemProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.contenido);
  const [editedImages, setEditedImages] = useState<string[]>(comment.imagenes || []);

  // Get current user's profile ID
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentUserProfileId(data.id);
        });
    }
  }, [user]);

  const handleReply = async (contenido: string, imagenes?: string[]) => {
    await addComment(contenido, comment.id, imagenes);
    setShowReplyForm(false);
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const handleEdit = async (contenido: string, imagenes?: string[]) => {
    try {
      const validated = commentSchema.parse({ contenido });
      await updateComment(comment.id, validated.contenido, imagenes);
      setIsEditing(false);
      setEditedContent(validated.contenido);
      setEditedImages(imagenes || []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.contenido);
    setEditedImages(comment.imagenes || []);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  // Count total comments (parent + all children recursively)
  const countTotalComments = (comment: Comment): number => {
    let count = 1; // Count the comment itself
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        count += countTotalComments(reply);
      });
    }
    return count;
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const totalDeleted = countTotalComments(comment);
      await deleteComment(comment.id);
      if (onCommentDeleted) {
        // Pass negative count to decrement
        onCommentDeleted(-totalDeleted);
      }
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = currentUserProfileId === comment.user_id;
  const maxLevel = 3; // Maximum nesting level

  return (
    <div className={`${level > 0 ? "ml-8 pl-4 border-l-2" : ""}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <UserAvatar
            avatar={comment.author.avatar}
            name={comment.author.name}
            username={comment.author.username}
            size="sm"
            enableModal={true}
            showName={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="bg-muted/50 rounded-lg p-3">
              <CommentForm
                onSubmit={handleEdit}
                onCancel={handleCancelEdit}
                placeholder="Editar comentario..."
                initialValue={editedContent}
                initialImages={editedImages}
                onCloudinaryOpenChange={onCloudinaryOpenChange}
              />
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/usuario/${comment.author.username}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {comment.author.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
                {comment.created_at !== comment.updated_at && (
                  <span className="text-xs text-muted-foreground italic">
                    (editado)
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.contenido}</p>
              
              {/* Display images */}
              {comment.imagenes && comment.imagenes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.imagenes.map((imageUrl, index) => (
                    <ImageModal
                      key={index}
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      className="max-h-40 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1 ml-3">
              {level < maxLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Responder
                </Button>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? "Ocultar" : "Ver"} {comment.replies.length} {comment.replies.length === 1 ? "respuesta" : "respuestas"}
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          )}

          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={handleDeleteConfirm}
            title="Eliminar comentario"
            description="¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            variant="destructive"
            loading={isDeleting}
          />

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                placeholder={`Responder a ${comment.author.name}...`}
                onCancel={() => setShowReplyForm(false)}
                onCloudinaryOpenChange={onCloudinaryOpenChange}
              />
            </div>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  level={level + 1}
                  onCommentAdded={onCommentAdded}
                  onCommentDeleted={onCommentDeleted}
                  onCloudinaryOpenChange={onCloudinaryOpenChange}
                  addComment={addComment}
                  updateComment={updateComment}
                  deleteComment={deleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
