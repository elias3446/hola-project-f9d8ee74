import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Friend {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
}

interface UserFriendsProps {
  userId: string;
}

export const UserFriends = ({ userId }: UserFriendsProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      // Fetch accepted friend relationships
      const { data: relaciones, error } = await supabase
        .from("relaciones")
        .select(`
          id,
          user_id,
          seguidor_id,
          estado,
          profiles_user:profiles!relaciones_user_id_fkey(id, name, username, avatar, bio),
          profiles_seguidor:profiles!relaciones_seguidor_id_fkey(id, name, username, avatar, bio)
        `)
        .or(`user_id.eq.${userId},seguidor_id.eq.${userId}`)
        .eq("estado", "aceptado");

      if (error) throw error;

      // Extract friend profiles (the user who is not the current user)
      const friendsList: Friend[] = (relaciones || []).map((rel: any) => {
        if (rel.user_id === userId) {
          return {
            id: rel.profiles_seguidor?.id,
            name: rel.profiles_seguidor?.name,
            username: rel.profiles_seguidor?.username,
            avatar: rel.profiles_seguidor?.avatar,
            bio: rel.profiles_seguidor?.bio,
          };
        } else {
          return {
            id: rel.profiles_user?.id,
            name: rel.profiles_user?.name,
            username: rel.profiles_user?.username,
            avatar: rel.profiles_user?.avatar,
            bio: rel.profiles_user?.bio,
          };
        }
      }).filter((friend): friend is Friend => friend.id !== undefined);

      setFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Amigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Amigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No tienes amigos agregados aún
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Amigos
          <Badge variant="secondary" className="ml-2">
            {friends.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <Link
              key={friend.id}
              to={`/usuario/${friend.username || friend.id}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <UserAvatar
                avatar={friend.avatar}
                name={friend.name}
                username={friend.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{friend.name || "Sin nombre"}</p>
                {friend.username && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{friend.username}
                  </p>
                )}
                {friend.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {friend.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
