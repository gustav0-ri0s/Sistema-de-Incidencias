
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ className = "w-16 h-16" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/images/logo.png"
        alt="VC Tarapoto Logo"
        className="w-full h-full object-contain drop-shadow-sm"
      />
    </div>
  );
};

export default Logo;
