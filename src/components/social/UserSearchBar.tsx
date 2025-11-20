import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const UserSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { users, loading } = useUserSearch(searchTerm);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = (username: string) => {
    navigate(`/usuario/${username}`);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && searchTerm && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-[400px] overflow-y-auto shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Buscando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="py-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.username || user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3",
                    "hover:bg-accent transition-colors text-left"
                  )}
                >
                  <UserAvatar
                    name={user.name || user.username || "Usuario"}
                    avatar={user.avatar}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.name || user.username || "Usuario"}
                    </p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
