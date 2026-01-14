import * as React from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType | null>(null);

interface SheetProps {
  children: React.ReactNode;
}

export const Sheet = ({ children }: SheetProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger = ({ children }: { children: React.ReactNode }) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger must be used within Sheet");

  return (
    <div onClick={() => context.setOpen(true)} className="cursor-pointer inline-block">
      {children}
    </div>
  );
};

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}

import { createPortal } from "react-dom";

// ... existing imports

export const SheetContent = ({ children, className = "bg-background", side = "right" }: SheetContentProps) => {
  const context = React.useContext(SheetContext);
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  if (!context) throw new Error("SheetContent must be used within Sheet");

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close sheet on route change
  React.useEffect(() => {
    const handleRouteChange = () => {
      context.setOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [context, router]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {context.open && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            onClick={() => context.setOpen(false)}
          />

          {/* Sheet Panel */}
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-y-0 ${side === "right" ? "right-0 border-l" : "left-0 border-r"} z-[100] h-full w-3/4 max-w-sm p-6 shadow-2xl transition-all duration-300 ease-in-out border-white/10 ${className}`}
          >
            <div className="flex flex-col h-full">
              {/* Close Button defined absolutely or relative */}
              <button
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => context.setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content Container - Allow scrolling if content is long */}
              <div className="flex-1 overflow-y-auto mt-8">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};


