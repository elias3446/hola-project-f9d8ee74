import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, CheckCheck, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Message, TypingUser } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { MessageReactions } from "./MessageReactions";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { EditMessageDialog } from "./EditMessageDialog";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatViewProps {
  messages: Message[];
  loading: boolean;
  typing: TypingUser[];
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => Promise<void>;
}

export const ChatView = ({ messages, loading, typing, onEditMessage, onDeleteMessage }: ChatViewProps) => {
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  
  // Filter out own typing status from display
  const displayTyping = typing.filter(t => t.user_id !== profile?.id);

  // Get message reactions
  const messageIds = messages.map(m => m.id);
  const { reactions, toggleReaction } = useMessageReactions(messageIds);

  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleEditMessage = async (newContent: string) => {
    if (!editingMessage || !onEditMessage) return;
    
    try {
      await onEditMessage(editingMessage.id, newContent);
      toast.success("Mensaje editado");
      setEditingMessage(null);
    } catch (error) {
      toast.error("Error al editar mensaje");
    }
  };

  const isEdited = (message: Message) => {
    return message.updated_at !== message.created_at;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing]);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2",
              i % 2 === 0 ? "justify-end" : "justify-start"
            )}
          >
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
            <Skeleton className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-muted-foreground">
            Envía un mensaje para comenzar la conversación
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.user_id === profile?.id;
          const showAvatar =
            !isOwn &&
            (index === messages.length - 1 ||
              messages[index + 1]?.user_id !== message.user_id);

          return (
            <div
              key={message.id}
              className={cn("flex gap-2 items-end", isOwn && "justify-end")}
            >
              {!isOwn && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {showAvatar ? (
                    <>
                      <AvatarImage src={message.user?.avatar || undefined} />
                      <AvatarFallback>
                        {message.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </Avatar>
              )}

              <div
                className={cn(
                  "flex flex-col w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]",
                  isOwn && "items-end"
                )}
              >
                {!isOwn && showAvatar && (
                  <span className="text-xs text-muted-foreground mb-1 px-3 truncate max-w-full">
                    {message.user?.name || message.user?.username}
                  </span>
                )}

               <div className="relative group">
                  <div
                    className={cn(
                      "rounded-2xl px-3 sm:px-4 py-2 min-w-0 w-fit max-w-full",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {message.imagenes && message.imagenes.length > 0 && (
                      <div className={cn(
                        "grid gap-2 mb-2 max-w-full",
                        message.imagenes.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      )}>
                        {message.imagenes.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Imagen adjunta"
                            className="rounded-lg w-full h-auto max-w-[280px] sm:max-w-xs object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openGallery(message.imagenes!, idx)}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {message.contenido}
                    </p>
                    {isEdited(message) && (
                      <span className={cn(
                        "text-xs italic opacity-70 mt-1 block",
                        isOwn ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        editado
                      </span>
                    )}
                  </div>
                  
                  {/* Edit/Delete menu for own messages */}
                  {isOwn && (onEditMessage || onDeleteMessage) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                            isOwn ? "-left-8" : "-right-8"
                          )}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditMessage && (
                          <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDeleteMessage && (
                          <DropdownMenuItem 
                            onClick={() => setDeletingMessage(message)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1 mt-1 px-3",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "HH:mm", { locale: es })}
                  </span>
                  {isOwn && (
                    <div className="flex items-center">
                      {message.readStatus === 'sent' && (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                      {message.readStatus === 'delivered' && (
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                      )}
                      {message.readStatus === 'read' && (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Message reactions */}
                <MessageReactions
                  messageId={message.id}
                  reactions={reactions.get(message.id) || []}
                  onToggleReaction={toggleReaction}
                  className={isOwn ? "mr-3" : "ml-3"}
                />
              </div>
            </div>
          );
        })}

        {displayTyping.length > 0 && (
          <div className="flex flex-col gap-2">
            {displayTyping.map((typingUser) => (
              <div key={typingUser.user_id} className="flex gap-2 items-end">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {typingUser.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-xs text-muted-foreground mb-1 px-3 block">
                    {typingUser.name}
                  </span>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <ImageGalleryModal
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
      
      {editingMessage && (
        <EditMessageDialog
          open={!!editingMessage}
          onOpenChange={(open) => !open && setEditingMessage(null)}
          currentContent={editingMessage.contenido}
          onSave={handleEditMessage}
        />
      )}
      
      <DeleteMessageDialog
        open={!!deletingMessage}
        onOpenChange={(open) => !open && setDeletingMessage(null)}
        onConfirm={async (deleteForEveryone) => {
          if (deletingMessage && onDeleteMessage) {
            try {
              await onDeleteMessage(deletingMessage.id, deleteForEveryone);
              toast.success(deleteForEveryone ? "Mensaje eliminado para todos" : "Mensaje eliminado para ti");
            } catch (error) {
              toast.error("Error al eliminar mensaje");
            }
          }
        }}
        isOwnMessage={deletingMessage?.user_id === profile?.id}
      />
    </ScrollArea>
  );
};
