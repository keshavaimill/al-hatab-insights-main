import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  /**
   * Extra classes for the thumbnail image
   */
  thumbnailClassName?: string;
}

export const ImageLightbox = ({ src, alt, thumbnailClassName }: ImageLightboxProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle Escape key + prevent background scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <>
      {/* Thumbnail / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        <img
          src={src}
          alt={alt}
          className={`w-full rounded border border-border/50 object-contain transition-transform duration-200 group-hover:scale-[1.01] ${thumbnailClassName || ""}`}
        />
        <div className="absolute inset-0 rounded bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
        <div className="absolute right-2 top-2 flex items-center justify-center w-7 h-7 rounded-full bg-background/90 text-foreground shadow-md opacity-80 group-hover:opacity-100 transition-opacity duration-200">
          <Maximize2 className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Lightbox modal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto animate-in zoom-in-95 duration-200 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={close}
                className="absolute -right-3 -top-3 z-10 w-8 h-8 rounded-full bg-background text-foreground shadow-lg flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Close image"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={src}
                alt={alt}
                className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain bg-background"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};


