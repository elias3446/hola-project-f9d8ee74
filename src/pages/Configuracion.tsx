import { Layout } from "@/components/Layout";
import { Settings, Navigation, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Configuracion = () => {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      title: "Rastreo en Tiempo Real",
      description: "Configurar notificaciones de proximidad a reportes",
      icon: Navigation,
      path: "/configuracion/rastreo",
    },
  ];

  return (
    <Layout title="Configuración" icon={Settings}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-muted-foreground">Personaliza las opciones del sistema</p>
        </div>

        <div className="grid gap-4">
          {settingsOptions.map((option) => (
            <Card
              key={option.path}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(option.path)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <option.icon className="h-5 w-5" />
                    {option.title}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Configuracion;
