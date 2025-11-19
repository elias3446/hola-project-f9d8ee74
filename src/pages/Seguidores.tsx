import { Layout } from "@/components/Layout";
import { Users, Search, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useFollowersList } from "@/hooks/useFollowersList";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useParams, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

const Seguidores = () => {
  const { username } = useParams();
  const { profile: currentProfile } = useProfile();
  const {
    followers,
    following,
    loading,
    searchQuery,
    setSearchQuery,
    updateFollowStatus,
    totalFollowers,
    totalFollowing,
    targetUsername,
  } = useFollowersList(username);
  
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();

  const isOwnProfile = !username || username === currentProfile?.username;

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      await unfollowUser(userId);
      updateFollowStatus(userId, false);
    } else {
      await followUser(userId);
      updateFollowStatus(userId, true);
    }
  };

  const renderUserList = (users: typeof followers, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const isOwnProfile = currentProfile?.id === user.id;
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Link to={`/usuario/${user.username}`} className="flex-shrink-0">
                    <UserAvatar
                      avatar={user.avatar}
                      name={user.name}
                      username={user.username}
                      size="md"
                      enableModal={false}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/usuario/${user.username}`}
                      className="hover:underline"
                    >
                      <h3 className="font-semibold text-sm truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </Link>
                    {user.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    {!isOwnProfile && (
                      <Button
                        size="sm"
                        variant={user.isFollowing ? "secondary" : "default"}
                        onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                        disabled={followLoading}
                        className="mt-3 w-full h-8 text-xs gap-1.5"
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Layout 
      title={
        targetUsername && !isOwnProfile
          ? `Seguidores de @${targetUsername}`
          : "Mis Seguidores y Seguidos"
      } 
      icon={Users}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Card */}
        <Card className="p-5 bg-gradient-to-br from-background to-muted/20 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50"
              />
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1">
            <TabsTrigger 
              value="followers" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Seguidores ({totalFollowers})
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Siguiendo ({totalFollowing})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-6">
            {renderUserList(
              followers,
              searchQuery
                ? "No se encontraron seguidores con ese criterio"
                : "Aún no tienes seguidores"
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            {renderUserList(
              following,
              searchQuery
                ? "No se encontraron usuarios con ese criterio"
                : "Aún no sigues a nadie"
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Seguidores;
