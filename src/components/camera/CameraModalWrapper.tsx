
import React, { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import FullscreenDialog from "@/components/ui/fullscreen-dialog";

interface CameraModalWrapperProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const CameraModalWrapper: React.FC<CameraModalWrapperProps> = ({
  open,
  onClose,
  children
}) => {
  const isMobile = useIsMobile();

  // Enhanced screen orientation handling
  useEffect(() => {
    if (isMobile && open && 'screen' in window && 'orientation' in screen) {
      try {
        (screen.orientation as any).lock('portrait').catch((err: any) => {
          console.warn("Could not lock screen orientation:", err);
        });
      } catch (err) {
        console.warn("Orientation API not supported:", err);
      }
    }

    return () => {
      if ('screen' in window && 'orientation' in screen) {
        try {
          (screen.orientation as any).unlock();
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [isMobile, open]);

  // Use Sheet for mobile and FullscreenDialog for desktop
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={open => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="p-0 h-[100dvh] max-h-[100dvh] bg-black text-white"
        >
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <FullscreenDialog open={open} onOpenChange={open => !open && onClose()}>
      {children}
    </FullscreenDialog>
  );
};

export default CameraModalWrapper;
