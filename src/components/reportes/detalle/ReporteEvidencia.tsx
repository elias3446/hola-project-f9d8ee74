import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Download, ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";

interface ReporteEvidenciaProps {
  imagenes?: string[];
}

export const ReporteEvidencia = ({ imagenes }: ReporteEvidenciaProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null && imagenes) {
      // Navegación circular: si está en la primera, ir a la última
      setSelectedImageIndex(selectedImageIndex === 0 ? imagenes.length - 1 : selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null && imagenes) {
      // Navegación circular: si está en la última, ir a la primera
      setSelectedImageIndex(selectedImageIndex === imagenes.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedImages.length === imagenes?.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(imagenes?.map((_, index) => index) || []);
    }
  };

  const handleBulkDownload = async () => {
    if (!imagenes || selectedImages.length === 0) {
      toast.error("Selecciona al menos una imagen para descargar");
      return;
    }

    toast.info(`Descargando ${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''}...`);

    for (const index of selectedImages) {
      await handleDownload(imagenes[index], index);
      // Pequeña pausa entre descargas para no saturar el navegador
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast.success(`${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''} descargada${selectedImages.length > 1 ? 's' : ''}`);
    setSelectedImages([]);
  };

  if (!imagenes || imagenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Evidencia Fotográfica
          </CardTitle>
          <CardDescription>
            Imágenes adjuntas al reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No hay imágenes adjuntas a este reporte</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evidencia-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando imagen:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Evidencia Fotográfica ({imagenes.length})</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Imágenes adjuntas al reporte
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2">
          {selectedImages.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkDownload}
              className="w-full justify-center"
            >
              <Download className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Descargar ({selectedImages.length})</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            className="w-full justify-center"
          >
            <Checkbox 
              checked={selectedImages.length === imagenes.length}
              className="mr-2 flex-shrink-0"
            />
            <span className="truncate">Seleccionar todas</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imagenes.map((imagen, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted">
              {/* Checkbox de selección */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedImages.includes(index)}
                  onCheckedChange={() => toggleImageSelection(index)}
                  className="bg-white border-2 border-white shadow-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
              
              <img
                src={imagen}
                alt={`Evidencia ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openImage(index)}
                  className="w-32"
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(imagen, index)}
                  className="w-32"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-xs font-medium">Imagen {index + 1}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl p-0">
            <div className="relative bg-black rounded-lg">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white">
                    Evidencia {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} de {imagenes.length}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeDialog}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              {selectedImageIndex !== null && (
                <div className="relative flex items-center justify-center min-h-[70vh] p-16">
                  <img
                    src={imagenes[selectedImageIndex]}
                    alt={`Evidencia ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={goToPrevious}
                  className="pointer-events-auto h-12 w-12 rounded-full bg-white/90 hover:bg-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={goToNext}
                  className="pointer-events-auto h-12 w-12 rounded-full bg-white/90 hover:bg-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* Footer with Download */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => selectedImageIndex !== null && handleDownload(imagenes[selectedImageIndex], selectedImageIndex)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Imagen
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
