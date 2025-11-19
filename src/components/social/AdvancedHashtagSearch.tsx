import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Hash, Search, AtSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchOperator = "AND" | "OR";

export interface SearchCriteria {
  hashtags: string[];
  mentions: string[];
  operator: SearchOperator;
}

interface AdvancedHashtagSearchProps {
  onSearch: (criteria: SearchCriteria) => void;
  onClear: () => void;
}

export const AdvancedHashtagSearch = ({
  onSearch,
  onClear,
}: AdvancedHashtagSearchProps) => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [mentionInput, setMentionInput] = useState("");
  const [operator, setOperator] = useState<SearchOperator>("OR");

  const triggerSearch = (newHashtags: string[], newMentions: string[], newOperator: SearchOperator) => {
    if (newHashtags.length === 0 && newMentions.length === 0) {
      onClear();
    } else {
      onSearch({
        hashtags: newHashtags,
        mentions: newMentions,
        operator: newOperator,
      });
    }
  };

  const handleAddHashtag = () => {
    const cleanedValue = hashtagInput
      .trim()
      .replace(/^#/, "")
      .toLowerCase();
    
    if (cleanedValue && !hashtags.includes(cleanedValue)) {
      const newHashtags = [...hashtags, cleanedValue];
      setHashtags(newHashtags);
      setHashtagInput("");
      triggerSearch(newHashtags, mentions, operator);
    }
  };

  const handleAddMention = () => {
    const cleanedValue = mentionInput
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
    
    if (cleanedValue && !mentions.includes(cleanedValue)) {
      const newMentions = [...mentions, cleanedValue];
      setMentions(newMentions);
      setMentionInput("");
      triggerSearch(hashtags, newMentions, operator);
    }
  };

  const handleRemoveHashtag = (hashtagToRemove: string) => {
    const newHashtags = hashtags.filter((h) => h !== hashtagToRemove);
    setHashtags(newHashtags);
    triggerSearch(newHashtags, mentions, operator);
  };

  const handleRemoveMention = (mentionToRemove: string) => {
    const newMentions = mentions.filter((m) => m !== mentionToRemove);
    setMentions(newMentions);
    triggerSearch(hashtags, newMentions, operator);
  };

  const handleOperatorChange = (newOperator: SearchOperator) => {
    setOperator(newOperator);
    if (hashtags.length > 0 || mentions.length > 0) {
      triggerSearch(hashtags, mentions, newOperator);
    }
  };

  const handleClearAll = () => {
    setHashtags([]);
    setMentions([]);
    setHashtagInput("");
    setMentionInput("");
    onClear();
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleMentionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMention();
    }
  };

  const totalItems = hashtags.length + mentions.length;

  return (
    <Card className="p-5 mb-4 border-border/50 shadow-[var(--shadow-soft)] bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:shadow-[var(--shadow-medium)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-base bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Búsqueda Avanzada
        </h3>
      </div>

      <div className="space-y-4">
        <Tabs defaultValue="hashtags" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 p-1">
            <TabsTrigger 
              value="hashtags" 
              className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Hash className="h-4 w-4 mr-1.5" />
              Hashtags
            </TabsTrigger>
            <TabsTrigger 
              value="mentions" 
              className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <AtSign className="h-4 w-4 mr-1.5" />
              Menciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hashtags" className="mt-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                <Input
                  placeholder="Escribe un hashtag..."
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  className="pl-9 h-10 bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddHashtag}
                disabled={!hashtagInput.trim()}
                className="h-10 px-4 bg-primary hover:bg-primary-hover transition-colors"
              >
                Agregar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mentions" className="mt-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                <Input
                  placeholder="Escribe un usuario..."
                  value={mentionInput}
                  onChange={(e) => setMentionInput(e.target.value)}
                  onKeyPress={handleMentionKeyPress}
                  className="pl-9 h-10 bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddMention}
                disabled={!mentionInput.trim()}
                className="h-10 px-4 bg-primary hover:bg-primary-hover transition-colors"
              >
                Agregar
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Operator selector - only show if there are multiple items */}
        {totalItems > 1 && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/40">
            <span className="text-sm font-medium text-foreground">Operador:</span>
            <Select value={operator} onValueChange={(value) => handleOperatorChange(value as SearchOperator)}>
              <SelectTrigger className="w-36 h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OR">O (cualquiera)</SelectItem>
                <SelectItem value="AND">Y (todos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selected items */}
        {totalItems > 0 && (
          <div className="space-y-3 p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {totalItems} {totalItems === 1 ? "criterio" : "criterios"} seleccionado{totalItems !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                Limpiar todo
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((hashtag) => (
                <Badge
                  key={`hashtag-${hashtag}`}
                  variant="secondary"
                  className="pl-2.5 pr-1.5 py-1.5 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border-primary/20 transition-colors"
                >
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{hashtag}</span>
                  <button
                    onClick={() => handleRemoveHashtag(hashtag)}
                    className="rounded-full hover:bg-destructive/20 p-0.5 transition-colors group"
                  >
                    <X className="h-3.5 w-3.5 group-hover:text-destructive transition-colors" />
                  </button>
                </Badge>
              ))}
              {mentions.map((mention) => (
                <Badge
                  key={`mention-${mention}`}
                  variant="outline"
                  className="pl-2.5 pr-1.5 py-1.5 flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border-accent/30 transition-colors"
                >
                  <AtSign className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-medium">{mention}</span>
                  <button
                    onClick={() => handleRemoveMention(mention)}
                    className="rounded-full hover:bg-destructive/20 p-0.5 transition-colors group"
                  >
                    <X className="h-3.5 w-3.5 group-hover:text-destructive transition-colors" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
