import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'compact' | 'icon';
  theme?: 'dark' | 'light' | 'monochrome';
}

export const Logo: React.FC<LogoProps> = ({
  className = 'w-12 h-12',
  showText = true,
  variant = 'full',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const carColor = isDark ? '#FFFFFF' : '#0F172A';
  const bgWindow = isDark ? '#0A0A0C' : '#F8FAFC';

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 160 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Streamlined car profile icon */}
          <path
            d="M 12 48 C 18 42, 28 36, 40 32 C 55 27, 72 16, 95 16 C 115 16, 138 20, 148 30 C 152 34, 150 44, 142 46 C 138 47, 137 54, 142 56 C 145 57, 145 61, 140 61 L 132 61 C 130 52, 122 46, 114 46 C 105 46, 98 52, 96 61 L 62 61 C 60 52, 52 46, 43 46 C 34 46, 27 52, 25 61 L 16 61 C 12 59, 10 54, 12 48 Z"
            fill={carColor}
          />
          {/* Windows */}
          <path d="M 64 22 L 92 22 L 92 34 L 54 34 Z" fill={bgWindow} />
          <path d="M 96 22 L 126 24 C 130 28, 132 31, 134 34 L 96 34 Z" fill={bgWindow} />
          {/* Wheels */}
          <circle cx="43" cy="61" r="7" fill={carColor} />
          <circle cx="114" cy="61" r="7" fill={carColor} />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="w-full aspect-square max-w-[500px] flex items-center justify-center relative">
        <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          {/* Background if dark */}
          {isDark && <rect width="800" height="800" rx="16" fill="#050507" />}
          
          <g fill={carColor}>
            {/* Aerodynamic Hatchback Silhouette */}
            <path d="M 68 348 
                     C 74 340, 88 328, 102 322 
                     C 114 316, 128 304, 150 292
                     C 178 280, 222 265, 258 252
                     C 278 245, 330 220, 396 200
                     C 410 196, 475 194, 520 195
                     C 570 196, 615 198, 642 201
                     C 660 203, 672 204, 715 204
                     C 740 204, 755 206, 758 209
                     C 762 214, 742 220, 715 224
                     C 690 227, 676 230, 675 233
                     C 673 240, 692 278, 716 304
                     C 724 312, 728 320, 729 332
                     C 730 348, 716 358, 694 360
                     C 684 361, 680 365, 680 375
                     C 680 388, 692 396, 724 400
                     C 738 402, 742 405, 742 414
                     C 742 422, 735 428, 720 430
                     L 700 432
                     C 698 428, 688 380, 682 376
                     C 674 370, 660 370, 640 370
                     L 636 366
                     C 636 366, 646 320, 644 310
                     C 640 295, 620 286, 600 286
                     L 500 286
                     L 500 206
                     C 460 206, 420 208, 400 212
                     C 360 220, 310 248, 280 268
                     C 276 270, 274 274, 276 280
                     C 280 288, 290 294, 304 298
                     C 328 304, 336 322, 324 336
                     C 318 344, 308 348, 286 350
                     L 242 352
                     C 240 346, 230 338, 214 338
                     C 192 338, 168 346, 150 354
                     C 134 362, 120 376, 114 388
                     L 100 390
                     C 86 388, 72 384, 62 376
                     C 52 368, 56 355, 68 348 Z" />

            {/* Window cuts */}
            <path d="M 334 290 C 358 244, 388 222, 420 216 L 486 216 L 486 288 L 348 290 Z" fill={bgWindow} />
            <path d="M 498 216 L 624 218 C 638 238, 650 264, 658 288 L 498 288 Z" fill={bgWindow} />

            {/* Side Mirror */}
            <path d="M 288 300 C 310 298, 332 310, 334 326 C 334 336, 316 342, 296 340 C 278 338, 272 324, 278 312 C 280 306, 284 302, 288 300 Z" fill={carColor} />
            
            {/* Handle & Details */}
            <rect x="440" y="340" width="34" height="12" rx="6" fill={bgWindow} />
            <circle cx="466" cy="346" r="3" fill={carColor} />

            {/* Headlight & Taillight Cutouts */}
            <path d="M 72 356 C 80 350, 112 346, 122 356 C 114 370, 84 374, 72 356 Z" fill={bgWindow} />
            <path d="M 686 340 C 700 340, 714 348, 712 364 C 698 368, 684 360, 686 340 Z" fill={bgWindow} />
          </g>

          {showText && (
            <g fill={textColor} textAnchor="middle" fontWeight="900" fontStyle="italic">
              <text x="400" y="445" fontSize="76" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="4">TALLER</text>
              <text x="400" y="505" fontSize="54" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="5">AUTOMOTRIZ</text>
              <text x="400" y="580" fontSize="64" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="3">RODRIGUEZ RODRIGUEZ</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
