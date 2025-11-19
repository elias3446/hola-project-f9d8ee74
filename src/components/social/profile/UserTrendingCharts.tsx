import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingPost } from "@/hooks/useTrendingPosts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface UserTrendingChartsProps {
  trendingPosts: TrendingPost[];
}

export const UserTrendingCharts = ({ trendingPosts }: UserTrendingChartsProps) => {
  // Engagement data per post
  const engagementData = trendingPosts.map((post, idx) => ({
    name: `Post ${idx + 1}`,
    likes: post.likes,
    comments: post.comments,
    views: post.views,
    shares: post.shares,
    score: post.trendingScore,
  }));

  // Total engagement distribution
  const totalEngagement = {
    likes: trendingPosts.reduce((sum, p) => sum + p.likes, 0),
    comments: trendingPosts.reduce((sum, p) => sum + p.comments, 0),
    views: trendingPosts.reduce((sum, p) => sum + p.views, 0),
    shares: trendingPosts.reduce((sum, p) => sum + p.shares, 0),
  };

  const pieData = [
    { name: "Me gusta", value: totalEngagement.likes, color: "hsl(var(--destructive))" },
    { name: "Comentarios", value: totalEngagement.comments, color: "hsl(var(--primary))" },
    { name: "Vistas", value: totalEngagement.views, color: "hsl(var(--accent))" },
    { name: "Compartidos", value: totalEngagement.shares, color: "hsl(var(--secondary))" },
  ];

  // Trending score over time
  const trendingScoreData = trendingPosts.map((post, idx) => ({
    name: `#${idx + 1}`,
    score: post.trendingScore,
  }));

  // Radar data for engagement profile
  const avgEngagement = trendingPosts.length > 0 ? {
    likes: Math.round(totalEngagement.likes / trendingPosts.length),
    comments: Math.round(totalEngagement.comments / trendingPosts.length),
    views: Math.round(totalEngagement.views / trendingPosts.length),
    shares: Math.round(totalEngagement.shares / trendingPosts.length),
  } : { likes: 0, comments: 0, views: 0, shares: 0 };

  const radarData = [
    { metric: 'Me gusta', value: avgEngagement.likes, fullMark: Math.max(...trendingPosts.map(p => p.likes), 1) },
    { metric: 'Comentarios', value: avgEngagement.comments, fullMark: Math.max(...trendingPosts.map(p => p.comments), 1) },
    { metric: 'Vistas', value: avgEngagement.views, fullMark: Math.max(...trendingPosts.map(p => p.views), 1) },
    { metric: 'Compartidos', value: avgEngagement.shares, fullMark: Math.max(...trendingPosts.map(p => p.shares), 1) },
  ];

  if (trendingPosts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos suficientes para mostrar gráficos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Engagement Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas por Publicación</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
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

      {/* Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución de Engagement</CardTitle>
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
                outerRadius={100}
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

      {/* Trending Score Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Puntuación de Tendencia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendingScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
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

      {/* Engagement Profile Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil de Engagement Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" stroke="hsl(var(--foreground))" fontSize={12} />
              <PolarRadiusAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Radar 
                name="Engagement" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
