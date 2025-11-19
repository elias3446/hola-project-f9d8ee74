import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Loader2 } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: (count?: number) => void;
  onCloudinaryOpenChange?: (open: boolean) => void;
}

export const CommentSection = ({ postId, onCommentAdded, onCommentDeleted, onCloudinaryOpenChange }: CommentSectionProps) => {
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(postId);
  const [showComments, setShowComments] = useState(false);

  const handleAddComment = async (contenido: string, imagenes?: string[]) => {
    await addComment(contenido, undefined, imagenes);
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  if (!showComments) {
    return (
      <button
        onClick={() => setShowComments(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Ver comentarios ({comments.length})
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Comentarios ({comments.length})
        </h4>
        <button
          onClick={() => setShowComments(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ocultar
        </button>
      </div>

      <CommentForm 
        onSubmit={handleAddComment} 
        placeholder="Escribe un comentario..." 
        onCloudinaryOpenChange={onCloudinaryOpenChange}
      />

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postId={postId}
              onCommentAdded={onCommentAdded}
              onCommentDeleted={onCommentDeleted}
              addComment={addComment}
              updateComment={updateComment}
              deleteComment={deleteComment}
              onCloudinaryOpenChange={onCloudinaryOpenChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
