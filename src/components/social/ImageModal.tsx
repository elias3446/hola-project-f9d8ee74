import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  src: string;
  alt?: string;
  className?: string;
  onOpen?: () => void;
}

export const ImageModal = ({ src, alt = "Imagen", className, onOpen }: ImageModalProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
    onOpen?.();
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn("cursor-pointer hover:opacity-90 transition-opacity", className)}
        onClick={handleImageClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
