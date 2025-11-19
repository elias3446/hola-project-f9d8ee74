import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Bookmark, Flag, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditPostDialog } from "./EditPostDialog";
import { ReportPostDialog } from "./ReportPostDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostOptionsMenuProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image?: string;
    isSaved?: boolean;
  };
  author: {
    name: string;
  };
  currentUserId?: string;
  isUserMuted?: boolean;
  onEdit?: (postId: string, content: string, images?: string[]) => void;
  onDelete?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
  onMuteUser?: (userId: string) => void;
  onUnmuteUser?: (userId: string) => void;
}

export const PostOptionsMenu = ({
  post,
  author,
  currentUserId,
  isUserMuted,
  onEdit,
  onDelete,
  onToggleSave,
  onMuteUser,
  onUnmuteUser,
}: PostOptionsMenuProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = currentUserId && currentUserId === post.user_id;

  // Debug logging
  console.log('[PostOptionsMenu]', {
    postId: post.id.substring(0, 8),
    postUserId: post.user_id?.substring(0, 8),
    currentUserId: currentUserId?.substring(0, 8),
    isOwner
  });

  const handleEditClick = () => {
    setShowEditDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from("publicaciones")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Publicación eliminada");
      onDelete?.(post.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleSaveClick = () => {
    onToggleSave?.(post.id);
    
    // Show toast notification
    if (post.isSaved) {
      toast.success("Publicación removida de guardados");
    } else {
      toast.success("Publicación guardada exitosamente", {
        description: "Puedes encontrarla en tu perfil"
      });
    }
  };

  const handleReportClick = () => {
    setShowReportDialog(true);
  };

  const handleMuteClick = () => {
    if (isUserMuted) {
      onUnmuteUser?.(post.user_id);
    } else {
      onMuteUser?.(post.user_id);
    }
  };

  const handleUpdate = async (postId: string, content: string, images?: string[]) => {
    if (onEdit) {
      await onEdit(postId, content, images);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwner ? (
            <>
              <DropdownMenuItem onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSaveClick}>
                <Bookmark className={`h-4 w-4 mr-2 transition-all duration-300 ${post.isSaved ? 'fill-current scale-110 text-primary' : 'hover:scale-110'}`} />
                {post.isSaved ? 'Guardado' : 'Guardar'}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleSaveClick}>
                <Bookmark className={`h-4 w-4 mr-2 transition-all duration-300 ${post.isSaved ? 'fill-current scale-110 text-primary' : 'hover:scale-110'}`} />
                {post.isSaved ? 'Guardado' : 'Guardar'}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleReportClick}>
                <Flag className="h-4 w-4 mr-2" />
                Reportar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleMuteClick}>
                <UserX className="h-4 w-4 mr-2" />
                {isUserMuted ? 'Desilenciar' : 'Silenciar'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        post={{
          id: post.id,
          content: post.content,
          image: post.image,
        }}
        onUpdate={handleUpdate}
      />

      <ReportPostDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        postId={post.id}
        postAuthor={author.name}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
