import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EstadoReaccion } from "@/hooks/useEstados";

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface StatusReactionsProps {
  estadoId: string;
  reactions: EstadoReaccion[];
  currentUserId?: string;
  onToggleReaction: (estadoId: string, emoji: string) => void;
  onShowPicker: () => void;
  className?: string;
}

export const StatusReactions = ({
  estadoId,
  reactions,
  currentUserId,
  onToggleReaction,
  onShowPicker,
  className,
}: StatusReactionsProps) => {
  // Agrupar reacciones por emoji
  const groupedReactions: ReactionGroup[] = reactions.reduce((acc, reaction) => {
    const existing = acc.find(r => r.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(reaction.user_id);
      if (reaction.user_id === currentUserId) {
        existing.hasReacted = true;
      }
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user_id],
        hasReacted: reaction.user_id === currentUserId,
      });
    }
    return acc;
  }, [] as ReactionGroup[]);

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {groupedReactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReaction(estadoId, reaction.emoji)}
                className={cn(
                  "h-8 px-3 py-0 text-base gap-1.5 hover:scale-105 transition-transform bg-white/10 hover:bg-white/20 text-white border-0",
                  reaction.hasReacted && "bg-primary/20 ring-1 ring-primary/50"
                )}
              >
                <span className="text-lg">{reaction.emoji}</span>
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

      <Button
        variant="ghost"
        size="sm"
        onClick={onShowPicker}
        className="h-8 w-8 p-0 text-white hover:bg-white/20 bg-white/10"
      >
        <span className="text-lg">+</span>
      </Button>
    </div>
  );
};
