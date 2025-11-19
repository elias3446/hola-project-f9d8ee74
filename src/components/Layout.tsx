import { ReactNode, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";

interface LayoutProps {
  children: ReactNode;
  title: string;
  icon: LucideIcon;
}

export const Layout = ({ children, title, icon }: LayoutProps) => {
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo(title, icon);
  }, [title, icon, setPageInfo]);

  return (
    <div className="w-full h-full p-6">
      {children}
    </div>
  );
};
