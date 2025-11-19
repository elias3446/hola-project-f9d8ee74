import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, X, Eye, Trash2, Pause, Play, Heart, Smile, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Estado } from "@/hooks/useEstados";
import { useAuth } from "@/hooks/useAuth";
import { StatusReactions } from "./StatusReactions";
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

interface StatusViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estados: Estado[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onRegisterView: (estadoId: string) => void;
  onDelete?: (estadoId: string) => void;
  onAddReaction?: (estadoId: string, emoji: string) => void;
  onRemoveReaction?: (estadoId: string) => void;
}

export const StatusView = ({ 
  open, 
  onOpenChange, 
  estados, 
  currentIndex, 
  onIndexChange,
  onRegisterView,
  onDelete,
  onAddReaction,
  onRemoveReaction
}: StatusViewProps) => {
  const { profile } = useAuth();
  const [progress, setProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const currentEstado = estados[currentIndex];
  const isOwnStatus = currentEstado?.user_id === profile?.id;
  const myReaction = currentEstado?.reacciones?.find(r => r.user_id === profile?.id);

  console.log('[StatusView] Estado actual:', {
    estadoUserId: currentEstado?.user_id,
    profileId: profile?.id,
    isOwnStatus,
    totalEstados: estados.length,
    hasReactionButtons: !isOwnStatus,
    myReaction
  });

  useEffect(() => {
    if (!open || !currentEstado) return;

    // Registrar vista (incluyendo propios estados)
    onRegisterView(currentEstado.id);

    // Reset progress when changing estado
    setProgress(0);
  }, [currentIndex, open, currentEstado?.id]);

  useEffect(() => {
    if (!open || !currentEstado || isPaused) return;

    // Progreso automático
    const duration = 5000; // 5 segundos por estado
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, open, currentEstado?.id, isPaused]);

  const handleNext = () => {
    if (currentIndex < estados.length - 1) {
      onIndexChange(currentIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 500);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleDelete = () => {
    if (onDelete && currentEstado) {
      onDelete(currentEstado.id);
      setDeleteDialogOpen(false);
      if (estados.length <= 1) {
        onOpenChange(false);
      } else {
        handleNext();
      }
    }
  };

  const handleReaction = (emoji: string) => {
    if (!currentEstado) return;
    onAddReaction?.(currentEstado.id, emoji);
    setShowReactionPicker(false);
  };

  const quickReactions = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

  if (!currentEstado) return null;

  const viewCount = Array.isArray(currentEstado.vistas) ? currentEstado.vistas.length : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full h-screen sm:h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header con progreso múltiple */}
          <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 bg-gradient-to-b from-black/60 to-transparent">
            {/* Barras de progreso múltiples */}
            <div className="flex gap-1 mb-3">
              {estados.map((_, index) => (
                <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ 
                      width: index < currentIndex 
                        ? '100%' 
                        : index === currentIndex 
                        ? `${progress}%` 
                        : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserAvatar
                  avatar={currentEstado.profiles?.avatar}
                  name={currentEstado.profiles?.name}
                  username={currentEstado.profiles?.username}
                  size="sm"
                  showName={false}
                  className="ring-0 border-0"
                />
                <div className="text-white">
                  <p className="font-medium text-sm">
                    {currentEstado.profiles?.name || currentEstado.profiles?.username || 'Usuario'}
                  </p>
                  <p className="text-xs opacity-80">
                    {formatDistanceToNow(new Date(currentEstado.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwnStatus && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div 
            className="relative bg-black w-full flex-1 flex items-center justify-center overflow-hidden"
            onClick={handlePause}
          >
            {(() => {
              // Detectar si es un post compartido
              let sharedPostData = null;
              try {
                if (currentEstado.contenido?.startsWith('{') && currentEstado.contenido?.includes('__shared_post__')) {
                  sharedPostData = JSON.parse(currentEstado.contenido);
                }
              } catch (e) {
                // No es un post compartido, continuar normalmente
              }

              if (sharedPostData) {
                // Renderizar post compartido como tarjeta
                return (
                  <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                    <div className="max-w-md w-full bg-card/95 backdrop-blur-sm rounded-xl border border-border overflow-hidden shadow-xl">
                      <div className="p-3 bg-muted/30 border-b border-border">
                        <div className="flex gap-2 items-center text-xs text-muted-foreground">
                          <Repeat2 className="h-3 w-3" />
                          <span>Publicación compartida</span>
                        </div>
                      </div>
                      <div className="p-4">
                        {sharedPostData.author && (
                          <div className="flex gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={sharedPostData.author.avatar || undefined} />
                              <AvatarFallback>
                                {sharedPostData.author.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{sharedPostData.author.name}</p>
                              <p className="text-xs text-muted-foreground">
                                @{sharedPostData.author.username}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {sharedPostData.content && (
                          <p className="text-sm mb-3 whitespace-pre-wrap break-words">
                            {sharedPostData.content}
                          </p>
                        )}
                        
                        {sharedPostData.images && sharedPostData.images.length > 0 && (
                          <div className="rounded-lg overflow-hidden">
                            <img 
                              src={sharedPostData.images[0]} 
                              alt="Contenido compartido" 
                              className="w-full object-cover max-h-64"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else if (currentEstado.imagenes && currentEstado.imagenes.length > 0) {
                return (
                  <>
                    <img
                      src={currentEstado.imagenes[0]}
                      alt="Estado"
                      className="w-full h-full object-contain"
                    />
                    {currentEstado.contenido && (
                      <div className="absolute left-0 right-0 bottom-24 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent pointer-events-none">
                        <p className="text-white text-sm break-words">
                          {currentEstado.contenido}
                        </p>
                      </div>
                    )}
                  </>
                );
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <p className="text-white text-xl text-center break-words">
                      {currentEstado.contenido}
                    </p>
                  </div>
                );
              }
            })()}

            {/* Botón de pausa central */}
            {showPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm animate-scale-in">
                  {isPaused ? (
                    <Pause className="h-12 w-12 text-white" />
                  ) : (
                    <Play className="h-12 w-12 text-white fill-white" />
                  )}
                </div>
              </div>
            )}

            {/* Navegación */}
            {currentIndex > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {currentIndex < estados.length - 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Footer con vistas y reacciones */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent pointer-events-none">
            <div className="flex flex-col gap-2">
              {/* Reacciones */}
              {currentEstado.reacciones && currentEstado.reacciones.length > 0 && (
                <div className="pointer-events-auto">
                  <StatusReactions
                    estadoId={currentEstado.id}
                    reactions={currentEstado.reacciones}
                    currentUserId={profile?.id}
                    onToggleReaction={(estadoId, emoji) => {
                      const userReaction = currentEstado.reacciones?.find(
                        r => r.user_id === profile?.id && r.emoji === emoji
                      );
                      if (userReaction) {
                        onRemoveReaction?.(estadoId);
                      } else {
                        onAddReaction?.(estadoId, emoji);
                      }
                    }}
                    onShowPicker={() => setShowReactionPicker(!showReactionPicker)}
                  />
                </div>
              )}

              {/* Picker de reacciones */}
              {showReactionPicker && (
                <div className="flex gap-2 justify-center pointer-events-auto animate-scale-in">
                  {quickReactions.map((emoji) => (
                    <Button
                      key={emoji}
                      size="sm"
                      variant="ghost"
                      className="text-2xl hover:scale-125 transition-transform h-10 w-10 p-0 bg-white/10 hover:bg-white/20"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              )}

              {/* Vistas y botón reaccionar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Vistas (solo para propios estados) */}
                  {isOwnStatus && (
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Eye className="h-4 w-4" />
                      <span>{viewCount} {viewCount === 1 ? 'vista' : 'vistas'}</span>
                    </div>
                  )}
                  
                  {/* Botón reaccionar si no hay reacciones */}
                  {(!currentEstado.reacciones || currentEstado.reacciones.length === 0) && (
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-8 px-3 gap-2 bg-white/10"
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                      >
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">Reaccionar</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El estado será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
