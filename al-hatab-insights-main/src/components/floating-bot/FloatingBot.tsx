import { useState } from "react";
import { ChatWindow } from "./ChatWindow";

export const FloatingBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40" style={{ width: '48px', height: '48px' }}>
        {/* Ripple Effects */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: '120px', height: '120px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="ripple-1 absolute rounded-full border-2 border-primary/30"></div>
          <div className="ripple-2 absolute rounded-full border-2 border-primary/20"></div>
          <div className="ripple-3 absolute rounded-full border-2 border-primary/10"></div>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group overflow-hidden touch-manipulation"
          aria-label="Open AI Gennie chat"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <img
            src="/image.png"
            alt="AI Gennie"
            className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover object-center group-hover:scale-105 transition-transform duration-300 select-none"
            style={{ 
              imageRendering: 'auto',
              willChange: 'transform'
            }}
            loading="eager"
            draggable="false"
            onError={(e) => {
              // Fallback if image doesn't load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.parentElement) {
                const fallback = document.createElement('div');
                fallback.className = 'relative z-10 w-10 h-10 flex items-center justify-center';
                fallback.innerHTML = `
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                `;
                target.parentElement.appendChild(fallback);
              }
            }}
          />
        </button>
      </div>

      {/* Chat Window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};


