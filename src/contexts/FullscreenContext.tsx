import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FullscreenContextType {
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  isQuizFullscreen: boolean;
  setIsQuizFullscreen: (fullscreen: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
};

interface FullscreenProviderProps {
  children: ReactNode;
}

export const FullscreenProvider: React.FC<FullscreenProviderProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQuizFullscreen, setIsQuizFullscreen] = useState(false);

  // Listen for browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If exiting fullscreen, also reset quiz fullscreen
      if (!isCurrentlyFullscreen) {
        setIsQuizFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const value = {
    isFullscreen,
    setIsFullscreen,
    isQuizFullscreen,
    setIsQuizFullscreen,
  };

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
};
