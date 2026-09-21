import React from 'react';

export interface BrandIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  variant?: 'badge' | 'icon';
  withGlow?: boolean;
}

const sizeMap = {
  xs: 18,
  sm: 24,
  md: 36,
  lg: 48,
  xl: 64,
};

export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  className = '',
  variant = 'badge',
  withGlow = true,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 36;
  const borderRadius = Math.max(4, Math.round(pixelSize * 0.22));

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none transition-transform duration-200 ${
        variant === 'badge'
          ? `bg-black border border-white/20 ${withGlow ? 'shadow-[0_0_15px_rgba(0,229,170,0.22)]' : ''}`
          : ''
      } ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: variant === 'badge' ? borderRadius : borderRadius / 2,
      }}
    >
      <img
        src="/favicon.png"
        alt="NEET"
        width={pixelSize}
        height={pixelSize}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );
};

export default BrandIcon;
