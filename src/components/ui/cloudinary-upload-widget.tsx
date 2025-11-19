import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: any) => void;
  onOpenChange?: (open: boolean) => void;
  onUploadStart?: () => void;
  folder?: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedFormats?: string[];
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  buttonClassName?: string;
  cropping?: boolean;
  croppingAspectRatio?: number;
  showLimits?: boolean;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  onOpenChange,
  onUploadStart,
  folder = "uploads",
  maxFiles = 1,
  maxFileSize = 10485760, // 10MB default
  allowedFormats = ["jpg", "png", "jpeg", "gif", "webp"],
  buttonText = "Subir imagen",
  buttonVariant = "default",
  buttonClassName,
  cropping = false,
  croppingAspectRatio,
  showLimits = true,
}: CloudinaryUploadWidgetProps) {
  const cloudinaryRef = useRef<any>();
  const widgetRef = useRef<any>();
  const overlayFixIntervalRef = useRef<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Formatear tamaño de archivo para mostrar
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const limitsText = showLimits 
    ? `Máx: ${formatFileSize(maxFileSize)} • Formatos: ${allowedFormats.join(", ").toUpperCase()}`
    : "";

  useEffect(() => {
    // Load Cloudinary script
    if (!window.cloudinary) {
      const script = document.createElement("script");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        cloudinaryRef.current = window.cloudinary;
      };
    } else {
      cloudinaryRef.current = window.cloudinary;
    }

    return () => {
      // Cleanup
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);

  const openWidget = () => {
    const startOverlayFixer = () => {
      if (overlayFixIntervalRef.current) return;
      let attempts = 0;
      overlayFixIntervalRef.current = window.setInterval(() => {
        attempts++;
        const overlays = Array.from(document.querySelectorAll(
          '#cloudinary-overlay, .cloudinary-widget, .cloudinary_upload_widget, [id^="cloudinary"], [class*="cloudinary"]'
        )) as HTMLElement[];
        if (overlays.length) {
          overlays.forEach((el) => {
            el.removeAttribute('inert');
            el.removeAttribute('aria-hidden');
            el.style.zIndex = '999999';
            el.style.pointerEvents = 'auto';
            // Also ensure ancestors are not aria-hidden by Radix hideOthers
            let p: HTMLElement | null = el.parentElement;
            let hops = 0;
            while (p && hops < 4) { // limit just in case
              if (p.hasAttribute('aria-hidden')) p.removeAttribute('aria-hidden');
              if ((p as any).inert) try { (p as any).inert = false; } catch {}
              p = p.parentElement;
              hops++;
            }
          });
        }
        if (attempts > 50) {
          // ~7.5s max
          if (overlayFixIntervalRef.current) {
            clearInterval(overlayFixIntervalRef.current);
            overlayFixIntervalRef.current = null;
          }
        }
      }, 150);
    };

    if (!cloudinaryRef.current) {
      toast.error("Error al cargar el sistema de subida. Por favor recarga la página.");
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Validate Cloudinary credentials
    if (!cloudName || typeof cloudName !== 'string' || cloudName.length > 100) {
      toast.error("Configuración de subida inválida. Contacta al administrador.");
      return;
    }
    if (!uploadPreset || typeof uploadPreset !== 'string' || uploadPreset.length > 100) {
      toast.error("Configuración de subida inválida. Contacta al administrador.");
      return;
    }

    // Create widget options
    const widgetOptions: any = {
      cloudName,
      uploadPreset,
      folder,
      maxFiles,
      maxFileSize,
      clientAllowedFormats: allowedFormats,
      sources: ["local", "url", "camera"],
      multiple: maxFiles > 1,
      showAdvancedOptions: false,
      showCompletedButton: true,
      styles: {
        palette: {
          window: "hsl(var(--background))",
          windowBorder: "hsl(var(--border))",
          tabIcon: "hsl(var(--primary))",
          menuIcons: "hsl(var(--foreground))",
          textDark: "hsl(var(--foreground))",
          textLight: "hsl(var(--muted-foreground))",
          link: "hsl(var(--primary))",
          action: "hsl(var(--primary))",
          inactiveTabIcon: "hsl(var(--muted-foreground))",
          error: "hsl(var(--destructive))",
          inProgress: "hsl(var(--primary))",
          complete: "hsl(var(--primary))",
          sourceBg: "hsl(var(--card))",
        },
      },
      zIndex: 999999,
    };

    // Add cropping options if enabled
    if (cropping) {
      widgetOptions.cropping = true;
      widgetOptions.showSkipCropButton = false;
      if (croppingAspectRatio) {
        widgetOptions.croppingAspectRatio = croppingAspectRatio;
      }
    }

    // Create or update widget
    if (!widgetRef.current) {
      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        widgetOptions,
        (error: any, result: any) => {
          if (error) {
            console.error("[CloudinaryWidget] Upload error:", error);
            setIsUploading(false);
            
            // Mensajes de error más descriptivos
            let errorMessage = "Error al subir la imagen";
            if (error.message) {
              if (error.message.includes("size")) {
                errorMessage = `La imagen es muy grande. Máximo permitido: ${formatFileSize(maxFileSize)}`;
              } else if (error.message.includes("format")) {
                errorMessage = `Formato no permitido. Usa: ${allowedFormats.join(", ").toUpperCase()}`;
              } else {
                errorMessage = error.message;
              }
            }
            toast.error(errorMessage);
            
            onUploadError?.(error);
            onOpenChange?.(false);
            if (overlayFixIntervalRef.current) {
              clearInterval(overlayFixIntervalRef.current);
              overlayFixIntervalRef.current = null;
            }
            return;
          }

          if (!result) return;

          console.log("[CloudinaryWidget] Event:", result.event, "info:", result.info);

          // Track upload start
          if (result.event === "upload-added") {
            setIsUploading(true);
            onUploadStart?.();
            toast.info("Subiendo imagen...");
          }

          // Track display changes (open/close)
          if (result.event === "display-changed") {
            const info = result.info as any;
            const isShown =
              info === "shown" ||
              info === "open" ||
              info?.event === "shown" ||
              info?.isDisplayed === true ||
              info?.visible === true;

            onOpenChange?.(!!isShown);

            if (isShown) {
              startOverlayFixer();
            } else {
              // Widget was hidden
              if (overlayFixIntervalRef.current) {
                clearInterval(overlayFixIntervalRef.current);
                overlayFixIntervalRef.current = null;
              }
            }
          }

          // Consider these events as closing the widget
          if (
            result.event === "close" ||
            result.event === "abort" ||
            result.event === "queues-end"
          ) {
            setIsUploading(false);
            onOpenChange?.(false);
            if (overlayFixIntervalRef.current) {
              clearInterval(overlayFixIntervalRef.current);
              overlayFixIntervalRef.current = null;
            }
          }

          if (result.event === "success") {
            console.log("[CloudinaryWidget] Upload successful:", result.info);
            setIsUploading(false);
            toast.success("Imagen subida exitosamente");
            onUploadSuccess?.(result.info);
            onOpenChange?.(false);
            if (overlayFixIntervalRef.current) {
              clearInterval(overlayFixIntervalRef.current);
              overlayFixIntervalRef.current = null;
            }
          }
        }
      );
    }

    widgetRef.current.open();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            onClick={openWidget}
            disabled={isUploading}
            className={cn("gap-2", buttonClassName)}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>
        </TooltipTrigger>
        {showLimits && limitsText && (
          <TooltipContent>
            <p className="text-xs">{limitsText}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
