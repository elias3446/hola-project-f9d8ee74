import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFrequentEmojis } from "@/hooks/useFrequentEmojis";

const EMOJI_DATA: Record<string, string[]> = {
  "❤️": ["corazon", "amor", "love", "heart"],
  "👍": ["bien", "ok", "pulgar", "arriba", "like"],
  "😂": ["risa", "llorar", "riendo", "jaja", "laugh"],
  "😮": ["wow", "sorpresa", "sorprendido", "asombro"],
  "😢": ["triste", "llorar", "lagrima", "sad"],
  "😡": ["enojado", "molesto", "angry", "furioso"],
  "🎉": ["celebrar", "fiesta", "party", "celebracion"],
  "🔥": ["fuego", "fire", "hot", "genial"],
  "👏": ["aplaudir", "aplauso", "clap", "bravo"],
  "✨": ["brillar", "sparkle", "brillo", "estrellas"],
  "😀": ["feliz", "sonrisa", "happy", "alegre"],
  "😃": ["sonriendo", "alegre", "contento", "smile"],
  "😄": ["riendo", "feliz", "sonrisa", "happy"],
  "😁": ["sonrisa", "dientes", "grin", "feliz"],
  "😆": ["risa", "riendo", "laugh", "squinting"],
  "😅": ["sudor", "nervioso", "sweat", "alivio"],
  "🤣": ["risa", "rodando", "rofl", "crying"],
  "🙂": ["sonrisa", "ligera", "slight", "smile"],
  "🙃": ["invertido", "upside", "down", "sarcasmo"],
  "😉": ["guiño", "wink", "coqueto", "complicidad"],
  "😊": ["sonrojo", "blush", "feliz", "timido"],
  "😇": ["angel", "inocente", "halo", "santo"],
  "🥰": ["enamorado", "amor", "corazones", "love"],
  "😍": ["enamorado", "amor", "heart", "eyes"],
  "🤩": ["estrellas", "ojos", "star", "struck"],
  "😘": ["beso", "kiss", "corazon", "amor"],
  "😗": ["beso", "kiss", "silbido", "whistle"],
  "😚": ["beso", "ojos", "cerrados", "kiss"],
  "😙": ["beso", "sonrisa", "kiss", "smile"],
  "😋": ["rico", "sabroso", "yum", "delicious"],
  "😛": ["lengua", "tongue", "out", "playful"],
  "😜": ["guiño", "lengua", "wink", "tongue"],
  "🤪": ["loco", "crazy", "zany", "goofy"],
  "😝": ["lengua", "ojos", "squinting", "tongue"],
  "🤑": ["dinero", "money", "mouth", "rico"],
  "🤗": ["abrazo", "hug", "hands", "abrazar"],
  "🤭": ["ups", "oops", "mano", "boca"],
  "🤫": ["silencio", "shh", "quiet", "secreto"],
  "🤔": ["pensar", "thinking", "duda", "hmm"],
  "🤐": ["zipper", "boca", "cerrada", "callado"],
  "🤨": ["ceja", "eyebrow", "raised", "sospecha"],
  "😐": ["neutral", "sin", "expresion", "meh"],
  "😑": ["sin", "expresion", "expressionless", "aburrido"],
  "😶": ["sin", "boca", "no", "mouth"],
  "😏": ["picaro", "smirk", "malicia", "coqueto"],
  "😒": ["aburrido", "unamused", "molesto", "desinteresado"],
  "🙄": ["ojos", "rodando", "rolling", "exasperado"],
  "😬": ["mueca", "grimace", "incomodo", "awkward"],
  "🤥": ["mentira", "lying", "pinocho", "nariz"],
  "😌": ["aliviado", "relieved", "tranquilo", "paz"],
  "😔": ["pensativo", "pensive", "triste", "sad"],
  "😪": ["cansado", "sleepy", "sueño", "tired"],
  "🤤": ["babear", "drool", "antojo", "delicious"],
  "😴": ["dormir", "sleeping", "zzz", "sueño"],
  "😷": ["mascarilla", "mask", "enfermo", "sick"],
  "🤒": ["termometro", "fever", "enfermo", "sick"],
  "🤕": ["vendaje", "bandage", "herido", "injured"],
  "🤢": ["nausea", "sick", "verde", "nauseated"],
  "🤮": ["vomitar", "vomit", "sick", "nauseated"],
  "👎": ["mal", "no", "pulgar", "abajo", "dislike"],
  "👊": ["puño", "fist", "bump", "punch"],
  "✊": ["puño", "fist", "raised", "poder"],
  "🤛": ["puño", "izquierda", "left", "fist"],
  "🤜": ["puño", "derecha", "right", "fist"],
  "🤞": ["dedos", "cruzados", "crossed", "suerte"],
  "✌️": ["paz", "peace", "victoria", "v"],
  "🤟": ["amor", "rock", "cuernos", "love"],
  "🤘": ["rock", "cuernos", "horns", "metal"],
  "👌": ["ok", "bien", "perfecto", "perfect"],
  "🤏": ["poquito", "pinch", "pequeño", "little"],
  "👈": ["izquierda", "left", "point", "señalar"],
  "👉": ["derecha", "right", "point", "señalar"],
  "👆": ["arriba", "up", "point", "señalar"],
  "👇": ["abajo", "down", "point", "señalar"],
  "☝️": ["arriba", "index", "up", "uno"],
  "✋": ["mano", "hand", "raised", "stop"],
  "🤚": ["dorso", "mano", "back", "hand"],
  "🖐": ["mano", "abierta", "hand", "fingers"],
  "🖖": ["vulcano", "spock", "live", "prosper"],
  "👋": ["hola", "adios", "wave", "saludo"],
  "🤙": ["llamar", "shaka", "hang", "loose"],
  "💪": ["musculo", "fuerte", "strong", "flex"],
  "🦾": ["mecanico", "brazo", "mechanical", "arm"],
  "🖕": ["dedo", "medio", "middle", "finger"],
  "✍️": ["escribir", "write", "pluma", "hand"],
  "🙏": ["rezar", "gracias", "pray", "thanks"],
  "🦶": ["pie", "foot", "pata"],
  "🦵": ["pierna", "leg"],
  "🧡": ["corazon", "naranja", "orange", "heart"],
  "💛": ["corazon", "amarillo", "yellow", "heart"],
  "💚": ["corazon", "verde", "green", "heart"],
  "💙": ["corazon", "azul", "blue", "heart"],
  "💜": ["corazon", "morado", "purple", "heart"],
  "🖤": ["corazon", "negro", "black", "heart"],
  "🤍": ["corazon", "blanco", "white", "heart"],
  "🤎": ["corazon", "cafe", "brown", "heart"],
  "💔": ["corazon", "roto", "broken", "heart"],
  "❣️": ["corazon", "exclamacion", "exclamation", "heart"],
  "💕": ["corazones", "dos", "two", "hearts"],
  "💞": ["corazones", "girando", "revolving", "hearts"],
  "💓": ["corazon", "latiendo", "beating", "heart"],
  "💗": ["corazon", "creciendo", "growing", "heart"],
  "💖": ["corazon", "brillante", "sparkling", "heart"],
  "💘": ["corazon", "flecha", "arrow", "cupido"],
  "💝": ["corazon", "regalo", "gift", "heart"],
  "💟": ["corazon", "decoracion", "decoration", "heart"],
  "🎊": ["confeti", "confetti", "ball", "celebracion"],
  "🎈": ["globo", "balloon", "fiesta", "party"],
  "🎁": ["regalo", "gift", "present", "sorpresa"],
  "🏆": ["trofeo", "trophy", "ganador", "winner"],
  "🥇": ["oro", "gold", "medal", "primero"],
  "🥈": ["plata", "silver", "medal", "segundo"],
  "🥉": ["bronce", "bronze", "medal", "tercero"],
  "⭐": ["estrella", "star", "favorito"],
  "🌟": ["estrella", "brillante", "glowing", "star"],
  "💫": ["mareado", "dizzy", "estrellas"],
  "💥": ["explosion", "boom", "collision", "bang"],
  "💯": ["cien", "hundred", "perfect", "100"],
  "✅": ["check", "marca", "si", "correcto"],
  "❌": ["x", "cruz", "no", "error"],
  "⚠️": ["advertencia", "warning", "precaucion", "alert"],
  "🚀": ["cohete", "rocket", "space", "despegar"],
  "🎯": ["diana", "target", "objetivo", "bullseye"],
};

