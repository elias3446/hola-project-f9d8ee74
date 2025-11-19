import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface FollowerUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export const useFollowersList = (targetUsername?: string) => {
  const { profile: currentProfile } = useProfile();
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetProfile, setTargetProfile] = useState<{ id: string; username: string } | null>(null);

  // Get target user ID from username if provided
  useEffect(() => {
    const fetchTargetUser = async () => {
      if (!targetUsername) {
        // Use current user
        if (currentProfile) {
          setTargetProfile({ id: currentProfile.id, username: currentProfile.username || "" });
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("username", targetUsername)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setTargetProfile({ id: data.id, username: data.username || "" });
        }
      } catch (error) {
        console.error("Error fetching target user:", error);
      }
    };

    fetchTargetUser();
  }, [targetUsername, currentProfile?.id]);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!targetProfile?.id) return;

      setLoading(true);
      try {
        // Get followers (users who follow the target user)
        const { data: followersData, error: followersError } = await supabase
          .from("relaciones")
          .select(`
            seguidor_id,
            profiles!relaciones_seguidor_id_fkey (
              id,
              username,
              name,
              avatar,
              bio
            )
          `)
          .eq("user_id", targetProfile.id)
          .eq("estado", "aceptado");

        if (followersError) throw followersError;

        // Get following (users that the target user follows)
        const { data: followingData, error: followingError } = await supabase
          .from("relaciones")
          .select(`
            user_id,
            profiles!relaciones_user_id_fkey (
              id,
              username,
              name,
              avatar,
              bio
            )
          `)
          .eq("seguidor_id", targetProfile.id)
          .eq("estado", "aceptado");

        if (followingError) throw followingError;

        // Get current user's following list to mark who they follow
        let currentUserFollowing: string[] = [];
        if (currentProfile?.id) {
          const { data: currentFollowingData } = await supabase
            .from("relaciones")
            .select("user_id")
            .eq("seguidor_id", currentProfile.id)
            .eq("estado", "aceptado");

          currentUserFollowing = currentFollowingData?.map(r => r.user_id) || [];
        }

        // Process followers
        const processedFollowers = (followersData || [])
          .map(item => {
            const profile = item.profiles as any;
            return {
              id: profile.id,
              username: profile.username,
              name: profile.name,
              avatar: profile.avatar,
              bio: profile.bio,
              isFollowing: currentUserFollowing.includes(profile.id),
            };
          })
          .filter(user => user.id !== currentProfile?.id); // Exclude self

        // Process following
        const processedFollowing = (followingData || [])
          .map(item => {
            const profile = item.profiles as any;
            return {
              id: profile.id,
              username: profile.username,
              name: profile.name,
              avatar: profile.avatar,
              bio: profile.bio,
              isFollowing: currentUserFollowing.includes(profile.id),
            };
          })
          .filter(user => user.id !== currentProfile?.id); // Exclude self

        setFollowers(processedFollowers);
        setFollowing(processedFollowing);
      } catch (error) {
        console.error("Error fetching followers/following:", error);
        setFollowers([]);
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [targetProfile?.id, currentProfile?.id]);

  const updateFollowStatus = (userId: string, isFollowing: boolean) => {
    setFollowers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
    setFollowing(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
  };

  const filteredFollowers = followers.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    followers: filteredFollowers,
    following: filteredFollowing,
    loading,
    searchQuery,
    setSearchQuery,
    updateFollowStatus,
    totalFollowers: followers.length,
    totalFollowing: following.length,
    targetUsername: targetProfile?.username,
  };
};
