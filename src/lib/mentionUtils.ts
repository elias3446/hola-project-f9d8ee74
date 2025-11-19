/**
 * Extract all mentions from text content
 * @param text - The text to extract mentions from
 * @returns Array of unique usernames mentioned
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  // Return unique mentions
  return [...new Set(mentions)];
};

/**
 * Get profile IDs for mentioned usernames
 * @param usernames - Array of usernames
 * @returns Array of profile IDs
 */
export const getMentionedUserIds = async (
  usernames: string[],
  supabase: any
): Promise<string[]> => {
  if (usernames.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .in("username", usernames)
      .eq("estado", "activo")
      .is("deleted_at", null);

    if (error) throw error;
    return data?.map((profile: any) => profile.id) || [];
  } catch (error) {
    console.error("Error fetching mentioned user IDs:", error);
    return [];
  }
};
