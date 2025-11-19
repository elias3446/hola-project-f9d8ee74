import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Eye, Share2, Flame, TrendingUp } from "lucide-react";
import { TrendingPost } from "@/hooks/useTrendingPosts";

interface UserTrendingStatsProps {
  trendingPosts: TrendingPost[];
}

export const UserTrendingStats = ({ trendingPosts }: UserTrendingStatsProps) => {
  const totalEngagement = {
    likes: trendingPosts.reduce((sum, p) => sum + p.likes, 0),
    comments: trendingPosts.reduce((sum, p) => sum + p.comments, 0),
    views: trendingPosts.reduce((sum, p) => sum + p.views, 0),
    shares: trendingPosts.reduce((sum, p) => sum + p.shares, 0),
  };

  const totalScore = trendingPosts.reduce((sum, p) => sum + p.trendingScore, 0);
  const avgScore = trendingPosts.length > 0 ? Math.round(totalScore / trendingPosts.length) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            Score Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalScore}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Promedio: {avgScore}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{trendingPosts.length}</div>
          <p className="text-xs text-muted-foreground mt-1">En tendencia</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            Me Gusta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.likes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {trendingPosts.length > 0 ? Math.round(totalEngagement.likes / trendingPosts.length) : 0} promedio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Comentarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.comments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {trendingPosts.length > 0 ? Math.round(totalEngagement.comments / trendingPosts.length) : 0} promedio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent" />
            Vistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.views}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {trendingPosts.length > 0 ? Math.round(totalEngagement.views / trendingPosts.length) : 0} promedio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Share2 className="h-4 w-4 text-secondary" />
            Compartidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEngagement.shares}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {trendingPosts.length > 0 ? Math.round(totalEngagement.shares / trendingPosts.length) : 0} promedio
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
