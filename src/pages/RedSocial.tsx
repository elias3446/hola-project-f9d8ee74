import { Layout } from "@/components/Layout";
import { Share2, Menu } from "lucide-react";
import { CreatePost } from "@/components/social/CreatePost";
import { PostCard } from "@/components/social/PostCard";
import { SocialSidebar } from "@/components/social/SocialSidebar";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { useMutedUsers } from "@/hooks/useMutedUsers";
import { useEstados } from "@/hooks/useEstados";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { PostDetailModal } from "@/components/social/PostDetailModal";
import { SearchCriteria } from "@/components/social/AdvancedHashtagSearch";
import { StatusList } from "@/components/social/StatusList";
import { StatusView } from "@/components/social/StatusView";
import { CreateStatus } from "@/components/social/CreateStatus";
import { Estado } from "@/hooks/useEstados";

const RedSocial = () => {
  const location = useLocation();
  const { mutedUserIds, muteUser, unmuteUser, isUserMuted } = useMutedUsers();
  const { posts, loading, createPost, toggleLike, refreshPosts, updatePostComments, updatePostShares, registerView, deletePost, updatePost, toggleSavePost, repostPost } = useSocialFeed(mutedUserIds);
  const { estados, misEstados, loading: loadingEstados, createEstado, registerView: registerStatusView, deleteEstado, addReaction, removeReaction } = useEstados('social');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [detailPostIndex, setDetailPostIndex] = useState<number | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [createStatusOpen, setCreateStatusOpen] = useState(false);
  const [statusViewOpen, setStatusViewOpen] = useState(false);
  const [currentStatusList, setCurrentStatusList] = useState<Estado[]>([]);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  // Sincroniza la lista mostrada en el modal con los últimos datos del hook mientras esté abierto
  useEffect(() => {
    if (!statusViewOpen) return;
    const byId = new Map<string, Estado>([...misEstados, ...estados].map(e => [e.id, e]));
    setCurrentStatusList(prev => prev.map(s => byId.get(s.id) || s));
  }, [estados, misEstados, statusViewOpen]);

  // Refresh posts when navigated from menu (not browser back/forward)
  useEffect(() => {
    if (location.state?.shouldRefresh) {
      refreshPosts();
      // Clear the state to prevent refresh on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreatePost = async (content: string, images?: string[]) => {
    await createPost(content, images);
  };

  const handleCommentCountChange = (postId: string, increment: number) => {
    updatePostComments(postId, increment);
  };

  const handleShareCountChange = (postId: string, increment: number) => {
    updatePostShares(postId, increment);
  };

  const handleToggleSave = async (postId: string) => {
    await toggleSavePost(postId);
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setSearchCriteria(null);
    setSheetOpen(false);
  };

  const clearHashtagFilter = () => {
    setSelectedHashtag(null);
  };

  const handleAdvancedSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setSelectedHashtag(null);
  };

  const handleClearAdvancedSearch = () => {
    setSearchCriteria(null);
  };

  const handleDetailModalOpen = (postId: string) => {
    const index = filteredPosts.findIndex(p => p.id === postId);
    if (index !== -1) {
      setDetailPostIndex(index);
    }
  };

  const handleDetailModalClose = () => {
    setDetailPostIndex(null);
  };

  const handleNavigatePrevious = () => {
    if (detailPostIndex !== null && detailPostIndex > 0) {
      setDetailPostIndex(detailPostIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (detailPostIndex !== null && detailPostIndex < filteredPosts.length - 1) {
      setDetailPostIndex(detailPostIndex + 1);
    }
  };

  const handleCreateStatus = async (
    contenido: string | null,
    imagenes: string[],
    tipo: 'imagen' | 'texto' | 'video',
    compartirEnMensajes: boolean,
    visibilidad: 'todos' | 'contactos' | 'privado'
  ) => {
    await createEstado(contenido, imagenes, tipo, compartirEnMensajes, true, visibilidad);
  };

  const handleShareAsStatus = async (postId: string, content: string, images?: string[]) => {
    try {
      const tipo = images && images.length > 0 ? 'imagen' : 'texto';
      await createEstado(content, images || [], tipo, false, true, 'todos');
      await updatePostShares(postId, 1);
    } catch (error) {
      console.error("Error sharing as status:", error);
    }
  };

  const handleViewStatus = (estadosList: Estado[], index: number) => {
    setCurrentStatusList(estadosList);
    setCurrentStatusIndex(index);
    setStatusViewOpen(true);
  };

  // Filter posts by hashtag if selected or by advanced search
  const filteredPosts = (() => {
    // Single hashtag filter (from sidebar click)
    if (selectedHashtag) {
      return posts.filter(post => 
        post.contenido.toLowerCase().includes(`#${selectedHashtag.toLowerCase()}`)
      );
    }
    
    // Advanced search with hashtags and mentions
    if (searchCriteria && (searchCriteria.hashtags.length > 0 || searchCriteria.mentions.length > 0)) {
      return posts.filter(post => {
        const postContent = post.contenido.toLowerCase();
        const { hashtags, mentions, operator } = searchCriteria;
        
        // Create array of conditions to check
        const conditions: boolean[] = [];
        
        // Check hashtags
        if (hashtags.length > 0) {
          const hashtagMatches = hashtags.map(hashtag => 
            postContent.includes(`#${hashtag.toLowerCase()}`)
          );
          conditions.push(...hashtagMatches);
        }
        
        // Check mentions
        if (mentions.length > 0) {
          const mentionMatches = mentions.map(mention => 
            postContent.includes(`@${mention.toLowerCase()}`)
          );
          conditions.push(...mentionMatches);
        }
        
        // Apply operator
        if (operator === "AND") {
          // All conditions must be true
          return conditions.every(condition => condition);
        } else {
          // At least one condition must be true (OR)
          return conditions.some(condition => condition);
        }
      });
    }
    
    // No filter applied
    return posts;
  })();

  return (
    <Layout title="Red Social" icon={Share2}>
      <div className="max-w-7xl mx-auto">
        {/* Hashtag filter banner */}
        {selectedHashtag && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">Mostrando publicaciones con</span>
              <span className="font-semibold text-primary">#{selectedHashtag}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearHashtagFilter}>
              Limpiar filtro
            </Button>
          </div>
        )}
        
        {/* Advanced search filter banner */}
        {searchCriteria && (searchCriteria.hashtags.length > 0 || searchCriteria.mentions.length > 0) && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Búsqueda avanzada {(searchCriteria.hashtags.length + searchCriteria.mentions.length) > 1 ? `(${searchCriteria.operator === "AND" ? "Todos" : "Cualquiera"})` : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={handleClearAdvancedSearch}>
                Limpiar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchCriteria.hashtags.map((hashtag) => (
                <Badge key={`filter-hashtag-${hashtag}`} variant="secondary">
                  #{hashtag}
                </Badge>
              ))}
              {searchCriteria.mentions.map((mention) => (
                <Badge key={`filter-mention-${mention}`} variant="outline">
                  @{mention}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {/* Mobile/Tablet Menu Button */}
        <div className="lg:hidden mb-4 flex justify-end">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menú
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SocialSidebar 
                onHashtagClick={handleHashtagClick}
                onToggleLike={toggleLike}
                onCommentCountChange={handleCommentCountChange}
                onShareCountChange={handleShareCountChange}
                onAdvancedSearch={handleAdvancedSearch}
                onClearAdvancedSearch={handleClearAdvancedSearch}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed - Takes most space on desktop, full width on mobile */}
          <div className="lg:col-span-8">
            <StatusList
              misEstados={misEstados}
              estados={estados}
              onViewStatus={handleViewStatus}
              onCreateStatus={() => setCreateStatusOpen(true)}
            />
            
            <CreatePost onPost={handleCreatePost} />
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando publicaciones...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedHashtag 
                  ? `No hay publicaciones con #${selectedHashtag}`
                  : searchCriteria
                  ? `No hay publicaciones que coincidan con la búsqueda`
                  : 'No hay publicaciones aún. ¡Sé el primero en publicar!'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={{
                        id: post.id,
                        user_id: post.user_id,
                        author: post.author,
                        content: post.contenido,
                        timestamp: new Date(post.created_at),
                        likes: post.likes,
                        comments: post.comments,
                        views: post.views,
                        shares: post.shares,
                        isLiked: post.isLiked,
                        isSaved: post.isSaved,
                        image: post.imagenes?.[0],
                        repost_of: post.repost_of,
                        repost_comentario: post.repost_comentario,
                        originalPost: post.originalPost
                          ? {
                              author: post.originalPost.author,
                              content: post.originalPost.contenido,
                              timestamp: new Date(post.originalPost.created_at),
                              image: post.originalPost.imagenes?.[0],
                            }
                          : null,
                      }}
                      onToggleLike={toggleLike}
                      onCommentCountChange={handleCommentCountChange}
                      onShareCountChange={handleShareCountChange}
                      onView={registerView}
                      onHashtagClick={handleHashtagClick}
                      onDelete={deletePost}
                      onUpdate={updatePost}
                      onToggleSave={handleToggleSave}
                      onMuteUser={muteUser}
                      onUnmuteUser={unmuteUser}
                      isUserMuted={isUserMuted(post.user_id)}
                      onDetailModalOpen={handleDetailModalOpen}
                      onRepost={repostPost}
                      onShareAsStatus={handleShareAsStatus}
                    />
                  ))}
                </div>

                {/* Global Detail Modal */}
                {detailPostIndex !== null && filteredPosts[detailPostIndex] && (
                  <PostDetailModal
                    open={true}
                    onOpenChange={handleDetailModalClose}
                    post={{
                      id: filteredPosts[detailPostIndex].id,
                      user_id: filteredPosts[detailPostIndex].user_id,
                      author: filteredPosts[detailPostIndex].author,
                      content: filteredPosts[detailPostIndex].contenido,
                      timestamp: new Date(filteredPosts[detailPostIndex].created_at),
                      likes: filteredPosts[detailPostIndex].likes,
                      comments: filteredPosts[detailPostIndex].comments,
                      views: filteredPosts[detailPostIndex].views,
                      shares: filteredPosts[detailPostIndex].shares,
                      isLiked: filteredPosts[detailPostIndex].isLiked,
                      image: filteredPosts[detailPostIndex].imagenes?.[0],
                    }}
                    onToggleLike={toggleLike}
                    onCommentCountChange={handleCommentCountChange}
                    onShareCountChange={handleShareCountChange}
                    onHashtagClick={handleHashtagClick}
                    onRegisterView={() => registerView(filteredPosts[detailPostIndex].id)}
                    onNavigatePrevious={handleNavigatePrevious}
                    onNavigateNext={handleNavigateNext}
                    hasPrevious={detailPostIndex > 0}
                    hasNext={detailPostIndex < filteredPosts.length - 1}
                    onShareAsStatus={handleShareAsStatus}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-6">
              <SocialSidebar 
                onHashtagClick={handleHashtagClick}
                onToggleLike={toggleLike}
                onCommentCountChange={handleCommentCountChange}
                onShareCountChange={handleShareCountChange}
                onAdvancedSearch={handleAdvancedSearch}
                onClearAdvancedSearch={handleClearAdvancedSearch}
              />
            </div>
          </div>
        </div>

      </div>

      <StatusView
        open={statusViewOpen}
        onOpenChange={setStatusViewOpen}
        estados={currentStatusList}
        currentIndex={currentStatusIndex}
        onIndexChange={setCurrentStatusIndex}
        onRegisterView={registerStatusView}
        onDelete={deleteEstado}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
      />

      {/* Dialog flotante para crear estado */}
      <CreateStatus
        open={createStatusOpen}
        onOpenChange={setCreateStatusOpen}
        onCreateStatus={handleCreateStatus}
        origen="social"
      />
    </Layout>
  );
};

export default RedSocial;
