import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Flame, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { useTrendingPosts } from "@/hooks/useTrendingPosts";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { PostDetailModal } from "@/components/social/PostDetailModal";
import { TrendingPostDetail } from "@/components/social/TrendingPostDetail";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function TrendingPosts() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  
  // User's own trending posts for stats/charts
  const { trendingPosts: userTrendingPosts, loading: userLoading } = useTrendingPosts(10, true, undefined, timeRange);
  // All trending posts for detailed list
  const { trendingPosts: allTrendingPosts, loading: allLoading } = useTrendingPosts(50, false, undefined, timeRange);
  
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [trendingPostsState, setTrendingPostsState] = useState(userTrendingPosts);

  const { toggleLike } = useSocialFeed();
  const { profile } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Sync trending posts state with hook data
  useEffect(() => {
    setTrendingPostsState(userTrendingPosts);
  }, [userTrendingPosts]);

  const handleToggleLikeInModal = (postId: string) => {
    toggleLike(postId);
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
    setTrendingPostsState((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments + increment } : p
      )
    );
  };

  const handleShareCountChange = (postId: string, increment: number) => {
    setTrendingPostsState((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, shares: p.shares + increment } : p
      )
    );
  };
  
  useEffect(() => {
    const checkLikes = async () => {
      if (!profile?.id || userTrendingPosts.length === 0) return;
      const ids = userTrendingPosts.map((p) => p.id);
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
  }, [profile?.id, userTrendingPosts]);
  
  const selectedPost = trendingPostsState.find(p => p.id === selectedPostId);
  
  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleDetailPostClick = (postId: string) => {
    setSelectedPostId(postId);
    setDetailModalOpen(true);
  };
  
  const transformToModalPost = (trendingPost: typeof userTrendingPosts[0]) => ({
    id: trendingPost.id,
    user_id: undefined,
    author: trendingPost.author,
    content: trendingPost.contenido,
    image: trendingPost.imagenes?.[0],
    timestamp: new Date(trendingPost.created_at),
    likes: trendingPost.likes,
    comments: trendingPost.comments,
    views: trendingPost.views,
    shares: trendingPost.shares,
    isLiked: likedPosts.has(trendingPost.id),
  });

  // Prepare chart data from user's posts
  const engagementData = trendingPostsState.map((post, idx) => ({
    name: `Post ${idx + 1}`,
    likes: post.likes,
    comments: post.comments,
    views: post.views,
    shares: post.shares,
  }));

  // Total engagement from user's posts
  const totalEngagement = {
    likes: trendingPostsState.reduce((sum, p) => sum + p.likes, 0),
    comments: trendingPostsState.reduce((sum, p) => sum + p.comments, 0),
    views: trendingPostsState.reduce((sum, p) => sum + p.views, 0),
    shares: trendingPostsState.reduce((sum, p) => sum + p.shares, 0),
  };

  const pieData = [
    { name: "Me gusta", value: totalEngagement.likes, color: "hsl(var(--destructive))" },
    { name: "Comentarios", value: totalEngagement.comments, color: "hsl(var(--primary))" },
    { name: "Vistas", value: totalEngagement.views, color: "hsl(var(--accent))" },
    { name: "Compartidos", value: totalEngagement.shares, color: "hsl(var(--secondary))" },
  ];

  // Trending score over time from user's posts
  const trendingScoreData = userTrendingPosts.map((post, idx) => ({
    name: `#${idx + 1}`,
    score: post.trendingScore,
  }));

  const loading = userLoading || allLoading;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold">Publicaciones en Tendencia</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold">Publicaciones en Tendencia</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('24h')}
          >
            24h
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7d
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30d
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            Todos
          </Button>
        </div>
      </div>

      {/* Stats cards - showing user's own posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              Mis Me Gusta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.likes}</div>
            <p className="text-xs text-muted-foreground mt-1">En tus publicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Mis Comentarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.comments}</div>
            <p className="text-xs text-muted-foreground mt-1">En tus publicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              Mis Vistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.views}</div>
            <p className="text-xs text-muted-foreground mt-1">En tus publicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4 text-secondary" />
              Mis Compartidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.shares}</div>
            <p className="text-xs text-muted-foreground mt-1">En tus publicaciones</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="list">Lista Detallada</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of trending posts */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                  Mis Publicaciones en Tendencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {userTrendingPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No tienes publicaciones en tendencia</p>
                  </div>
                ) : (
                  userTrendingPosts.map((post, idx) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className="w-full p-3 rounded-lg border transition-colors text-left hover:bg-accent/50 border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`text-lg font-bold ${idx < 3 ? "text-destructive" : "text-muted-foreground"}`}>
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar
                            avatar={post.author.avatar}
                            name={post.author.name}
                            username={post.author.username}
                            size="sm"
                            showName={false}
                          />
                          <span className="text-sm font-medium truncate">{post.author.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.contenido}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {post.trendingScore}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {post.shares}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Detail view */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Detalle de Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPost ? (
                  <TrendingPostDetail post={selectedPost} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mb-3" />
                    <p>Selecciona una publicación para ver los detalles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart for engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="likes" fill="hsl(var(--destructive))" name="Me gusta" />
                    <Bar dataKey="comments" fill="hsl(var(--primary))" name="Comentarios" />
                    <Bar dataKey="shares" fill="hsl(var(--secondary))" name="Compartidos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie chart for engagement distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Line chart for trending scores */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Puntuación de Tendencia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendingScoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Puntuación"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-destructive" />
                Lista Completa de Tendencias
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Todas las publicaciones más populares de la plataforma
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allTrendingPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay publicaciones en tendencia en este momento</p>
                  </div>
                ) : (
                  allTrendingPosts.map((post, idx) => (
                  <button
                    key={post.id}
                    onClick={() => handleDetailPostClick(post.id)}
                    className="w-full p-4 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`text-2xl font-bold ${idx < 3 ? "text-destructive" : "text-muted-foreground"}`}>
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <UserAvatar
                            avatar={post.author.avatar}
                            name={post.author.name}
                            username={post.author.username}
                            size="sm"
                            enableModal={true}
                            showName={false}
                          />
                          <Link to={`/usuario/${post.author.username}`} className="hover:underline">
                            <div>
                              <p className="font-semibold text-sm">{post.author.name}</p>
                              <p className="text-xs text-muted-foreground">
                                @{post.author.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                          </Link>
                        </div>
                        <p className="text-sm mb-3 whitespace-pre-wrap">{post.contenido}</p>
                        {post.imagenes && post.imagenes.length > 0 && (
                          <img
                            src={post.imagenes[0]}
                            alt="Imagen del post"
                            className="rounded-lg w-full max-h-64 object-cover mb-3"
                          />
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="font-semibold">{post.trendingScore}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Me gusta</p>
                              <p className="font-semibold">{post.likes}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Comentarios</p>
                              <p className="font-semibold">{post.comments}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-accent" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vistas</p>
                              <p className="font-semibold">{post.views}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-secondary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Compartidos</p>
                              <p className="font-semibold">{post.shares}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Post Detail Modal for List */}
      {selectedPost && (
        <PostDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          post={transformToModalPost(selectedPost)}
          onToggleLike={handleToggleLikeInModal}
          onCommentCountChange={handleCommentCountChange}
          onShareCountChange={handleShareCountChange}
        />
      )}
    </div>
  );
}