const DEFAULT_FREQUENT = ["❤️", "👍", "😂", "😮", "😢", "😡", "🎉", "🔥", "👏", "✨"];

const EMOJI_CATEGORIES = {
  frequent: {
    name: "Frecuentes",
    emojis: DEFAULT_FREQUENT,
  },
  smileys: {
    name: "Emojis y personas",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
      "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
    ],
  },
  gestures: {
    name: "Gestos",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘",
      "👌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐",
      "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🙏", "🦶", "🦵",
    ],
  },
  hearts: {
    name: "Corazones",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
    ],
  },
  objects: {
    name: "Objetos",
    emojis: [
      "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⭐", "🌟",
      "💫", "✨", "🔥", "💥", "💯", "✅", "❌", "⚠️", "🚀", "🎯",
    ],
  },
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export const EmojiPicker = ({ onEmojiSelect, className }: EmojiPickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { frequentEmojis, refetch } = useFrequentEmojis();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      refetch();
    }
  };

  const categories = useMemo(() => ({
    ...EMOJI_CATEGORIES,
    frequent: {
      name: "Frecuentes",
      emojis: frequentEmojis.length > 0 ? frequentEmojis : DEFAULT_FREQUENT,
    },
  }), [frequentEmojis]);

  const filteredEmojis = useMemo(() => {
    if (!search) return categories;

    const searchLower = search.toLowerCase();
    const filtered: typeof EMOJI_CATEGORIES = {
      frequent: { name: "Frecuentes", emojis: [] },
      smileys: { name: "Emojis y personas", emojis: [] },
      gestures: { name: "Gestos", emojis: [] },
      hearts: { name: "Corazones", emojis: [] },
      objects: { name: "Objetos", emojis: [] },
    };

    Object.entries(categories).forEach(([key, category]) => {
      const matchingEmojis = category.emojis.filter((emoji) => {
        const keywords = EMOJI_DATA[emoji] || [];
        return keywords.some(keyword => keyword.includes(searchLower));
      });
      
      if (matchingEmojis.length > 0) {
        filtered[key as keyof typeof EMOJI_CATEGORIES].emojis = matchingEmojis;
      }
    });

    return filtered;
  }, [search, categories]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 w-6 p-0 hover:bg-accent rounded-full transition-all", className)}
          type="button"
        >
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            {Object.entries(filteredEmojis).map(([key, category]) => {
              if (category.emojis.length === 0) return null;
              
              return (
                <div key={key} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                    {category.name}
                  </h4>
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl p-1 hover:bg-accent rounded transition-colors"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
