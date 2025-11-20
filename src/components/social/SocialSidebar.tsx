import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { TrendingUp, Users, Heart, MessageCircle, Eye, Hash, Plus, Check, UserPlus, UserCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTrendingPosts } from "@/hooks/useTrendingPosts";
import { useTrendingHashtags, TimeFilter } from "@/hooks/useTrendingHashtags";
import { useHashtagFollows } from "@/hooks/useHashtagFollows";
import { useUserStats } from "@/hooks/useUserStats";
import { useUserSuggestionsReal } from "@/hooks/useUserSuggestionsReal";
import { useFollowUser } from "@/hooks/useFollowUser";
import { PostDetailModal } from "./PostDetailModal";
import { AdvancedHashtagSearch, SearchCriteria } from "./AdvancedHashtagSearch";
import { UserSearchBar } from "./UserSearchBar";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const SocialSidebar = ({ 
  onHashtagClick,
  onToggleLike,
  onCommentCountChange,
  onShareCountChange,
  onAdvancedSearch,
  onClearAdvancedSearch
}: { 
  onHashtagClick?: (hashtag: string) => void;
  onToggleLike?: (postId: string) => void;
  onCommentCountChange?: (postId: string, increment: number) => void;
  onShareCountChange?: (postId: string, increment: number) => void;
  onAdvancedSearch?: (criteria: SearchCriteria) => void;
  onClearAdvancedSearch?: () => void;
}) => {
  const { profile } = useProfile();
  const { stats, loading: statsLoading } = useUserStats(profile?.id);
  const [hashtagTimeFilter, setHashtagTimeFilter] = useState<TimeFilter>('7d');
  const { trendingPosts, loading: trendingLoading } = useTrendingPosts(5);
  const { trendingHashtags, loading: hashtagsLoading } = useTrendingHashtags(8, hashtagTimeFilter);
  const { isFollowing, followHashtag, unfollowHashtag } = useHashtagFollows();
  const { suggestions, loading: suggestionsLoading, updateFollowStatus, removeFromSuggestions } = useUserSuggestionsReal(5);
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const [selectedPost, setSelectedPost] = useState<typeof trendingPosts[0] | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [trendingPostsState, setTrendingPostsState] = useState(trendingPosts);

  // Sync trending posts state with hook data
  useEffect(() => {
    setTrendingPostsState(trendingPosts);
  }, [trendingPosts]);

  // Update selectedPost when trendingPostsState changes
  useEffect(() => {
    if (selectedPost) {
      const updated = trendingPostsState.find(p => p.id === selectedPost.id);
      if (updated) {
        setSelectedPost(updated);
      }
    }
  }, [trendingPostsState]);

  useEffect(() => {
    const checkLikes = async () => {
      if (!profile?.id || trendingPosts.length === 0) return;
      const ids = trendingPosts.map((p) => p.id);
      const { data } = await supabase
        .from("interacciones")
        .select("publicacion_id")
        .eq("user_id", profile.id)
        .eq("tipo_interaccion", "me_gusta")
        .in("publicacion_id", ids);
      if (data) {
        setLikedPosts(new Set(data.map((d: any) => d.publicacion_id)));
      }
    };
    checkLikes();
  }, [profile?.id, trendingPosts]);

  const handleToggleLike = (postId: string) => {
    onToggleLike?.(postId);
    setLikedPosts((prev) => {
      const ns = new Set(prev);
      if (ns.has(postId)) ns.delete(postId); else ns.add(postId);
      return ns;
    });
    
    // Update local state optimistically
    setTrendingPostsState((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: likedPosts.has(postId) ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleCommentCountChange = (postId: string, increment: number) => {
    onCommentCountChange?.(postId, increment);
    setTrendingPostsState((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments + increment } : p
      )
    );
  };

  const handleShareCountChange = (postId: string, increment: number) => {
    onShareCountChange?.(postId, increment);
    setTrendingPostsState((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, shares: p.shares + increment } : p
      )
    );
  };

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      await unfollowUser(userId);
      updateFollowStatus(userId, false);
    } else {
      await followUser(userId);
      updateFollowStatus(userId, true);
      // Optionally remove from suggestions after following
      setTimeout(() => removeFromSuggestions(userId), 1000);
    }
  };

  return (
    <div className="space-y-4">
      {/* User Search */}
      <UserSearchBar />

      {/* Advanced Search */}
      {onAdvancedSearch && onClearAdvancedSearch && (
        <AdvancedHashtagSearch 
          onSearch={onAdvancedSearch}
          onClear={onClearAdvancedSearch}
        />
      )}

      {/* Profile Card */}
      <Card className="p-4">
        <div className="mb-4">
          <UserAvatar
            avatar={profile?.avatar}
            name={profile?.name}
            username={profile?.username}
            email={profile?.email}
            size="md"
            showName={true}
            enableModal={true}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-bold text-sm">
              {statsLoading ? "..." : stats.postsCount}
            </p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <Link to="/seguidores" className="hover:bg-accent/50 rounded-md transition-colors">
            <p className="font-bold text-sm">
              {statsLoading ? "..." : stats.followersCount}
            </p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </Link>
          <Link to="/seguidores" className="hover:bg-accent/50 rounded-md transition-colors">
            <p className="font-bold text-sm">
              {statsLoading ? "..." : stats.followingCount}
            </p>
            <p className="text-xs text-muted-foreground">Siguiendo</p>
          </Link>
        </div>
      </Card>

      {/* Trending Hashtags */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Tendencias</h3>
        </div>
        <Tabs value={hashtagTimeFilter} onValueChange={(v) => setHashtagTimeFilter(v as TimeFilter)} className="mb-3">
          <TabsList className="grid w-full grid-cols-4 h-9 bg-muted/50 p-0.5 gap-0.5 overflow-hidden">
            <TabsTrigger 
              value="24h" 
              className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              24h
            </TabsTrigger>
            <TabsTrigger 
              value="7d" 
              className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              7d
            </TabsTrigger>
            <TabsTrigger 
              value="30d" 
              className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              30d
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              Todos
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {hashtagsLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Cargando tendencias...
          </div>
        ) : trendingHashtags.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No hay tendencias aún
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {trendingHashtags.map((hashtag) => (
              <div
                key={hashtag.id}
                className="w-full hover:bg-accent/50 rounded-md p-2 transition-colors flex items-start justify-between gap-2"
              >
                <button
                  onClick={() => onHashtagClick?.(hashtag.nombre)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-sm text-primary">#{hashtag.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {hashtag.uso_count} {hashtag.uso_count === 1 ? 'publicación' : 'publicaciones'}
                  </p>
                </button>
                <Button
                  size="sm"
                  variant={isFollowing(hashtag.nombre) ? "secondary" : "ghost"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFollowing(hashtag.nombre)) {
                      unfollowHashtag(hashtag.nombre);
                    } else {
                      followHashtag(hashtag.nombre);
                    }
                  }}
                  className="h-7 w-7 p-0 flex-shrink-0"
                >
                  {isFollowing(hashtag.nombre) ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Trending Posts */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Publicaciones en Tendencia</h3>
          </div>
          <Link to="/tendencias">
            <Button size="sm" variant="ghost" className="h-7 text-xs">
              Ver todas
            </Button>
          </Link>
        </div>
        {trendingLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Cargando tendencias...
          </div>
        ) : trendingPostsState.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No hay tendencias aún
          </div>
        ) : (
          <div className="space-y-3">
            {trendingPostsState
              .slice()
              .sort((a, b) => b.trendingScore - a.trendingScore)
              .slice(0, 5)
              .map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => {
                    setSelectedPost(post);
                  }}
                  className="w-full hover:bg-accent/50 rounded-md p-2 transition-colors text-left"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/usuario/${post.author.username}`}
                        className="text-xs font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.author.name}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {post.contenido}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1 text-xs">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </Card>

      {/* Suggested Users */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Usuarios Sugeridos</h3>
        </div>
        {suggestionsLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Cargando sugerencias...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No hay sugerencias disponibles
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((user) => (
              <div key={user.id} className="flex items-center gap-2 justify-between">
                <Link 
                  to={`/usuario/${user.username}`}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <UserAvatar
                    avatar={user.avatar}
                    name={user.name}
                    username={user.username}
                    size="sm"
                    showName={true}
                    enableModal={false}
                  />
                </Link>
                <Button
                  size="sm"
                  variant={user.isFollowing ? "secondary" : "default"}
                  onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                  disabled={followLoading}
                  className="h-8 px-3 text-xs gap-1.5 flex-shrink-0"
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Siguiendo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Seguir
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedPost && (
        <PostDetailModal
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={{
            id: selectedPost.id,
            author: selectedPost.author,
            content: selectedPost.contenido,
            image: selectedPost.imagenes?.[0],
            timestamp: new Date(selectedPost.created_at),
            likes: selectedPost.likes,
            comments: selectedPost.comments,
            views: selectedPost.views,
            shares: selectedPost.shares,
            isLiked: likedPosts.has(selectedPost.id),
          }}
          onToggleLike={handleToggleLike}
          onCommentCountChange={handleCommentCountChange}
          onShareCountChange={handleShareCountChange}
          onHashtagClick={onHashtagClick}
        />
      )}
    </div>
  );
};
