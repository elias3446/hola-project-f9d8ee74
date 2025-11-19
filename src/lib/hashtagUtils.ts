import React from 'react';

/**
 * Extract hashtags from text
 * @param text - The text to extract hashtags from
 * @returns Array of unique hashtags (without the # symbol)
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  
  // Match hashtags: # followed by letters, numbers, underscores (at least one character)
  const hashtagRegex = /#([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑüÜ]+)/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # symbol and convert to lowercase, remove duplicates
  const hashtags = matches.map(tag => tag.slice(1).toLowerCase());
  return [...new Set(hashtags)];
};

/**
 * Render text with clickable hashtags
 * @param text - The text to render
 * @param onHashtagClick - Callback when a hashtag is clicked
 * @returns React elements with clickable hashtags
 */
export const renderTextWithHashtags = (
  text: string,
  onHashtagClick?: (hashtag: string) => void
): React.ReactNode[] => {
  if (!text) return [];
  
  const hashtagRegex = /(#[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑüÜ]+)/g;
  const parts = text.split(hashtagRegex);
  
  return parts.map((part, index) => {
    if (part.match(hashtagRegex)) {
      const hashtag = part.slice(1); // Remove #
      return React.createElement(
        'span',
        {
          key: index,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onHashtagClick?.(hashtag);
          },
          className: "text-primary hover:underline cursor-pointer font-medium"
        },
        part
      );
    }
    return part;
  });
};
