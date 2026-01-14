import React, { useRef, useEffect, useCallback } from 'react';

interface DraggablePiPProps {
  onCameraStatus?: (status: string) => void;
}

const DraggablePiP: React.FC<DraggablePiPProps> = ({ onCameraStatus }) => {
  const pipRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    (e.target as HTMLElement).style.cursor = 'grabbing';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const parentRect = (containerRef.current.parentNode as HTMLElement).getBoundingClientRect();
    let newX = e.clientX - offset.current.x - parentRect.left;
    let newY = e.clientY - offset.current.y - parentRect.top;

    newX = Math.max(0, Math.min(newX, parentRect.width - containerRef.current.offsetWidth));
    newY = Math.max(0, Math.min(newY, parentRect.height - containerRef.current.offsetHeight));

    containerRef.current.style.left = `${newX}px`;
    containerRef.current.style.top = `${newY}px`;
  }, []);

  const handleMouseUp = (e: MouseEvent) => {
    isDragging.current = false;
    if (e.target instanceof HTMLElement) {
      e.target.style.cursor = 'grab';
    }
  };
  
  useEffect(() => {
    const currentPipRef = pipRef.current;
    onCameraStatus?.('📹 Acessando câmera...');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (currentPipRef) {
          currentPipRef.srcObject = stream;
          onCameraStatus?.('✅ Conectado');
        }
      })
      .catch(err => {
        console.error("PiP Camera Error:", err);
        onCameraStatus?.('❌ Erro na câmera');
      });
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (currentPipRef?.srcObject) {
        (currentPipRef.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [handleMouseMove, onCameraStatus]);

  return (
    <div 
      ref={containerRef} 
      onMouseDown={handleMouseDown} 
      className="absolute bottom-28 right-4 w-48 h-48 z-40 rounded-full overflow-hidden shadow-2xl border-4 border-purple-500 cursor-grab"
    >
      <video ref={pipRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
    </div>
  );
};

export default DraggablePiP;
