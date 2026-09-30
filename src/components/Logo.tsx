import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'compact' | 'icon';
  theme?: 'dark' | 'light' | 'monochrome';
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-12 h-12',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}>
      <img
        src="/logo.png"
        alt="Taller Automotriz Rodríguez Rodríguez"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};
