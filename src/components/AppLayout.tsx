import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PageProvider, usePageContext } from "@/contexts/PageContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { useMenuCounts } from "@/hooks/useMenuCounts";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { UserDropdown } from "@/components/UserDropdown";

const AppHeader = () => {
  const { title, icon: Icon } = usePageContext();
  const { counts, fetchCounts } = useMenuCounts();

  return (
    <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {/* Mobile menu trigger - visible only on mobile */}
        <SidebarTrigger className="md:hidden mr-2" />
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationsDropdown count={counts.notificaciones} onCountChange={fetchCounts} />

        {/* User Avatar Dropdown - Solo avatar */}
        <UserDropdown showInfo={false} />
      </div>
    </header>
  );
};

export const AppLayout = () => {
  return (
    <LocationProvider>
      <PageProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="h-screen flex w-full overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              <main className="flex-1 overflow-y-auto bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </PageProvider>
    </LocationProvider>
  );
};
