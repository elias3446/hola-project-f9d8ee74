import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionProtectedRoute } from "@/components/PermissionProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Reportes from "./pages/Reportes";
import CrearReporte from "./components/reportes/CrearReporte";
import ReporteDetalle from "./components/reportes/ReporteDetalle";
import MisReportes from "./pages/MisReportes";
import Categorias from "./pages/Categorias";
import CrearCategoria from "./components/categories/CrearCategoria";
import CategoriaDetalle from "./components/categories/CategoriaDetalle";
import TiposReportes from "./pages/TiposReportes";
import CrearTipoReporte from "./components/tipo-reportes/CrearTipoReporte";
import TipoReporteDetalle from "./components/tipo-reportes/TipoReporteDetalle";
import Usuarios from "./pages/Usuarios";
import UsuarioDetalle from "./components/users/UsuarioDetalle";
import CrearUsuario from "./components/users/CrearUsuario";
import EditarPerfil from "./components/users/EditarPerfil";
import Auditoria from "./pages/Auditoria";
import Configuracion from "./pages/Configuracion";
import Rastreo from "./pages/Rastreo";
import ConfiguracionRastreo from "./pages/ConfiguracionRastreo";
import Mensajeria from "./pages/Mensajeria";
import RedSocial from "./pages/RedSocial";
import TrendingPosts from "./pages/TrendingPosts";
import PerfilUsuario from "./components/social/PerfilUsuario";
import Perfil from "./pages/Perfil";
import Notificaciones from "./pages/Notificaciones";
import Seguidores from "./pages/Seguidores";
import NotFound from "./pages/NotFound";
import { RealTimeTrackingProvider } from "@/components/RealTimeTrackingProvider";

const queryClient = new QueryClient();

// Protected routes wrapper with password change check
const ProtectedRoutesWrapper = () => {
  const { mustChangePassword, profile, loading } = useAuth();

  if (loading) {
    return null; // Loading handled by ProtectedRoute
  }

  // If user must change password, show force password change screen
  if (mustChangePassword && profile?.id) {
    return <ForcePasswordChange profileId={profile.id} onSuccess={() => window.location.reload()} />;
  }

  return <AppLayout />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RealTimeTrackingProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><ProtectedRoutesWrapper /></ProtectedRoute>}>
              <Route path="/" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/mis-reportes" element={<MisReportes />} />
              <Route path="/reportes/:id" element={<PermissionProtectedRoute permission="ver_reporte" redirectTo="/reportes"><ReporteDetalle /></PermissionProtectedRoute>} />
              <Route path="/reportes/crear" element={<PermissionProtectedRoute permission="crear_reporte" redirectTo="/reportes"><CrearReporte /></PermissionProtectedRoute>} />
              <Route path="/reportes/editar/:id" element={<PermissionProtectedRoute permission="editar_reporte" redirectTo="/reportes"><CrearReporte /></PermissionProtectedRoute>} />
              <Route path="/rastreo" element={<Rastreo />} />
              <Route path="/tipos-reportes" element={<TiposReportes />} />
              <Route path="/tipos-reportes/:id" element={<PermissionProtectedRoute permission="ver_estado"><TipoReporteDetalle /></PermissionProtectedRoute>} />
              <Route path="/tipos-reportes/crear" element={<PermissionProtectedRoute permission="crear_estado"><CrearTipoReporte /></PermissionProtectedRoute>} />
              <Route path="/tipos-reportes/editar/:id" element={<PermissionProtectedRoute permission="editar_estado"><CrearTipoReporte /></PermissionProtectedRoute>} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/:id" element={<PermissionProtectedRoute permission="ver_usuario"><UsuarioDetalle /></PermissionProtectedRoute>} />
              <Route path="/usuarios/crear" element={<PermissionProtectedRoute permission="crear_usuario"><CrearUsuario /></PermissionProtectedRoute>} />
              <Route path="/usuarios/editar/:id" element={<PermissionProtectedRoute permission="editar_usuario"><CrearUsuario /></PermissionProtectedRoute>} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/categorias/:id" element={<PermissionProtectedRoute permission="ver_categoria"><CategoriaDetalle /></PermissionProtectedRoute>} />
              <Route path="/categorias/crear" element={<PermissionProtectedRoute permission="crear_categoria"><CrearCategoria /></PermissionProtectedRoute>} />
              <Route path="/categorias/editar/:id" element={<PermissionProtectedRoute permission="editar_categoria"><CrearCategoria /></PermissionProtectedRoute>} />
              <Route path="/mensajeria" element={<Mensajeria />} />
              <Route path="/notificaciones" element={<Notificaciones />} />
              <Route path="/red-social" element={<RedSocial />} />
              <Route path="/tendencias" element={<TrendingPosts />} />
              <Route path="/usuario/:username" element={<PerfilUsuario />} />
              <Route path="/seguidores" element={<Seguidores />} />
              <Route path="/seguidores/:username" element={<Seguidores />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/configuracion/rastreo" element={<ConfiguracionRastreo />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/perfil/editar" element={<EditarPerfil />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RealTimeTrackingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
