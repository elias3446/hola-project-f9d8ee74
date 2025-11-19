import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Hash, AtSign } from "lucide-react";
import { useHashtagSuggestions } from "@/hooks/useHashtagSuggestions";
import { useUserSuggestions, UserSuggestion } from "@/hooks/useUserSuggestions";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  enableHashtags?: boolean;
  enableMentions?: boolean;
}

export const MentionTextarea = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  enableHashtags = true,
  enableMentions = true,
}: MentionTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'hashtag' | 'mention'>('hashtag');
  const [query, setQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { suggestions: hashtagSuggestions } = useHashtagSuggestions(
    suggestionType === 'hashtag' ? query : ''
  );
  const { suggestions: userSuggestions } = useUserSuggestions(
    suggestionType === 'mention' ? query : ''
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onChange(newContent);
    setCursorPosition(newCursorPos);

    const textBeforeCursor = newContent.slice(0, newCursorPos);
    
    // Check for mention (@)
    if (enableMentions) {
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
          setQuery(textAfterAt.toLowerCase());
          setSuggestionType('mention');
          setShowSuggestions(true);
          return;
        }
      }
    }

    // Check for hashtag (#)
    if (enableHashtags) {
      const lastHashIndex = textBeforeCursor.lastIndexOf("#");
      if (lastHashIndex !== -1) {
        const textAfterHash = textBeforeCursor.slice(lastHashIndex + 1);
        if (!textAfterHash.includes(" ") && !textAfterHash.includes("\n")) {
          setQuery(textAfterHash.toLowerCase());
          setSuggestionType('hashtag');
          setShowSuggestions(true);
          return;
        }
      }
    }
    
    setShowSuggestions(false);
    setQuery("");
  };

  const insertSuggestion = (text: string, prefix: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastPrefixIndex = textBeforeCursor.lastIndexOf(prefix);
    
    if (lastPrefixIndex !== -1) {
      const newContent = 
        value.slice(0, lastPrefixIndex) + 
        `${prefix}${text} ` + 
        textAfterCursor;
      
      onChange(newContent);
      setShowSuggestions(false);
      setQuery("");
      
      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newPos = lastPrefixIndex + text.length + 2;
        textareaRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsideTextarea = textareaRef.current && !textareaRef.current.contains(target);
      const isOutsideSuggestions = suggestionsRef.current && !suggestionsRef.current.contains(target);
      
      if (isOutsideTextarea && isOutsideSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSuggestions = suggestionType === 'hashtag' ? hashtagSuggestions : userSuggestions;

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleContentChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && currentSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef} 
          className="absolute z-50 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95"
        >
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 px-2">
            {suggestionType === 'hashtag' ? (
              <>
                <Hash className="h-3 w-3" />
                Hashtags sugeridos
              </>
            ) : (
              <>
                <AtSign className="h-3 w-3" />
                Usuarios sugeridos
              </>
            )}
          </div>
          <div className="space-y-1">
            {suggestionType === 'hashtag' ? (
              hashtagSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => insertSuggestion(suggestion.nombre, '#')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">#{suggestion.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.uso_count} usos
                  </span>
                </button>
              ))
            ) : (
              userSuggestions.map((user: UserSuggestion) => (
                <button
                  key={user.id}
                  onClick={() => insertSuggestion(user.username, '@')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <UserAvatar
                    avatar={user.avatar}
                    name={user.name}
                    username={user.username}
                    size="sm"
                    showName={false}
                    enableModal={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">@{user.username}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
