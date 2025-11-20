import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Check,
  Repeat2,
  Clock,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  postImages?: string[];
  postAuthor?: {
    name: string;
    avatar: string | null;
    username: string;
  };
  postTimestamp?: Date;
  onShareComplete?: () => void;
  onRepost?: (comment: string) => Promise<void>;
  onShareAsStatus?: () => Promise<void>;
  onRefreshStates?: () => void;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export const ShareDialog = ({
  open,
  onOpenChange,
  postId,
  postContent,
  postImages,
  postAuthor,
  postTimestamp,
  onShareComplete,
  onRepost,
  onShareAsStatus,
  onRefreshStates,
}: ShareDialogProps) => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showInternalShare, setShowInternalShare] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [sharingAsStatus, setSharingAsStatus] = useState(false);
  const [repostComment, setRepostComment] = useState("");
  const [statusVisibilidad, setStatusVisibilidad] = useState<'todos' | 'contactos' | 'privado'>('todos');
  const [compartirEnMensajes, setCompartirEnMensajes] = useState(false);
  const [compartirEnSocial, setCompartirEnSocial] = useState(true);

  const postUrl = `${window.location.origin}/red-social#post-${postId}`;
  const shareText = postContent.length > 100 
    ? postContent.substring(0, 100) + "..." 
    : postContent;

  const registerShare = async (tipo: string, destinatarioId?: string) => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) return;

      await supabase.from("publicacion_compartidos").insert({
        publicacion_id: postId,
        user_id: profileData.id,
        tipo_compartido: tipo,
        destinatario_id: destinatarioId || null,
      });

      onShareComplete?.();
    } catch (error) {
      console.error("Error registering share:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      await registerShare("enlace");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, "_blank");
    registerShare("twitter");
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      postUrl
    )}`;
    window.open(facebookUrl, "_blank");
    registerShare("facebook");
  };

  const handleShareLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      postUrl
    )}`;
    window.open(linkedinUrl, "_blank");
    registerShare("linkedin");
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `${shareText}\n\n${postUrl}`
    )}`;
    window.open(whatsappUrl, "_blank");
    registerShare("whatsapp");
  };

  const handleInternalShare = async () => {
    setShowInternalShare(true);
    setLoading(true);
    
    try {
      // Get current user's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profileData) {
        toast.error("Error al obtener tu perfil");
        return;
      }

      // Fetch users (excluding current user)
      const { data: usersData, error } = await supabase
        .from("profiles")
        .select("id, name, username, avatar")
        .eq("estado", "activo")
        .neq("id", profileData.id)
        .order("name");

      if (error) throw error;

      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToUser = async (recipientId: string) => {
    if (!user) return;

    setSending(true);
    try {
      // Get current user's profile
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!senderProfile) throw new Error("Profile not found");

      // Check if conversation exists
      const { data: existingConversations } = await supabase
        .from("participantes_conversacion")
        .select("conversacion_id")
        .eq("user_id", senderProfile.id);

      let conversationId: string | null = null;

      if (existingConversations && existingConversations.length > 0) {
        // Check if any conversation has exactly these two participants
        for (const conv of existingConversations) {
          const { data: participants } = await supabase
            .from("participantes_conversacion")
            .select("user_id")
            .eq("conversacion_id", conv.conversacion_id);

          if (
            participants?.length === 2 &&
            participants.some((p) => p.user_id === recipientId)
          ) {
            conversationId = conv.conversacion_id;
            break;
          }
        }
      }

      // Create new conversation if none exists
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from("conversaciones")
          .insert({ es_grupo: false })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Add participants
        await supabase.from("participantes_conversacion").insert([
          { conversacion_id: conversationId, user_id: senderProfile.id },
          { conversacion_id: conversationId, user_id: recipientId },
        ]);
      }

      // Send message with post link
      const messageContent = `📤 Publicación compartida:\n\n${shareText}\n\nVer publicación: ${postUrl}`;
      
      await supabase.from("mensajes").insert({
        conversacion_id: conversationId,
        user_id: senderProfile.id,
        contenido: messageContent,
      });

      // Register share
      await registerShare("interno", recipientId);

      toast.success("Publicación compartida exitosamente");
      setShowInternalShare(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Error al compartir la publicación");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRepost = async () => {
    if (!onRepost) return;

    setReposting(true);
    try {
      await onRepost(repostComment);
      await registerShare("repost");
      toast.success("Publicación compartida en tu perfil");
      setRepostComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Error al compartir la publicación");
    } finally {
      setReposting(false);
    }
  };

  const handleShareAsStatus = async () => {
    if (!profile?.id) return;

    try {
      setSharingAsStatus(true);
      
      // Guardar metadata del post compartido en formato JSON para que StatusView pueda renderizarlo correctamente
      const sharedPostData = JSON.stringify({
        __shared_post__: true,
        postId: postId,
        author: postAuthor,
        content: postContent,
        images: postImages || [],
        timestamp: postTimestamp?.toISOString() || new Date().toISOString(),
      });

      const { error } = await supabase
        .from("estados")
        .insert({
          user_id: profile.id,
          contenido: sharedPostData,
          imagenes: postImages || [],
          tipo: postImages && postImages.length > 0 ? 'imagen' : 'texto',
          compartido_en_mensajes: compartirEnMensajes,
          compartido_en_social: compartirEnSocial,
          visibilidad: statusVisibilidad,
        });

      if (error) throw error;

      toast.success("Publicación compartida como estado");
      await registerShare("estado");
      
      // Refrescar estados si el callback está disponible
      onRefreshStates?.();
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error sharing as status:", error);
      toast.error("Error al compartir como estado");
    } finally {
      setSharingAsStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir publicación</DialogTitle>
          <DialogDescription>
            Elige cómo quieres compartir esta publicación
          </DialogDescription>
        </DialogHeader>

        {!showInternalShare ? (
          <Tabs defaultValue="external" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="external">Externo</TabsTrigger>
              <TabsTrigger value="status">Estado</TabsTrigger>
              <TabsTrigger value="repost">En tu perfil</TabsTrigger>
            </TabsList>

            <TabsContent value="external" className="space-y-4 mt-4">
              {/* Copy Link */}
              <div className="space-y-2">
                <Label>Enlace de la publicación</Label>
                <div className="flex gap-2">
                  <Input value={postUrl} readOnly className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* External Sharing */}
              <div className="space-y-2">
                <Label>Compartir en redes sociales</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleShareTwitter}
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleShareFacebook}
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleShareLinkedIn}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleShareWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Internal Sharing */}
              <div className="space-y-2">
                <Label>Enviar mensaje directo</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleInternalShare}
                >
                  <Send className="h-4 w-4" />
                  Enviar a un usuario
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Esta publicación se compartirá como un estado temporal (24 horas)
                </p>

                {/* Preview of post as status */}
                <div className="border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Vista previa del estado</span>
                  </div>
                  
                  {postAuthor && (
                    <div className="flex gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={postAuthor.avatar || undefined} />
                        <AvatarFallback>
                          {postAuthor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{postAuthor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{postAuthor.username}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {postContent && (
                    <p className="text-sm whitespace-pre-wrap line-clamp-3 mb-3">{postContent}</p>
                  )}
                  
                  {postImages && postImages.length > 0 && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={postImages[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Visibilidad */}
                <div className="space-y-2">
                  <Label>Visibilidad</Label>
                  <RadioGroup
                    value={statusVisibilidad}
                    onValueChange={(value) => setStatusVisibilidad(value as 'todos' | 'contactos' | 'privado')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="todos" id="todos" />
                      <Label htmlFor="todos" className="font-normal cursor-pointer">
                        Todos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="contactos" id="contactos" />
                      <Label htmlFor="contactos" className="font-normal cursor-pointer">
                        Mis contactos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="privado" id="privado" />
                      <Label htmlFor="privado" className="font-normal cursor-pointer">
                        Privado (solo yo)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Opciones de compartir */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compartir-mensajes" className="font-normal">
                      Compartir también en Mensajes
                    </Label>
                    <Switch
                      id="compartir-mensajes"
                      checked={compartirEnMensajes}
                      onCheckedChange={setCompartirEnMensajes}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compartir-social" className="font-normal">
                      Compartir también en Red Social
                    </Label>
                    <Switch
                      id="compartir-social"
                      checked={compartirEnSocial}
                      onCheckedChange={setCompartirEnSocial}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleShareAsStatus}
                  disabled={sharingAsStatus}
                >
                  {sharingAsStatus ? "Compartiendo..." : "Compartir como Estado"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="repost" className="space-y-4 mt-4">
              {onRepost && postAuthor && postTimestamp ? (
                <>
                  <div className="space-y-2">
                    <Label>Añade un comentario (opcional)</Label>
                    <Textarea
                      placeholder="¿Qué opinas sobre esto?"
                      value={repostComment}
                      onChange={(e) => setRepostComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {repostComment.length}/500
                    </p>
                  </div>

                  {/* Original post preview */}
                  <div className="border border-border rounded-lg p-3 bg-muted/30">
                    <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
                      <Repeat2 className="h-3 w-3" />
                      <span>Vista previa</span>
                    </div>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={postAuthor.avatar || undefined} />
                        <AvatarFallback>
                          {postAuthor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <p className="font-semibold text-sm">{postAuthor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{postAuthor.username}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">
                          {postContent}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleRepost}
                    disabled={reposting}
                  >
                    {reposting ? (
                      "Compartiendo..."
                    ) : (
                      <>
                        <Repeat2 className="h-4 w-4 mr-2" />
                        Compartir en tu perfil
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  La función de re-publicación no está disponible para esta publicación
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInternalShare(false)}
              >
                ← Volver
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Buscar usuario</Label>
              <Input
                placeholder="Buscar por nombre o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">
                  Cargando usuarios...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No se encontraron usuarios
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendToUser(user.id)}
                        disabled={sending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
