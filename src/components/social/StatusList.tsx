import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Plus } from "lucide-react";
import { Estado } from "@/hooks/useEstados";
import { useAuth } from "@/hooks/useAuth";

interface StatusListProps {
  misEstados: Estado[];
  estados: Estado[];
  onViewStatus: (estados: Estado[], index: number) => void;
  onCreateStatus: () => void;
}

export const StatusList = ({ misEstados, estados, onViewStatus, onCreateStatus }: StatusListProps) => {
  const { profile } = useAuth();

  // Agrupar estados de otros usuarios por user_id
  const estadosAgrupados = estados.reduce((acc, estado) => {
    const userId = estado.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(estado);
    return acc;
  }, {} as Record<string, Estado[]>);

  // Convertir a array y ordenar por fecha más reciente
  const gruposDeEstados = Object.values(estadosAgrupados).map(grupo => {
    return grupo.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  return (
    <div className="mb-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Estados</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Botón crear estado */}
          <div 
            className="flex-shrink-0 w-[120px] h-[180px] rounded-xl overflow-hidden cursor-pointer group relative bg-muted hover:opacity-90 transition-opacity"
            onClick={onCreateStatus}
          >
            <div className="h-[135px] relative">
              <img 
                src={profile?.avatar || '/placeholder.svg'} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-[45px] flex items-center justify-center bg-muted/50 relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full p-2 border-4 border-muted">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold mt-2">Crear estado</p>
            </div>
          </div>

          {/* Mis estados agrupados */}
          {misEstados.length > 0 && (
            <div
              className="flex-shrink-0 w-[120px] h-[180px] rounded-xl overflow-hidden cursor-pointer group relative hover:scale-105 transition-transform"
              onClick={() => onViewStatus(misEstados, 0)}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              {misEstados[0].imagenes && misEstados[0].imagenes.length > 0 ? (
                <img 
                  src={misEstados[0].imagenes[0]} 
                  alt="Estado" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center p-3">
                  <p className="text-white text-sm text-center font-medium line-clamp-4">
                    {misEstados[0].contenido}
                  </p>
                </div>
              )}
              <div className="absolute top-3 left-3 z-20">
                <div className="rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                  <div className="rounded-full overflow-hidden bg-transparent">
                    <UserAvatar
                      avatar={profile?.avatar}
                      name={profile?.name}
                      username={profile?.username}
                      size="sm"
                      showName={false}
                      className="bg-transparent"
                      enableModal={false}
                    />
                  </div>
                </div>
              </div>
              {misEstados.length > 1 && (
                <div className="absolute top-3 right-3 z-20 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {misEstados.length}
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 z-20">
                <p className="text-white text-xs font-semibold drop-shadow-lg">
                  {profile?.name || profile?.username || 'Tu estado'}
                </p>
              </div>
            </div>
          )}

          {/* Estados de otros usuarios agrupados */}
          {gruposDeEstados.map((grupoEstados) => {
            const estadoMasReciente = grupoEstados[0];
            const tieneMultiples = grupoEstados.length > 1;
            
            return (
              <div
                key={estadoMasReciente.user_id}
                className="flex-shrink-0 w-[120px] h-[180px] rounded-xl overflow-hidden cursor-pointer group relative hover:scale-105 transition-transform"
                onClick={() => onViewStatus(grupoEstados, 0)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
                {estadoMasReciente.imagenes && estadoMasReciente.imagenes.length > 0 ? (
                  <img 
                    src={estadoMasReciente.imagenes[0]} 
                    alt="Estado" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-3">
                    <p className="text-white text-sm text-center font-medium line-clamp-4">
                      {estadoMasReciente.contenido}
                    </p>
                  </div>
                )}
                <div className="absolute top-3 left-3 z-20">
                  <div className="rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                    <div className="rounded-full overflow-hidden bg-transparent">
                      <UserAvatar
                        avatar={estadoMasReciente.profiles?.avatar}
                        name={estadoMasReciente.profiles?.name}
                        username={estadoMasReciente.profiles?.username}
                        size="sm"
                        showName={false}
                        className="bg-transparent"
                        enableModal={false}
                      />
                    </div>
                  </div>
                </div>
                {tieneMultiples && (
                  <div className="absolute top-3 right-3 z-20 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {grupoEstados.length}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <p className="text-white text-xs font-semibold drop-shadow-lg truncate">
                    {estadoMasReciente.profiles?.name || estadoMasReciente.profiles?.username || 'Usuario'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
