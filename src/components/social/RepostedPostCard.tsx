import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { renderTextWithHashtags } from "@/lib/hashtagUtils";

interface RepostedPostCardProps {
  originalPost: {
    author: {
      name: string;
      avatar: string | null;
      username: string;
    };
    content: string;
    timestamp: Date;
    image?: string;
  };
  onHashtagClick?: (hashtag: string) => void;
}

export const RepostedPostCard = ({
  originalPost,
  onHashtagClick,
}: RepostedPostCardProps) => {
  return (
    <Card className="p-3 bg-muted/30 border-border mt-2">
      <div className="flex gap-2 items-center mb-2 text-xs text-muted-foreground">
        <Repeat2 className="h-3 w-3" />
        <span>Publicación compartida</span>
      </div>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <UserAvatar
            avatar={originalPost.author.avatar}
            name={originalPost.author.name}
            username={originalPost.author.username}
            size="sm"
            enableModal={true}
            showName={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/usuario/${originalPost.author.username}`}
            className="hover:underline"
          >
            <div className="mb-1">
              <p className="font-semibold text-sm">{originalPost.author.name}</p>
              <p className="text-xs text-muted-foreground">
                @{originalPost.author.username} ·{" "}
                {formatDistanceToNow(originalPost.timestamp, {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </Link>

          <p className="text-sm mb-2 whitespace-pre-wrap">
            {renderTextWithHashtags(originalPost.content, onHashtagClick)}
          </p>

          {originalPost.image && (
            <img
              src={originalPost.image}
              alt="Contenido compartido"
              className="rounded-lg w-full object-cover max-h-64"
            />
          )}
        </div>
      </div>
    </Card>
  );
};
