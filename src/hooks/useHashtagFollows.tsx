import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useHashtagFollows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followedHashtags, setFollowedHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  const fetchProfileId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfileId(data.id);
    } catch (error) {
      console.error("Error fetching profile ID:", error);
    }
  };

  const fetchFollowedHashtags = async () => {
    if (!user || !profileId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_hashtag_follows")
        .select(`
          hashtag_id,
          hashtags!inner(nombre)
        `)
        .eq("user_id", profileId);

      if (error) throw error;

      setFollowedHashtags(data?.map((item: any) => item.hashtags.nombre) || []);
    } catch (error) {
      console.error("Error fetching followed hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  const followHashtag = async (hashtagName: string) => {
    if (!user || !profileId) return;

    try {
      // Get or create hashtag
      let { data: hashtag } = await supabase
        .from("hashtags")
        .select("id")
        .eq("nombre", hashtagName.toLowerCase())
        .maybeSingle();

      if (!hashtag) {
        const { data: newHashtag, error: createError } = await supabase
          .from("hashtags")
          .insert({ nombre: hashtagName.toLowerCase() })
          .select()
          .single();

        if (createError) throw createError;
        hashtag = newHashtag;
      }

      // Follow hashtag - use profile ID
      const { error } = await supabase
        .from("user_hashtag_follows")
        .insert({
          user_id: profileId,
          hashtag_id: hashtag.id,
        });

      if (error) throw error;

      setFollowedHashtags([...followedHashtags, hashtagName.toLowerCase()]);
      
      toast({
        title: "Hashtag seguido",
        description: `Ahora sigues #${hashtagName}`,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Ya sigues este hashtag",
          variant: "destructive",
        });
      } else {
        console.error("Error following hashtag:", error);
        toast({
          title: "Error al seguir hashtag",
          variant: "destructive",
        });
      }
    }
  };

  const unfollowHashtag = async (hashtagName: string) => {
    if (!user || !profileId) return;

    try {
      const { data: hashtag } = await supabase
        .from("hashtags")
        .select("id")
        .eq("nombre", hashtagName.toLowerCase())
        .maybeSingle();

      if (!hashtag) return;

      const { error } = await supabase
        .from("user_hashtag_follows")
        .delete()
        .eq("user_id", profileId)
        .eq("hashtag_id", hashtag.id);

      if (error) throw error;

      setFollowedHashtags(followedHashtags.filter(h => h !== hashtagName.toLowerCase()));
      
      toast({
        title: "Dejaste de seguir",
        description: `Ya no sigues #${hashtagName}`,
      });
    } catch (error) {
      console.error("Error unfollowing hashtag:", error);
      toast({
        title: "Error al dejar de seguir",
        variant: "destructive",
      });
    }
  };

  const isFollowing = (hashtagName: string) => {
    return followedHashtags.includes(hashtagName.toLowerCase());
  };

  useEffect(() => {
    if (user) {
      fetchProfileId();
    }
  }, [user]);

  useEffect(() => {
    if (profileId) {
      fetchFollowedHashtags();
    }
  }, [profileId]);

  // Real-time subscription for hashtag follows
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('hashtag-follows-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_hashtag_follows'
        },
        () => {
          fetchFollowedHashtags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    followedHashtags,
    loading,
    followHashtag,
    unfollowHashtag,
    isFollowing,
    refreshFollows: fetchFollowedHashtags,
  };
};
