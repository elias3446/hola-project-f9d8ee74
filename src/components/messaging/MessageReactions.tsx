import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactionGroup } from "@/hooks/useMessageReactions";
import { EmojiPicker } from "./EmojiPicker";

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionGroup[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  className?: string;
}

export const MessageReactions = ({
  messageId,
  reactions,
  onToggleReaction,
  className,
}: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div 
      className={cn("flex flex-wrap gap-1 mt-1 items-center", className)}
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => setShowPicker(false)}
    >
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleReaction(messageId, reaction.emoji)}
                className={cn(
                  "h-6 px-2 py-0 text-xs gap-1 hover:scale-105 transition-transform",
                  reaction.hasReacted && "bg-primary/10 border-primary"
                )}
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {reaction.count === 1 ? "1 persona" : `${reaction.count} personas`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {(showPicker || reactions.length === 0) && (
        <EmojiPicker
          onEmojiSelect={(emoji) => onToggleReaction(messageId, emoji)}
        />
      )}
    </div>
  );
};
