import { createContext, useContext, useState, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageContextType {
  title: string;
  icon: LucideIcon | null;
  setPageInfo: (title: string, icon: LucideIcon) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState("Dashboard");
  const [icon, setIcon] = useState<LucideIcon | null>(null);

  const setPageInfo = (newTitle: string, newIcon: LucideIcon) => {
    setTitle(newTitle);
    setIcon(newIcon);
  };

  return (
    <PageContext.Provider value={{ title, icon, setPageInfo }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within PageProvider");
  }
  return context;
};
