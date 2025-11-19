import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { User, Bookmark } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useFollowersList } from "@/hooks/useFollowersList";
import { useTrendingPosts } from "@/hooks/useTrendingPosts";
import { UserCircle, MessageCircle, UserPlus, UserCheck, UserMinus, Users, Search, TrendingUp } from "lucide-react";
import { PostCard } from "@/components/social/PostCard";
import { PostDetailModal } from "@/components/social/PostDetailModal";
import { Input } from "@/components/ui/input";
import { UserTrendingStats } from "@/components/social/profile/UserTrendingStats";
import { UserTrendingCharts } from "@/components/social/profile/UserTrendingCharts";
import { UserTrendingList } from "@/components/social/profile/UserTrendingList";
import { GlobalTrendingList } from "@/components/social/profile/GlobalTrendingList";

const PerfilUsuario = () => {
  const { username } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const { 
    profile, 
    posts, 
    relationshipStatus,
    loading, 
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    toggleLike,
    toggleSave,
    refetchPosts
  } = useUserProfile(username || "");

  const { followUser, unfollowUser, checkIfFollowing, loading: followLoading } = useFollowUser();
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Followers list hook
  const { followers, following, loading: followersLoading } = useFollowersList(username);
  const [searchQuery, setSearchQuery] = useState("");
  // State for trending time filter
  const [trendingTimeRange, setTrendingTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  
  // Trending posts hook - for the viewed profile user
  const { trendingPosts: userTrendingPosts, loading: trendingLoading } = useTrendingPosts(50, true, profile?.id, trendingTimeRange);

  // Use profile ID comparison instead of username to avoid race conditions
  const isOwnProfile = currentUserProfile?.id && profile?.id 
    ? currentUserProfile.id === profile.id 
    : false;

  // Check if following on mount and when profile changes
  useEffect(() => {
    const checkFollow = async () => {
      if (profile?.id && !isOwnProfile) {
        const following = await checkIfFollowing(profile.id);
        setIsFollowing(following);
      }
    };
    checkFollow();
  }, [profile?.id, isOwnProfile, checkIfFollowing]);

  const handleFollowToggle = async () => {
    if (!profile?.id) return;
    
    if (isFollowing) {
      await unfollowUser(profile.id);
      setIsFollowing(false);
    } else {
      await followUser(profile.id);
      setIsFollowing(true);
    }
  };
    
  const { savedPosts, loading: savedLoading, toggleSavePost, refetch: refetchSavedPosts } = useSavedPosts();
  
  // State for post detail modal with navigation
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    postId: string | null;
    postList: 'posts' | 'saved';
  }>({
    isOpen: false,
    postId: null,
    postList: 'posts',
  });

  // Handler that updates both lists
  const handleToggleSaveInPosts = async (postId: string) => {
    await toggleSave(postId);
    // Refetch saved posts to keep them in sync
    if (isOwnProfile) {
      await refetchSavedPosts();
    }
  };

  const handleToggleSaveInSaved = async (postId: string) => {
    await toggleSavePost(postId);
    // Refetch user posts to keep them in sync
    await refetchPosts();
  };
  
  // Modal navigation handlers
  const handleOpenDetailModal = (postId: string, postList: 'posts' | 'saved') => {
    setDetailModalState({
      isOpen: true,
      postId,
      postList,
    });
  };

  const handleCloseDetailModal = () => {
    setDetailModalState({
      isOpen: false,
      postId: null,
      postList: detailModalState.postList,
    });
  };

  const handleNavigatePrevious = () => {
    const currentList = detailModalState.postList === 'posts' ? posts : savedPosts;
    const currentIndex = currentList.findIndex(p => p.id === detailModalState.postId);
    
    if (currentIndex > 0) {
      setDetailModalState({
        ...detailModalState,
        postId: currentList[currentIndex - 1].id,
      });
    }
  };

  const handleNavigateNext = () => {
    const currentList = detailModalState.postList === 'posts' ? posts : savedPosts;
    const currentIndex = currentList.findIndex(p => p.id === detailModalState.postId);
    
    if (currentIndex < currentList.length - 1) {
      setDetailModalState({
        ...detailModalState,
        postId: currentList[currentIndex + 1].id,
      });
    }
  };

  // Get current post data for modal
  const getCurrentPost = () => {
    const currentList = detailModalState.postList === 'posts' ? posts : savedPosts;
    const currentPost = currentList.find(p => p.id === detailModalState.postId);
    
    if (!currentPost) return null;
    
    return {
      id: currentPost.id,
      user_id: currentPost.user_id,
      author: currentPost.author,
      content: currentPost.contenido,
      timestamp: new Date(currentPost.created_at),
      likes: currentPost.likes,
      comments: currentPost.comments,
      views: currentPost.views,
      shares: currentPost.shares,
      isLiked: currentPost.isLiked,
      image: currentPost.imagenes?.[0],
    };
  };

  const currentPost = getCurrentPost();
  const currentList = detailModalState.postList === 'posts' ? posts : savedPosts;
  const currentIndex = currentList.findIndex(p => p.id === detailModalState.postId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < currentList.length - 1;

  const renderRelationshipButton = () => {
    if (isOwnProfile) return null;

    return (
      <div className="flex flex-col gap-2">
        {/* Follow/Unfollow Button */}
        <Button 
          onClick={handleFollowToggle} 
          disabled={followLoading}
          variant={isFollowing ? "secondary" : "default"}
          className="gap-2"
        >
          {isFollowing ? (
            <>
              <UserCheck className="h-4 w-4" />
              Siguiendo
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Seguir
            </>
          )}
        </Button>

        {/* Friend Request Buttons */}
        {relationshipStatus === "none" && (
          <Button onClick={sendFriendRequest} variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Solicitud de amistad
          </Button>
        )}
        {relationshipStatus === "pending_sent" && (
          <Button variant="outline" disabled className="gap-2">
            <UserCheck className="h-4 w-4" />
            Solicitud enviada
          </Button>
        )}
        {relationshipStatus === "pending_received" && (
          <div className="flex gap-2">
            <Button onClick={acceptFriendRequest} variant="outline" size="sm" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Aceptar
            </Button>
            <Button onClick={rejectFriendRequest} variant="outline" size="sm" className="gap-2">
              <UserMinus className="h-4 w-4" />
              Rechazar
            </Button>
          </div>
        )}
        {relationshipStatus === "friends" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensaje
            </Button>
            <Button onClick={unfriend} variant="outline" size="sm" className="gap-2">
              <UserMinus className="h-4 w-4" />
              Dejar de ser amigos
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Wait for both profile and current user profile to load
  if (loading || !currentUserProfile) {
    return (
      <Layout title="Perfil de Usuario" icon={User}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Cargando perfil...
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title="Perfil de Usuario" icon={User}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Usuario no encontrado
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`@${profile.username}`} icon={User}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-center gap-6">
            <UserAvatar
              avatar={profile.avatar}
              name={profile.name}
              username={profile.username}
              size="lg"
              enableModal={true}
            />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h2 className="text-2xl font-bold">{profile.name || "Usuario"}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              {profile.bio && (
                <p className="text-sm text-foreground">{profile.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {renderRelationshipButton()}
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="posts" className="gap-1 sm:gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
              <span className="text-xs">({posts.length})</span>
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="saved" className="gap-1 sm:gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Guardadas</span>
                  <span className="text-xs">({savedLoading ? '...' : savedPosts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-1 sm:gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Trending</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="followers" className="gap-1 sm:gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Seguidores</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1 sm:gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay publicaciones para mostrar
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
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
                    }}
                    onToggleLike={toggleLike}
                    onToggleSave={handleToggleSaveInPosts}
                    onDetailModalOpen={(postId) => handleOpenDetailModal(postId, 'posts')}
                  />
              ))
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-4 mt-6">
              {savedLoading ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Cargando publicaciones guardadas...
                  </CardContent>
                </Card>
              ) : savedPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No tienes publicaciones guardadas
                  </CardContent>
                </Card>
              ) : (
                savedPosts.map((post) => (
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
                    }}
                    onToggleLike={toggleLike}
                    onToggleSave={handleToggleSaveInSaved}
                    onDetailModalOpen={(postId) => handleOpenDetailModal(postId, 'saved')}
                  />
                ))
              )}
            </TabsContent>
          )}

          {isOwnProfile && (
            <TabsContent value="trending" className="mt-6">
              {trendingLoading ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Cargando tendencias...
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Button
                      variant={trendingTimeRange === '24h' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTrendingTimeRange('24h')}
                    >
                      24h
                    </Button>
                    <Button
                      variant={trendingTimeRange === '7d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTrendingTimeRange('7d')}
                    >
                      7 días
                    </Button>
                    <Button
                      variant={trendingTimeRange === '30d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTrendingTimeRange('30d')}
                    >
                      30 días
                    </Button>
                    <Button
                      variant={trendingTimeRange === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTrendingTimeRange('all')}
                    >
                      Todos
                    </Button>
                  </div>
                  
                  <Tabs defaultValue="charts" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="charts">Gráficos</TabsTrigger>
                      <TabsTrigger value="my-trending">Mis Trending</TabsTrigger>
                      <TabsTrigger value="all-trending">Todos</TabsTrigger>
                    </TabsList>

                  <TabsContent value="charts" className="space-y-6">
                    <UserTrendingStats trendingPosts={userTrendingPosts} />
                    <UserTrendingCharts trendingPosts={userTrendingPosts} />
                  </TabsContent>

                  <TabsContent value="my-trending" className="space-y-6">
                    <UserTrendingStats trendingPosts={userTrendingPosts} />
                    <UserTrendingList 
                      trendingPosts={userTrendingPosts}
                      onToggleLike={toggleLike}
                    />
                  </TabsContent>

                  <TabsContent value="all-trending" className="space-y-6">
                    <GlobalTrendingList 
                      onToggleLike={toggleLike}
                      timeRange={trendingTimeRange}
                    />
                  </TabsContent>
                </Tabs>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="followers" className="mt-6">
            <Card>
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="followers" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                    <TabsTrigger 
                      value="followers"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      Seguidores ({followersLoading ? '...' : followers.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="following"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      Siguiendo ({followersLoading ? '...' : following.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="followers" className="mt-4">
                    {followersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Cargando seguidores...
                      </div>
                    ) : followers.filter(user => 
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.username.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No se encontraron usuarios" : "No hay seguidores aún"}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {followers
                          .filter(user => 
                            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.username.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50 hover:shadow-[var(--shadow-soft)] transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Link to={`/usuario/${user.username}`}>
                                  <UserAvatar
                                    avatar={user.avatar}
                                    name={user.name}
                                    username={user.username}
                                    size="md"
                                  />
                                </Link>
                                <div>
                                  <Link to={`/usuario/${user.username}`}>
                                    <p className="font-semibold hover:text-primary transition-colors">
                                      {user.name}
                                    </p>
                                  </Link>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                              {!isOwnProfile && user.id !== currentUserProfile?.id && (
                                <Button
                                  size="sm"
                                  variant={user.isFollowing ? "secondary" : "default"}
                                  onClick={async () => {
                                    if (user.isFollowing) {
                                      await unfollowUser(user.id);
                                    } else {
                                      await followUser(user.id);
                                    }
                                  }}
                                  className="gap-2 transition-colors"
                                >
                                  {user.isFollowing ? (
                                    <>
                                      <UserCheck className="h-4 w-4" />
                                      Siguiendo
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4" />
                                      Seguir
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="following" className="mt-4">
                    {followersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Cargando siguiendo...
                      </div>
                    ) : following.filter(user => 
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.username.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No se encontraron usuarios" : "No sigue a nadie aún"}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {following
                          .filter(user => 
                            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.username.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50 hover:shadow-[var(--shadow-soft)] transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Link to={`/usuario/${user.username}`}>
                                  <UserAvatar
                                    avatar={user.avatar}
                                    name={user.name}
                                    username={user.username}
                                    size="md"
                                  />
                                </Link>
                                <div>
                                  <Link to={`/usuario/${user.username}`}>
                                    <p className="font-semibold hover:text-primary transition-colors">
                                      {user.name}
                                    </p>
                                  </Link>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                              {user.id !== currentUserProfile?.id && (
                                <Button
                                  size="sm"
                                  variant={user.isFollowing ? "secondary" : "default"}
                                  onClick={async () => {
                                    if (user.isFollowing) {
                                      await unfollowUser(user.id);
                                    } else {
                                      await followUser(user.id);
                                    }
                                  }}
                                  className="gap-2 transition-colors"
                                >
                                  {user.isFollowing ? (
                                    <>
                                      <UserCheck className="h-4 w-4" />
                                      Siguiendo
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4" />
                                      Seguir
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardContent className="py-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Información del usuario</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Nombre:</span>
                      <span>{profile.name || "No especificado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Usuario:</span>
                      <span>@{profile.username}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Post Detail Modal with Navigation */}
        {currentPost && (
          <PostDetailModal
            open={detailModalState.isOpen}
            onOpenChange={(open) => {
              if (!open) handleCloseDetailModal();
            }}
            post={currentPost}
            onToggleLike={toggleLike}
            onNavigatePrevious={handleNavigatePrevious}
            onNavigateNext={handleNavigateNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
        )}
      </div>
    </Layout>
  );
};

export default PerfilUsuario;
