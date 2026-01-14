
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PreviewFrameProps {
  code: string;      // Fallback for legacy mode
  url?: string | null; // WebContainer Server URL
  className?: string;
  reloadSignal?: number; // Trigger for live reload
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({ code, url, reloadSignal = 0, className = "" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevSignalRef = useRef(reloadSignal);

  useEffect(() => {
    // Legacy Mode: If no URL, inject code directly
    if (!url && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code, url]);

  // Handle Live Reload Signal
  useEffect(() => {
    if (reloadSignal !== prevSignalRef.current) {
      prevSignalRef.current = reloadSignal;
      if (url && iframeRef.current) {
        try {
           // Force reload by re-assigning src. This is more robust than location.reload()
           // for cross-origin/sandboxed iframes in some environments.
           iframeRef.current.src = iframeRef.current.src;
        } catch (e) {
           console.error("Preview reload failed", e);
        }
      }
    }
  }, [reloadSignal, url]);

  return (
    <div className={`bg-white overflow-hidden relative ${className}`}>
      {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            title="Aether WebContainer Preview"
            className="w-full h-full border-0 block" 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
      ) : (
          <iframe
            ref={iframeRef}
            title="Aether Static Preview"
            className="w-full h-full border-0 block" 
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
      )}
      
      {url && !iframeRef.current && (
           /* Optional overlay if needed for loading states, but iframe usually handles it */
           null
      )}
    </div>
  );
};
