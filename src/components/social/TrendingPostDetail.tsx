import { TrendingPost } from "@/hooks/useTrendingPosts";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, MessageCircle, Eye, Share2, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TrendingPostDetailProps {
  post: TrendingPost;
}

export const TrendingPostDetail = ({ post }: TrendingPostDetailProps) => {
  const totalEngagement = post.likes + post.comments + post.views + post.shares;
  
  const likesPercentage = totalEngagement > 0 ? (post.likes / totalEngagement) * 100 : 0;
  const commentsPercentage = totalEngagement > 0 ? (post.comments / totalEngagement) * 100 : 0;
  const viewsPercentage = totalEngagement > 0 ? (post.views / totalEngagement) * 100 : 0;
  const sharesPercentage = totalEngagement > 0 ? (post.shares / totalEngagement) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Author Info */}
      <div className="flex items-center gap-3">
        <UserAvatar
          avatar={post.author.avatar}
          name={post.author.name}
          username={post.author.username}
          size="md"
          enableModal={true}
          showName={false}
        />
        <Link to={`/usuario/${post.author.username}`} className="hover:underline">
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">
              @{post.author.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
        </Link>
        <Badge variant="destructive" className="ml-auto">
          <Flame className="h-3 w-3 mr-1" />
          Tendencia
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-base whitespace-pre-wrap">{post.contenido}</p>
        {post.imagenes && post.imagenes.length > 0 && (
          <img
            src={post.imagenes[0]}
            alt="Imagen del post"
            className="rounded-lg w-full max-h-96 object-cover"
          />
        )}
      </div>

      {/* Trending Score */}
      <div className="p-4 bg-accent rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Puntuación de Tendencia</span>
          <span className="text-2xl font-bold text-destructive">{post.trendingScore}</span>
        </div>
        <Progress value={Math.min((post.trendingScore / 1000) * 100, 100)} className="h-2" />
      </div>

      {/* Engagement Metrics */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Métricas de Engagement</h3>
        
        {/* Likes */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              <span>Me gusta</span>
            </div>
            <span className="font-semibold">{post.likes} ({likesPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={likesPercentage} className="h-2" />
        </div>

        {/* Comments */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>Comentarios</span>
            </div>
            <span className="font-semibold">{post.comments} ({commentsPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={commentsPercentage} className="h-2" />
        </div>

        {/* Views */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              <span>Vistas</span>
            </div>
            <span className="font-semibold">{post.views} ({viewsPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={viewsPercentage} className="h-2" />
        </div>

        {/* Shares */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-secondary" />
              <span>Compartidos</span>
            </div>
            <span className="font-semibold">{post.shares} ({sharesPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={sharesPercentage} className="h-2 bg-secondary" />
        </div>
      </div>

      {/* Total Engagement */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Engagement Total</span>
          <span className="text-xl font-bold">{totalEngagement}</span>
        </div>
      </div>
    </div>
  );
};
